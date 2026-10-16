// Convert Uint8Array to base64 
const bytesToBase64 = (bytes) => {
  const chunkSize = 0x8000
  let binary = ''

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

// Signature check MUST come before the "/" path check: JPEG base64 starts with "/9j/", which would otherwise be mistaken for a root-relative path.  
const BASE64_MIME_SIGNATURES = [
  ['/9j/', 'image/jpeg'],
  ['UklGR', 'image/webp'],
  ['iVBORw0KGgo', 'image/png'],
  ['R0lGOD', 'image/gif'],
  ['Qk', 'image/bmp'],
]

const bareBase64ToDataUrl = (value) => {
  const mime = BASE64_MIME_SIGNATURES.find(([signature]) => value.startsWith(signature))?.[1]
  if (!mime) return null

  return `data:${mime};base64,${value}`
}

const looksLikeUrl = (value) =>
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('//') ||
  value.startsWith('blob:')

const getProfileImageUrl = (user) => {
  const profileImage = user?.profileImage
  if (!profileImage) return null

  if (typeof profileImage === 'string') {
    if (profileImage.startsWith('data:')) return profileImage

    // Signature check MUST come before the "/" path check: JPEG base64 starts with "/9j/", which would otherwise be mistaken for a root-relative path.
    const asDataUrl = bareBase64ToDataUrl(profileImage)
    if (asDataUrl) return asDataUrl

    if (looksLikeUrl(profileImage) || profileImage.startsWith('/')) return profileImage

    return null
  }

  if (profileImage instanceof ArrayBuffer) {
    return `data:image/jpeg;base64,${bytesToBase64(new Uint8Array(profileImage))}`
  }

  if (profileImage instanceof Uint8Array) {
    return `data:image/jpeg;base64,${bytesToBase64(profileImage)}`
  }

  // Buffer serialised to JSON arrives as a plain array of byte values.
  if (Array.isArray(profileImage.data)) {
    const bytes = profileImage.data
    if (bytes.length === 0) return null
    return `data:image/jpeg;base64,${bytesToBase64(Uint8Array.from(bytes))}`
  }

  return null
}

export default getProfileImageUrl