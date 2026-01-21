import express from 'express';
import {
    createReview,
    getReviewsByFoodPartner,
    getReviewsByFoodItem,
    getUserReviews,
    updateReview,
    deleteReview,
    markReviewHelpful,
    addReviewReply,
    respondToReview
} from '../controllers/review.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';

const router = express.Router();

// Create and manage reviews (User actions)
router.post('/create', isLoggedin, createReview);
router.put('/:reviewId', isLoggedin, updateReview);
router.delete('/:reviewId', isLoggedin, deleteReview);

// Get reviews
router.get('/partner/:foodPartnerId', getReviewsByFoodPartner);
router.get('/food/:foodItemId', getReviewsByFoodItem);
router.get('/user/:userId', isLoggedin, getUserReviews);
router.get('/user', isLoggedin, getUserReviews);

// Review interactions
router.post('/:reviewId/helpful', isLoggedin, markReviewHelpful);
router.post('/:reviewId/reply', isLoggedin, addReviewReply);

// Food partner response to reviews
router.post('/:reviewId/respond', isFoodPartnerLoggedin, respondToReview);

export default router;
