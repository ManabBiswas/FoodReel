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
import { validateBody, isObjectId } from '../utils/validate.js';

const router = express.Router();

// Follow/Unfollow routes - partners can follow too (isLoggedin is user-only)
router.post('/follow', isUserOrPartner, validateBody({
    targetId: { check: isObjectId, message: 'targetId must be a valid id' }
}), followUser);
router.post('/unfollow', isUserOrPartner, validateBody({
    targetId: { check: isObjectId, message: 'targetId must be a valid id' }
}), unfollowUser);

// Get followers and following
router.get('/followers/:userId/:userType', getFollowers);
router.get('/following/:userId/:userType', getFollowing);

// Check if following a user
router.get('/check/:targetId/:targetType', isUserOrPartner, checkFollowing);

// Get suggested users to follow
router.get('/suggestions', isUserOrPartner, getSuggestedFollows);

export default router;
