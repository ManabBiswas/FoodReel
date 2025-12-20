import multer from 'multer';
import path from 'path';

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
    IMAGE: 5 * 1024 * 1024,      // 5MB
    VIDEO: 15 * 1024 * 1024,     // 15MB
    PROFILE: 2 * 1024 * 1024,    // 2MB
    DOCUMENT: 10 * 1024 * 1024   // 10MB
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
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
    handleUploadError
};
