import express from 'express';
import foodController from '../controllers/food.controller.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import { sanitizeMultipart } from '../middlewares/sanitization.js';
import { uploadMedia, enforceMediaSize } from '../middlewares/fileUpload.js';

const upload = uploadMedia;

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
    upload.single('file'), enforceMediaSize, // Changed from 'video' to 'file' to match frontend
    sanitizeMultipart,
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

// DELETE /api/food/:id - Delete a food item (partner only)
router.delete('/:id',
    isFoodPartnerLoggedin,
    foodController.deleteFood
);

// PUT /api/food/:id - Update a food item (partner only)
router.put('/:id',
    isFoodPartnerLoggedin,
    upload.single('file'), enforceMediaSize,
    sanitizeMultipart,
    handleMulterError,
    foodController.updateFood
);

export default router