/**
 * imagekit.utils.js
 *
 * ImageKit thumbnail helpers.
 *
 * ImageKit auto-generates video thumbnails via:
 *   <video_url>/ik-thumbnail.jpg
 *
 * Docs: https://docs.imagekit.io/features/video-transformation/thumbnail-generation
 */

/**
 * Given any ImageKit media URL, return a displayable image URL.
 *
 * - If it's an image (jpg/png/webp/gif/avif) → returns as-is
 * - If it's a video (mp4/mov/webm/mkv/avi)   → appends /ik-thumbnail.jpg
 * - Unknown extension                          → tries thumbnail; if that also
 *   fails the <FoodMedia> component falls back to a placeholder
 *
 * @param {string} url      - The ImageKit file URL
 * @param {number} [second] - Optional: capture frame at this second (default = 0)
 * @returns {string} a URL that browsers can render as <img>
 */
export const getImageKitThumbnail = (url, second = 0) => {
  if (!url) return null

  const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i
  const VIDEO_EXTS = /\.(mp4|mov|webm|mkv|avi|m4v|ogv)(\?.*)?$/i

  if (IMAGE_EXTS.test(url)) return url

  if (VIDEO_EXTS.test(url)) {
    // Strip any existing query string before appending the thumbnail path
    const base = url.split('?')[0]
    const soParam = second > 0 ? `?tr=so-${second}` : ''
    return `${base}/ik-thumbnail.jpg${soParam}`
  }

  // Fallback: assume video-like, attempt thumbnail anyway
  const base = url.split('?')[0]
  return `${base}/ik-thumbnail.jpg`
}

/**
 * Returns true if the URL is a video file.
 */
export const isVideoUrl = (url) => {
  if (!url) return false
  return /\.(mp4|mov|webm|mkv|avi|m4v|ogv)(\?.*)?$/i.test(url)
}

/**
 * Given a food item object (from either the food model or order item),
 * returns { src, isVideo } where `src` is always an image-renderable URL.
 *
 * @param {object} foodItem
 * @param {number} [thumbSecond=0]
 */
export const getFoodMedia = (foodItem, thumbSecond = 0) => {
  if (!foodItem) return { src: null, isVideo: false }

  const rawUrl = foodItem.video || foodItem.image || null
  if (!rawUrl) return { src: null, isVideo: false }

  const isVideo = isVideoUrl(rawUrl)
  const src = isVideo ? getImageKitThumbnail(rawUrl, thumbSecond) : rawUrl

  return { src, isVideo, originalUrl: rawUrl }
}
