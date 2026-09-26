import multer from 'multer';
import path from 'path';

// File size limits (in bytes) — overridable via env (F8: MAX_* were documented
// but never read; limits were hardcoded). Values must be plain integers.
const envBytes = (name, fallback) => {
    const raw = process.env[name];
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const FILE_SIZE_LIMITS = {
    IMAGE: envBytes('MAX_IMAGE_SIZE', 5 * 1024 * 1024),      // 5MB
    VIDEO: envBytes('MAX_VIDEO_SIZE', 15 * 1024 * 1024),     // 15MB
    PROFILE: envBytes('MAX_PROFILE_SIZE', 2 * 1024 * 1024),  // 2MB
    DOCUMENT: 10 * 1024 * 1024                                // 10MB
};

export const ALLOWED_MIME_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    PROFILE: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Configure storage - Use memory storage since files are uploaded to ImageKit storage service
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (fileType, allowedTypes) => {
    return (req, file, cb) => {
        // Check MIME type
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }

        // Check file size will be done by multer limits
        cb(null, true);
    };
};

// Create upload middleware for different file types
// Files are kept in memory (buffer) and then uploaded to ImageKit storage service
export const uploadImage = multer({
    storage,
    fileFilter: fileFilter('IMAGE', ALLOWED_MIME_TYPES.IMAGE),
    limits: { fileSize: FILE_SIZE_LIMITS.IMAGE }
});

export const uploadVideo = multer({
    storage,
    fileFilter: fileFilter('VIDEO', ALLOWED_MIME_TYPES.VIDEO),
    limits: { fileSize: FILE_SIZE_LIMITS.VIDEO }
});

export const uploadProfile = multer({
    storage,
    fileFilter: fileFilter('PROFILE', ALLOWED_MIME_TYPES.PROFILE),
    limits: { fileSize: FILE_SIZE_LIMITS.PROFILE }
});

export const uploadDocument = multer({
    storage,
    fileFilter: fileFilter('DOCUMENT', ALLOWED_MIME_TYPES.DOCUMENT),
    limits: { fileSize: FILE_SIZE_LIMITS.DOCUMENT }
});

// Combined image+video upload for routes that accept either media type under a single "file" field. The hard ceiling is the video limit; controllers apply the stricter per-type limit to req.file.size once the buffer is complete.
export const uploadMedia = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = file.mimetype.startsWith('video/')
            ? ALLOWED_MIME_TYPES.VIDEO
            : ALLOWED_MIME_TYPES.IMAGE;
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error(`Invalid file type. Allowed types: ${allowed.join(', ')}`), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: Math.max(FILE_SIZE_LIMITS.IMAGE, FILE_SIZE_LIMITS.VIDEO),
        files: 1
    }
});

export const enforceMediaSize = (req, res, next) => {
    if (!req.file) return next();
    const isVideo = req.file.mimetype.startsWith('video/');
    const limit = isVideo ? FILE_SIZE_LIMITS.VIDEO : FILE_SIZE_LIMITS.IMAGE;
    if (req.file.size > limit) {
        return res.status(413).json({
            error: `File too large. Maximum size allowed: ${Math.floor(limit / (1024 * 1024))}MB`
        });
    }
    next();
};

// Error handler middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: `File too large. Maximum size allowed: ${err.limit / (1024 * 1024)}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files uploaded'
            });
        }
    } else if (err) {
        return res.status(400).json({
            error: err.message
        });
    }
    next();
};

export default {
    FILE_SIZE_LIMITS,
    ALLOWED_MIME_TYPES,
    uploadImage,
    uploadVideo,
    uploadProfile,
    uploadDocument,
    uploadMedia,
    enforceMediaSize,
    handleUploadError
};
