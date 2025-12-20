from app import storage, dataset
from app import image_classifier as ic
from app.text_rules import is_abusive, detect_category, detect_urgency
import re

# Profanity detection
import warnings
# Suppress pkg_resources deprecation warnings globally (they're just warnings, not errors)
warnings.filterwarnings("ignore", category=UserWarning, message=".*pkg_resources.*")

PROFANITY_AVAILABLE = False
_profanity_predict = None
try:
    from profanity_check import predict as _profanity_predict
    # Test that it works with a known profane word
    _test_result = _profanity_predict(["fuck"])
    # Check if result is valid (should be numpy array or list with 1)
    if _test_result is not None:
        PROFANITY_AVAILABLE = True
except ImportError:
    # Library truly not installed
    pass  # Silently fall back to keyword-based detection
except Exception as e:
    # Any other import/runtime error - silently fall back
    PROFANITY_AVAILABLE = False
    _profanity_predict = None

# Category-scoped urgent keywords (same methodology as CATEGORY_KEYWORDS)
# Keep a Global bucket to preserve previous behavior while enabling per-category tuning
URGENT_KEYWORDS = {
    "Global": [
        # Road & Transport
        "accident", "collision", "roadblock", "traffic jam", "hit and run",
        "bridge collapse", "pothole accident", "road caved in",

        # Fire & Hazard
        "fire", "burning", "smoke", "blast", "explosion", "short circuit",
        "gas leak", "electric spark", "transformer burst",

        # Water & Flood
        "flood", "waterlogging", "sewage overflow", "pipe burst",
        "drain blocked", "heavy rain", "overflowing drain", "contaminated water",

        # Health & Sanitation
        "garbage overflow", "dead animal", "toxic smell", "mosquito breeding",
        "epidemic", "dengue outbreak", "cholera", "sanitation hazard","dead","death"

        # Safety & Security
        "violence", "crime", "theft", "fight", "robbery", "public hazard",
        "building collapse", "wall collapse", "tree fallen", "landslide",

        # Other Civic Emergencies
        "power outage", "electric shock", "streetlight sparks",
        "ambulance needed", "emergency help"
    ],
    # Per-category overrides/extensions (can be expanded as needed)
    "Road & Traffic": ["accident", "collision", "roadblock", "pothole"],
    "Water & Drainage": ["flood", "waterlogging", "sewage overflow", "pipe burst"],
    "Electricity": ["power outage", "short circuit", "electric shock"],
    "Garbage & Sanitation": ["garbage overflow", "toxic smell","dead","death"],
    "Street Lighting": ["streetlight sparks", "dark area"],
    "Public Safety": ["violence", "robbery", "fire"],
    "Parks & Recreation": ["tree fallen"],
    "Other": []
}


# optional model availability flags are handled inside image_classifier

def initialize_models():
    # initialize image classifier (CLIP) if available
    try:
        ic.initialize_clip()
    except Exception:
        pass

def classify_report(report: dict):
    try:
        if not report:
            return {
                "report_id": "unknown",
                "status": "rejected",
                "reason": "Empty report data"
            }
        
        desc = (report.get("description") or "").strip()
        desc_lower = desc.lower()
        
        if not desc:
            return {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "reason": "Description is required"
            }
        
        # Auto-detect category from description
        cat = detect_category(desc)
        
        # Auto-reject if category is "Other"
        if cat == "Other":
            result = {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "category": cat,
                "department": cat,
                "reason": "Unable to determine issue category from description"
            }
            dataset.save_report({**report, **result})
            return result

        # 1. Reject if abusive (using text_rules + profanity-check library)
        # Use text_rules.is_abusive() as primary check
        is_profane_keywords = is_abusive(desc)
        
        # Also try ML model if available
        is_profane_ml = False
        if PROFANITY_AVAILABLE and _profanity_predict is not None:
            try:
                # profanity_check.predict returns a numpy array with 1 for profane, 0 for clean
                predictions = _profanity_predict([desc])
                # Handle numpy array, list, or scalar returns
                if hasattr(predictions, '__getitem__') and len(predictions) > 0:
                    is_profane_ml = bool(int(predictions[0]) == 1)
                elif hasattr(predictions, 'item'):
                    is_profane_ml = bool(int(predictions.item()) == 1)
                else:
                    is_profane_ml = bool(int(predictions) == 1)
            except Exception:
                # If profanity_check fails at runtime, just use keyword check
                pass
        
        # Reject if EITHER detection method finds profanity
        is_profane = is_profane_keywords or is_profane_ml
        
        if is_profane:
            result = {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "category": cat,
                "department": cat,
                "reason": "Abusive language detected"
            }
            dataset.save_report({**report, **result})
            return result

        # 2. Image-description validation (if image provided)
        image_url = report.get("image_url")
        if image_url:
            try:
                image_cat = ic.classify_image(image_url)
                image_label = str(image_cat).lower() if image_cat else "other"
                
                # Map image labels to categories
                IMAGE_TO_CATEGORY_MAP = {
                    "Road & Traffic": [
                        "pothole", "damaged road", "illegal parking", "broken footpath",
                        "traffic signal not working", "road accident", "road", "street", "traffic",
                        "speed breaker", "crosswalk", "footpath", "pavement"
                    ],
                    "Garbage & Sanitation": [
                        "garbage dump", "overflowing dustbin", "open drain", "sewage overflow",
                        "dead animal", "toilet issue", "garbage", "trash", "waste", "bin",
                        "sanitation", "dirty", "sewage", "cleanliness", "dustbin"
                    ],
                    "Street Lighting": [
                        "streetlight not working", "fallen electric pole", "loose wire", "power outage",
                        "streetlight", "lamp", "bulb", "pole", "light", "electric pole",
                        "street lamp", "lighting", "dark area", "electricity", "power",
                        "broken streetlight", "non-working light", "flickering light", "dim light",
                        "street lighting", "outdoor lighting", "public lighting", "night lighting"
                    ],
                    "Water & Drainage": [
                        "waterlogging", "pipe burst", "no water supply", "drainage issue", "flood",
                        "drain", "drainage", "sewage", "sewer", "leak", "leaking", "leakage",
                        "pipe", "water", "overflow", "water supply", "drainage system"
                    ],
                    "Parks & Recreation": [
                        "tree fallen", "illegal construction", "park maintenance", "encroachment",
                        "park", "garden", "playground", "tree", "bench", "grass", "lawn",
                        "recreation", "green space", "park area", "garden area", "flooded park",
                        "water in park", "park with water", "playground equipment", "walking path",
                        "fountain", "pond", "lake", "outdoor space", "public space"
                    ],
                    "Public Safety": [
                        "fire", "gas leak", "building collapse", "accident site",
                        "crime", "robbery", "theft", "violence", "hazard", "danger",
                        "safety", "harassment", "emergency", "accident"
                    ],
                    "Electricity": [
                        "electric", "electricity", "power", "outage", "wire", "transformer",
                        "short circuit", "shock", "cable", "meter", "electrical", "voltage", "current"
                    ]
                }
                
                # Check if image label matches detected category
                allowed_labels = [label.lower() for label in IMAGE_TO_CATEGORY_MAP.get(cat, [])]
                image_matches_category = any(label in image_label or image_label in label for label in allowed_labels)
                
                if not image_matches_category:
                    result = {
                        "report_id": report.get("report_id", "unknown"),
                        "accept": False,
                        "status": "rejected",
                        "category": cat,
                        "department": cat,
                        "reason": "Image does not match the issue description. Please provide an image related to the reported issue."
                    }
                    dataset.save_report({**report, **result})
                    return result
            except Exception as e:
                # If image classification fails, reject to be safe
                print(f"Image validation failed: {str(e)}")
                result = {
                    "report_id": report.get("report_id", "unknown"),
                    "accept": False,
                    "status": "rejected",
                    "category": cat,
                    "department": cat,
                    "reason": "Unable to validate image. Please ensure the image is related to the issue description."
                }
                dataset.save_report({**report, **result})
                return result

        # 3. Image duplicate detection (check independently)
        if image_url:
            try:
                image_dup = storage.is_duplicate_image(image_url, threshold=3, store=False)
                if image_dup:
                    result = {
                        "report_id": report.get("report_id", "unknown"),
                        "accept": False,
                        "status": "rejected",
                        "category": cat,
                        "department": cat,
                        "reason": "Duplicate image detected. This image has already been used in another report."
                    }
                    dataset.save_report({**report, **result})
                    return result
                # Store image hash for future duplicate detection
                storage.is_duplicate_image(image_url, threshold=3, store=True)
            except Exception as e:
                print(f"Image duplicate check failed: {str(e)}")
                # Continue if duplicate check fails (don't block legitimate reports)

        # 4. Detect urgency using text_rules
        urgency = detect_urgency(desc)
        
        # Map urgency to priority (Issue model accepts: 'low', 'medium', 'high', 'urgent')
        urgency_map = {
            "high": "urgent",
            "medium": "medium",
            "low": "low"
        }
        priority = urgency_map.get(urgency, "medium")
        
        # Return accepted result with all required fields
        result = {
            "report_id": report.get("report_id", "unknown"),
            "accept": True,
            "status": "accepted",
            "category": cat,
            "department": cat,  # Department same as category for routing
            "urgency": urgency,
            "priority": priority,
            "reason": "Report accepted successfully"
        }
        dataset.save_report({**report, **result})
        return result
    except Exception as e:
        print(f"Error in classify_report: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            "report_id": report.get("report_id", "unknown"),
            "accept": False,
            "status": "rejected",
            "category": "Other",
            "department": "Other",
            "reason": f"Processing error: {str(e)}"
        }
