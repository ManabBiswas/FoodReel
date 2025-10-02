import express from 'express';
import foodController from '../controllers/food.controller.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import isLoggedin from '../middlewares/isLoggedin.js';

import multer from 'multer';


const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept both image and video files
        const allowedTypes = /^(image\/|video\/)/;
        if (allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit to match frontend
    }
});

const router = express.Router();


// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field. Only "file" field is allowed for file upload.'
            });
        }
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Only image and video files are allowed')) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
};

// POST /api/food
router.post('/',
    isFoodPartnerLoggedin,
    upload.single('file'), // Changed from 'video' to 'file' to match frontend
    handleMulterError,
    foodController.createFood
);

// GET /api/food
router.get('/',
    isLoggedin,
    foodController.getAllFoods

);
// GET /api/food/trending
router.get('/trending',
    foodController.getTrendingFoods
);

export default router