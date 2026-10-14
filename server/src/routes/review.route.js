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
import { validateBody, validateParams, isObjectId, isNonEmptyString, optional } from '../utils/validate.js';

const router = express.Router();
const ratingInRange = (v) => Number.isFinite(Number(v)) && Number(v) >= 1 && Number(v) <= 5;
const reviewIdParams = validateParams({
    reviewId: { check: isObjectId, message: 'reviewId must be a valid id' }
});

// Create and manage reviews (User actions)
router.post('/create', isLoggedin, validateBody({
    foodPartnerId: { check: isObjectId, message: 'foodPartnerId must be a valid id' },
    rating: { check: ratingInRange, message: 'rating must be a number between 1 and 5' },
    comment: { check: (v) => isNonEmptyString(v, 1000), message: 'comment must be 1-1000 characters' },
    foodItemId: { check: optional(isObjectId), message: 'foodItemId must be a valid id' },
    orderId: { check: optional(isObjectId), message: 'orderId must be a valid id' },
    images: { check: (v) => v === undefined || Array.isArray(v), message: 'images must be an array' }
}), createReview);
router.put('/:reviewId', isLoggedin, reviewIdParams, validateBody({
    rating: { check: optional(ratingInRange), message: 'rating must be a number between 1 and 5' },
    comment: { check: optional((v) => typeof v === 'string' && v.length <= 1000), message: 'comment must be at most 1000 characters' }
}), updateReview);
router.delete('/:reviewId', isLoggedin, reviewIdParams, deleteReview);

// Get reviews
router.get('/partner/:foodPartnerId', validateParams({
    foodPartnerId: { check: isObjectId, message: 'foodPartnerId must be a valid id' }
}), getReviewsByFoodPartner);
router.get('/food/:foodItemId', validateParams({
    foodItemId: { check: isObjectId, message: 'foodItemId must be a valid id' }
}), getReviewsByFoodItem);
router.get('/user/:userId', isLoggedin, validateParams({
    userId: { check: isObjectId, message: 'userId must be a valid id' }
}), getUserReviews);
router.get('/user', isLoggedin, getUserReviews);

// Review interactions
router.post('/:reviewId/helpful', isLoggedin, reviewIdParams, validateBody({
    helpful: { check: (v) => typeof v === 'boolean', message: 'helpful must be a boolean' }
}), markReviewHelpful);
router.post('/:reviewId/reply', isLoggedin, reviewIdParams, validateBody({
    text: { check: (v) => isNonEmptyString(v, 1000), message: 'Reply text must be 1-1000 characters' }
}), addReviewReply);

// Food partner response to reviews
router.post('/:reviewId/respond', isFoodPartnerLoggedin, reviewIdParams, validateBody({
    text: { check: optional((v) => typeof v === 'string' && v.length <= 1000), message: 'text must be at most 1000 characters' },
    response: { check: optional((v) => typeof v === 'string' && v.length <= 1000), message: 'response must be at most 1000 characters' }
}), respondToReview);

export default router;
