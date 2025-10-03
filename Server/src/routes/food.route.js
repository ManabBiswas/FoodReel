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

// POST /api/food - Create food or advertisement post
router.post('/',
    isFoodPartnerLoggedin,
    upload.single('file'), // Changed from 'video' to 'file' to match frontend
    handleMulterError,
    foodController.createFood
);

// GET /api/food - Get all posts (public endpoint for home feed)
router.get('/',
    foodController.getAllFoods
);

// GET /api/food/trending - Get trending posts
router.get('/trending',
    foodController.getTrendingFoods
);

// GET /api/food/my-posts - Get partner's own posts
router.get('/my-posts',
    isFoodPartnerLoggedin,
    foodController.getFoodItems
);

// GET /api/food/advertisements - Get active advertisements
router.get('/advertisements',
    foodController.getActiveAdvertisements
);

// GET /api/food/menu - Get food items with pricing (for ordering)
router.get('/menu',
    foodController.getFoodItemsWithPricing
);

// GET /api/food/statistics - Get post statistics for partners
router.get('/statistics',
    isFoodPartnerLoggedin,
    foodController.getPostStatistics
);

// POST /api/food/:id/like - Toggle like on a post
router.post('/:id/like',
    isLoggedin,
    foodController.toggleLike
);

// POST /api/food/:id/save - Toggle bookmark on a post
router.post('/:id/save',
    isLoggedin,
    foodController.toggleSave
);

// GET /api/food/:id/reviews - Get reviews for a food item
router.get('/:id/reviews',
    foodController.getReviews
);

// POST /api/food/:id/review - Add a review to a food item
router.post('/:id/review',
    isLoggedin,
    foodController.addReview
);

export default router