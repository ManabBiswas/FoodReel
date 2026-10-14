import express from 'express';
import multer from 'multer';
import isLoggedin from '../middlewares/isLoggedin.js';
import optionalAuth from '../middlewares/optionalAuth.js';
import userPostController from '../controllers/userPost.controller.js';
import { sanitizeMultipart } from '../middlewares/sanitization.js';
import { uploadMedia, enforceMediaSize, FILE_SIZE_LIMITS, verifyFileSignature } from '../middlewares/fileUpload.js';
import { validateParams, isObjectId } from '../utils/validate.js';

const router = express.Router();

const upload = uploadMedia;

const postIdParams = validateParams({
  id: { check: isObjectId, message: 'id must be a valid id' }
});
const userIdParams = validateParams({
  userId: { check: isObjectId, message: 'userId must be a valid id' }
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Unexpected field. Only "file" field is allowed for file upload.' });
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `File too large. Maximum size is ${Math.floor(FILE_SIZE_LIMITS.VIDEO / (1024 * 1024))}MB.` });
    return res.status(400).json({ error: error.message });
  }
  if (error?.message?.includes('Invalid file type')) return res.status(400).json({ error: error.message });
  next(error);
};

// POST /api/food/user - create a post by a regular user
router.post('/user', isLoggedin, upload.single('file'), enforceMediaSize, sanitizeMultipart, verifyFileSignature(), handleMulterError, userPostController.createUserPost);

// GET /api/food/user - get all user posts.
// optionalAuth personalises the feed for signed-in users (own reels hidden)
router.get('/user', optionalAuth, userPostController.getAllUserPosts);

// GET /api/food/user/my-posts - get logged-in user's posts
router.get('/user/my-posts', isLoggedin, userPostController.getUserPostsByUserId);

// GET /api/food/user/:userId - get posts by specific user
router.get('/user/:userId', userIdParams, userPostController.getUserPostsByUserId);

// POST /api/food/user/:id/like - toggle like on user post
router.post('/user/:id/like', isLoggedin, postIdParams, userPostController.toggleLike);

// POST /api/food/user/:id/comment - add comment to user post
router.post('/user/:id/comment', isLoggedin, postIdParams, userPostController.addComment);

// GET /api/food/user/:id/comments - get comments for user post
router.get('/user/:id/comments', postIdParams, userPostController.getComments);

// POST /api/food/user/:id/save - Toggle save on user post
router.post('/user/:id/save', isLoggedin, postIdParams, userPostController.toggleSave);

export default router;
