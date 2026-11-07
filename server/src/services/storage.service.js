import 'dotenv/config'
import ImageKit from 'imagekit'

const {
    IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT
} = process.env

/* ─── Extension map for common MIME types ──────────────────────── */
const MIME_TO_EXT = {
    // Images
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
    'video/x-m4v': '.m4v',
}

const VIDEO_MIMES = new Set([
    'video/mp4', 'video/quicktime', 'video/webm',
    'video/x-msvideo', 'video/x-matroska', 'video/x-m4v'
])


export const isVideoMime = (mimeType) => VIDEO_MIMES.has(mimeType)

const enforceExtension = (fileName, mimeType) => {
    if (!mimeType) return fileName

    const correctExt = MIME_TO_EXT[mimeType]
    if (!correctExt) return fileName

    // Strip any existing extension first, then append the correct one
    const withoutExt = fileName.replace(/\.[^/.]+$/, '')
    return `${withoutExt}${correctExt}`
}

/**
 * Lazy-initialised ImageKit client.
 */
let _client = null
const getClient = () => {
    if (_client) return _client
    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
        throw new Error(
            'Missing ImageKit configuration. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in .env'
        )
    }
    _client = new ImageKit({
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    })
    return _client
}

async function uploadFile(file, fileName, mimeType = '', options = {}) {
    const client = getClient()

    // Enforce the correct extension so ImageKit classifies the file properly
    const safeFileName = enforceExtension(fileName, mimeType)

    const response = await client.upload({
        file,
        fileName: safeFileName,
        useUniqueFileName: true,   // Prevents collisions — ImageKit appends a random suffix
        ...options,
    })

    return {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
        isVideo: isVideoMime(mimeType),
    }
}


async function uploadImage(file, fileName, mimeType = '') {
    const result = await uploadFile(file, fileName, mimeType)
    return result.url   // returns just the URL to match the old signature
}

export default { uploadFile, uploadImage, isVideoMime }