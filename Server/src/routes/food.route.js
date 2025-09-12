import express from 'express';
import foodController from '../controllers/food.controller.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import isLoggedin from '../middlewares/isLoggedin.js';

import multer from 'multer';


const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept any file type for now
        cb(null, true);
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

const router = express.Router();


// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Unexpected field. Only "video" field is allowed for file upload.' 
            });
        }
        return res.status(400).json({ error: error.message });
    }
    next(error);
};

// POST /api/food
router.post('/',
    isFoodPartnerLoggedin,
    upload.single('video'),
    handleMulterError,
    foodController.createFood
);

// GET /api/food
router.get('/',
    isLoggedin,
);

export default router