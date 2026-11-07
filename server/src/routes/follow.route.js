import express from 'express';
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowing,
    getSuggestedFollows
} from '../controllers/follow.controller.js';
import isUserOrPartner from '../middlewares/isUserOrPartner.js';
import { validateBody, validateParams, isObjectId } from '../utils/validate.js';

const router = express.Router();

const TARGET_TYPES = ['User', 'FoodPartner'];

const listParams = validateParams({
    userId: { check: isObjectId, message: 'userId must be a valid id' },
    userType: { check: (v) => TARGET_TYPES.includes(v), message: 'userType must be User or FoodPartner' }
});

// Follow/Unfollow routes - partners can follow too (isLoggedin is user-only)
router.post('/follow', isUserOrPartner, validateBody({
    targetId: { check: isObjectId, message: 'targetId must be a valid id' }
}), followUser);
router.post('/unfollow', isUserOrPartner, validateBody({
    targetId: { check: isObjectId, message: 'targetId must be a valid id' }
}), unfollowUser);

// Get followers and following
router.get('/followers/:userId/:userType', listParams, getFollowers);
router.get('/following/:userId/:userType', listParams, getFollowing);

// Check if following a user
router.get('/check/:targetId/:targetType', isUserOrPartner, validateParams({
    targetId: { check: isObjectId, message: 'targetId must be a valid id' },
    targetType: { check: (v) => TARGET_TYPES.includes(v), message: 'targetType must be User or FoodPartner' }
}), checkFollowing);

// Get suggested users to follow
router.get('/suggestions', isUserOrPartner, getSuggestedFollows);

export default router;
