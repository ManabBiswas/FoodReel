import express from 'express';
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowing,
    getSuggestedFollows
} from '../controllers/follow.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';

const router = express.Router();

// Follow/Unfollow routes
router.post('/follow', isLoggedin, followUser);
router.post('/unfollow', isLoggedin, unfollowUser);

// Get followers and following
router.get('/followers/:userId/:userType', getFollowers);
router.get('/following/:userId/:userType', getFollowing);

// Check if following a user
router.get('/check/:targetId/:targetType', isLoggedin, checkFollowing);

// Get suggested users to follow
router.get('/suggestions', isLoggedin, getSuggestedFollows);

export default router;
