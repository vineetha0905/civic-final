from PIL import Image
import imagehash
import requests
import io
from math import radians, cos, sin, asin, sqrt

# In-memory stores (ephemeral - reset on server restart)
seen_reports = set()
seen_image_hashes = []   # store imagehash objects
seen_image_urls = set()  # store image URLs for quick exact match check
seen_locations = []  # list of tuples (lat, lon, description, category)

def is_duplicate(user_id: str, description: str, category: str, store: bool = True) -> bool:
    """
    Check if this exact report has been submitted before.
    Only returns True for exact matches (same user, same description, same category).
    Set store=False to check without storing (for validation before acceptance).
    """
    # Normalize the description - remove extra whitespace
    normalized_desc = " ".join(description.strip().lower().split())
    key = (user_id or "anon", normalized_desc, category.lower())
    
    if key in seen_reports:
        return True
    
    # Only store if explicitly requested (to avoid false positives)
    if store:
        seen_reports.add(key)
    return False

def is_duplicate_image(image_url: str, threshold: int = 0, store: bool = True) -> bool:
    """Check if an image is a duplicate using URL first, then perceptual hash (pHash).
    threshold = maximum Hamming distance allowed to consider images equal.
    threshold=0 means EXACT hash match only (most strict).
    Set store=False to check without storing (for validation before acceptance).
    """
    if not image_url:
        return False
    
    # Step 1: Quick URL-based check (exact match)
    # Normalize URL (remove query params, fragments that don't affect image)
    try:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(image_url)
        # Remove query and fragment for comparison (they don't change the image)
        normalized_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
        
        if normalized_url in seen_image_urls:
            print(f"Duplicate detected: Exact URL match for {normalized_url}")
            return True
    except Exception as e:
        print(f"URL normalization failed: {str(e)}")
        # Continue with hash check
    
    # Step 2: Hash-based check (only for exact matches with threshold=0)
    try:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert('RGB')
        img_hash = imagehash.phash(img)

        # Only check for EXACT matches (threshold=0) to avoid false positives
        # This means only identical images are considered duplicates
        for h in seen_image_hashes:
            # With threshold=0, only exact hash matches are duplicates
            if abs(img_hash - h) == 0:
                print(f"Duplicate detected: Exact hash match")
                return True

        # Only store if explicitly requested and not a duplicate
        if store:
            seen_image_hashes.append(img_hash)
            try:
                from urllib.parse import urlparse, urlunparse
                parsed = urlparse(image_url)
                normalized_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
                seen_image_urls.add(normalized_url)
            except:
                pass  # If URL normalization fails, still store hash
        
        return False
    except Exception as e:
        # On any failure to fetch/process image, treat as non-duplicate
        # Log the error for debugging but don't block submission
        print(f"Image hash check failed for {image_url}: {str(e)}")
        return False

def haversine(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two lat/lon points in meters."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1
    a = sin(delta_lat/2)**2 + cos(lat1) * cos(lat2) * sin(delta_lon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Earth radius in meters
    return c * r

def is_duplicate_location(lat: float, lon: float, description: str, category: str, threshold: float = 2.0, store: bool = True) -> bool:
    """
    Return True if an existing report with EXACT same text+category exists within threshold meters.
    This is VERY strict - requires exact text match and extremely close location (default 2 meters).
    Set store=False to check without storing (for validation before acceptance).
    threshold can be a float for more precise control (e.g., 1.5 meters).
    """
    try:
        # Normalize description for comparison (exact match required)
        normalized_desc = " ".join(description.strip().lower().split())
        
        for (lat0, lon0, desc0, cat0) in seen_locations:
            # Require EXACT text match (normalized) and same category
            normalized_desc0 = " ".join(desc0.strip().lower().split())
            if normalized_desc0 == normalized_desc and cat0.lower() == category.lower():
                dist = haversine(lat, lon, lat0, lon0)
                # Only consider duplicate if extremely close (threshold meters) with exact same text
                if dist <= threshold:
                    return True
        # Not duplicate — store this location only if explicitly requested
        if store:
            seen_locations.append((lat, lon, description, category))
        return False
    except Exception as e:
        # On error, don't block submission - be permissive
        print(f"Location duplicate check failed: {str(e)}")
        return False
