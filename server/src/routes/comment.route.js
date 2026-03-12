import express from 'express'
import isLoggedin from '../middlewares/isLoggedin.js'
import {
  createComment,
  getCommentsByPost,
  getComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getUserCommentLikes
} from '../controllers/comment.controller.js'

const router = express.Router()

// Protected routes (require authentication)
router.post('/create', isLoggedin, createComment)
router.put('/:commentId', isLoggedin, updateComment)
router.delete('/:commentId', isLoggedin, deleteComment)
router.post('/like', isLoggedin, likeComment)
router.delete('/unlike/:commentId', isLoggedin, unlikeComment)
router.get('/my-likes/:postId', isLoggedin, getUserCommentLikes)

// Public routes
router.get('/post/:postId', getCommentsByPost)
router.get('/:commentId', getComment)

export default router
