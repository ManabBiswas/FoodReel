// utils/fileValidation.js

const FILE_SIZE_LIMITS = {
    IMAGE: 5 * 1024 * 1024,      // 5MB
    VIDEO: 50 * 1024 * 1024,     // 50MB
    PROFILE: 2 * 1024 * 1024,    // 2MB
};

const ALLOWED_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    PROFILE: ['image/jpeg', 'image/png', 'image/webp'],
};

export const validateFile = (file, fileType = 'IMAGE') => {
    const errors = [];

    if (!file) {
        errors.push('No file selected');
        return errors;
    }

    // Check file type
    if (!ALLOWED_TYPES[fileType]?.includes(file.type)) {
        errors.push(`Invalid file type. Allowed: ${ALLOWED_TYPES[fileType]?.join(', ')}`);
    }

    // Check file size
    const maxSize = FILE_SIZE_LIMITS[fileType];
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push(`File too large. Max size: ${maxSizeMB}MB, Your file: ${fileSizeMB}MB`);
    }

    return errors;
};

export const getFileSizeInMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
};

export const getFileSizeLimitText = (fileType = 'IMAGE') => {
    const maxSize = FILE_SIZE_LIMITS[fileType];
    return `Max ${getFileSizeInMB(maxSize)}MB`;
};

export default {
    validateFile,
    getFileSizeInMB,
    getFileSizeLimitText,
    FILE_SIZE_LIMITS,
    ALLOWED_TYPES
};
