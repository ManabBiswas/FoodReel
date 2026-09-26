import express from 'express';
import multer from 'multer';
import isLoggedin from '../middlewares/isLoggedin.js';
import userPostController from '../controllers/userPost.controller.js';
import { sanitizeMultipart } from '../middlewares/sanitization.js';
import { uploadMedia, enforceMediaSize, FILE_SIZE_LIMITS } from '../middlewares/fileUpload.js';

const router = express.Router();

const upload = uploadMedia;

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
router.post('/user', isLoggedin, upload.single('file'), enforceMediaSize, sanitizeMultipart, handleMulterError, userPostController.createUserPost);

// GET /api/food/user - get all user posts
router.get('/user', userPostController.getAllUserPosts);

// GET /api/food/user/my-posts - get logged-in user's posts
router.get('/user/my-posts', isLoggedin, userPostController.getUserPostsByUserId);

// GET /api/food/user/:userId - get posts by specific user
router.get('/user/:userId', userPostController.getUserPostsByUserId);

// POST /api/food/user/:id/like - toggle like on user post
router.post('/user/:id/like', isLoggedin, userPostController.toggleLike);

// POST /api/food/user/:id/comment - add comment to user post
router.post('/user/:id/comment', isLoggedin, userPostController.addComment);

// GET /api/food/user/:id/comments - get comments for user post
router.get('/user/:id/comments', userPostController.getComments);

// POST /api/food/user/:id/save - Toggle save on user post
router.post('/user/:id/save', isLoggedin, userPostController.toggleSave);

export default router;
