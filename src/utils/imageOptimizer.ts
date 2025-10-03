export class ImageOptimizer {
  // Get optimized image URL with Airtable thumbnail parameter
  static getOptimizedAirtableUrl(profilePic: any, size: 'small' | 'large' | 'full' = 'small'): string | null {
    if (!profilePic) return null;

    const url = Array.isArray(profilePic) ? profilePic[0]?.url : profilePic;
    if (!url) return null;

    // Airtable supports thumbnail parameters
    const thumbnails = Array.isArray(profilePic) ? profilePic[0]?.thumbnails : null;

    if (thumbnails) {
      switch (size) {
        case 'small':
          return thumbnails.small?.url || thumbnails.large?.url || url;
        case 'large':
          return thumbnails.large?.url || url;
        default:
          return url;
      }
    }

    return url;
  }
}
