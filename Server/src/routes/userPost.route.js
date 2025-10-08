import express from 'express';
import multer from 'multer';
import isLoggedin from '../middlewares/isLoggedin.js';
import userPostController from '../controllers/userPost.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /^(image\/|video\/)/;
    if (allowedTypes.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image and video files are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Unexpected field. Only "file" field is allowed for file upload.' });
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    return res.status(400).json({ error: error.message });
  }
  if (error?.message?.includes('Only image and video files are allowed')) return res.status(400).json({ error: error.message });
  next(error);
};

// POST /api/food/user - create a post by a regular user
router.post('/user', isLoggedin, upload.single('file'), handleMulterError, userPostController.createUserPost);

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

export default router;
