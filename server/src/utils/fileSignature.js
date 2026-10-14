// Each entry: [magic bytes, offset, ascii?]
const SIGNATURES = [
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38], ascii: [0, 'GIF87a'] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38], ascii: [0, 'GIF89a'] },
    // RIFF container: the sub-type at offset 8 decides WEBP vs AVI.
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], ascii: [8, 'WEBP'] },
    { mime: 'video/x-msvideo', bytes: [0x52, 0x49, 0x46, 0x46], ascii: [8, 'AVI '] },
    // ISO base media (MP4/MOV/HEIC) all carry 'ftyp' at offset 4.
    { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
    { mime: 'video/quicktime', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, brand: 'qt  ' },
    { mime: 'video/mpeg', bytes: [0x00, 0x00, 0x01, 0xba] }, // MPEG-PS
    { mime: 'video/mpeg', bytes: [0x00, 0x00, 0x01, 0xb3] }  // MPEG video sequence
];

const MAX_SNIFF_BYTES = 16;

const asciiAt = (buf, offset, expected) => {
    if (typeof expected !== 'string') return false;
    if (buf.length < offset + expected.length) return false;
    for (let i = 0; i < expected.length; i++) {
        if (buf[offset + i] !== expected.charCodeAt(i)) return false;
    }
    return true;
};

const bytesAt = (buf, offset, bytes) => {
    if (buf.length < offset + bytes.length) return false;
    return bytes.every((b, i) => buf[offset + i] === b);
};

/**
 * @param {Buffer} buffer uploaded bytes (multer memoryStorage gives the whole file)
 * @returns {string|null} the detected mime type, or null when unrecognised
 */
export const detectFileType = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

    const head = buffer.subarray(0, Math.min(buffer.length, MAX_SNIFF_BYTES));

    for (const sig of SIGNATURES) {
        const offset = sig.offset ?? 0;
        if (sig.bytes && !bytesAt(head, offset, sig.bytes)) continue;
        if (sig.ascii) {
            const [asciiOffset, asciiValue] = sig.ascii;
            if (!asciiAt(head, asciiOffset, asciiValue)) continue;
        }
        if (sig.brand && !asciiAt(head, 8, sig.brand)) continue;
        return sig.mime;
    }
    return null;
};

/**
 * Does the buffer actually look like one of `allowedMimes`?
 *
 * `video/quicktime` and `video/mp4` share the 'ftyp' box and are told apart only
 * by the brand string, so an MOV legitimately uploaded as video/quicktime must
 * not be rejected when the route allows video/mp4 (and vice versa). QuickTime is
 * also a valid MP4 container, so it is accepted for either.
 */
const FMP4_EQUIVALENTS = new Set(['video/mp4', 'video/quicktime']);

export const isAllowedFileType = (buffer, allowedMimes) => {
    const detected = detectFileType(buffer);
    if (!detected) return false;
    if (allowedMimes.includes(detected)) return true;
    if (FMP4_EQUIVALENTS.has(detected)) {
        return allowedMimes.some((m) => FMP4_EQUIVALENTS.has(m));
    }
    return false;
};