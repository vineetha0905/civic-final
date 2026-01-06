/**
 * Default placeholder image for issues/reports without uploaded images
 * Using a simple data URI for a gray placeholder with icon
 */
export const DEFAULT_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='Arial, sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Checks if a value is a valid, non-null URL string
 * @param {any} value - The value to check
 * @returns {boolean} True if valid URL string
 */
const isValidUrlString = (value) => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') return false;
  return true;
};

/**
 * Gets the image URL for an issue/report with fallback to placeholder
 * @param {Object} issue - The issue/report object
 * @returns {string} Image URL or placeholder URL
 */
export const getIssueImageUrl = (issue) => {
  try {
    if (!issue) {
      console.warn('[imageUtils] No issue provided');
      return DEFAULT_PLACEHOLDER_IMAGE;
    }
    
    // CRITICAL: Check images array FIRST (primary source based on Issue model)
    // This is the most common case - images are stored in an array
    if (issue.images) {
      if (Array.isArray(issue.images) && issue.images.length > 0) {
        const first = issue.images[0];
        
        // If first item is a string (URL), use it directly
        if (typeof first === 'string' && isValidUrlString(first)) {
          console.log('[imageUtils] ✓ Found image from issue.images[0] (string):', first.substring(0, 50) + '...');
          return first;
        }
        
        // If first item is an object, extract URL from common properties
        if (typeof first === 'object' && first !== null) {
          // Try multiple possible URL property names
          const url = first.url || first.secure_url || first.secureUrl || first.imageUrl || first.path || first.src;
          
          if (isValidUrlString(url)) {
            console.log('[imageUtils] ✓ Found image from issue.images[0].url:', url.substring(0, 50) + '...');
            return url;
          } else {
            console.warn('[imageUtils] ✗ images[0] object exists but no valid URL found:', {
              hasUrl: !!first.url,
              urlValue: first.url,
              hasSecureUrl: !!first.secure_url,
              objectKeys: Object.keys(first)
            });
          }
        }
      } else {
        console.warn('[imageUtils] ✗ issue.images exists but is empty or not an array:', {
          isArray: Array.isArray(issue.images),
          length: Array.isArray(issue.images) ? issue.images.length : 'N/A',
          type: typeof issue.images,
          value: issue.images
        });
      }
    }
    
    // Check direct image properties as fallback (image, imageUrl, photo, imagePath)
    if (isValidUrlString(issue.image)) {
      console.log('[imageUtils] ✓ Found image from issue.image');
      return issue.image;
    }
    if (isValidUrlString(issue.imageUrl)) {
      console.log('[imageUtils] ✓ Found image from issue.imageUrl');
      return issue.imageUrl;
    }
    if (isValidUrlString(issue.photo)) {
      console.log('[imageUtils] ✓ Found image from issue.photo');
      return issue.photo;
    }
    if (isValidUrlString(issue.imagePath)) {
      console.log('[imageUtils] ✓ Found image from issue.imagePath');
      return issue.imagePath;
    }
    
    // Debug: log what we found
    console.warn('[imageUtils] ✗ No valid image found. Issue structure:', {
      hasImage: !!issue.image,
      imageValue: issue.image,
      hasImageUrl: !!issue.imageUrl,
      imageUrlValue: issue.imageUrl,
      hasPhoto: !!issue.photo,
      hasImagePath: !!issue.imagePath,
      hasImagesArray: !!issue.images,
      imagesType: typeof issue.images,
      imagesIsArray: Array.isArray(issue.images),
      imagesArrayLength: Array.isArray(issue.images) ? issue.images.length : 'N/A',
      imagesArrayFirst: Array.isArray(issue.images) && issue.images.length > 0 ? issue.images[0] : null,
      allKeys: Object.keys(issue).slice(0, 20) // First 20 keys for debugging
    });
    
    // No image found, return placeholder
    return DEFAULT_PLACEHOLDER_IMAGE;
  } catch (error) {
    console.error('[imageUtils] ✗ ERROR getting image URL:', error, 'Issue:', issue);
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
};

