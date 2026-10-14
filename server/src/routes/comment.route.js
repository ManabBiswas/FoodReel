import express from 'express'
import isLoggedin from '../middlewares/isLoggedin.js'
import { validateBody, validateParams, isObjectId, isNonEmptyString, optional } from '../utils/validate.js'
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
// Comment schema caps text at 500 characters
const commentText = (v) => isNonEmptyString(v, 500)
const commentIdParams = validateParams({
  commentId: { check: isObjectId, message: 'commentId must be a valid id' }
})

// Protected routes (require authentication)
router.post('/create', isLoggedin, validateBody({
  postId: { check: isObjectId, message: 'postId must be a valid id' },
  text: { check: commentText, message: 'Comment text must be 1-500 characters' },
  parentCommentId: { check: optional(isObjectId), message: 'parentCommentId must be a valid id' }
}), createComment)
router.put('/:commentId', isLoggedin, commentIdParams, validateBody({
  text: { check: commentText, message: 'Comment text must be 1-500 characters' }
}), updateComment)
router.delete('/:commentId', isLoggedin, commentIdParams, deleteComment)
router.post('/like', isLoggedin, validateBody({
  commentId: { check: isObjectId, message: 'commentId must be a valid id' }
}), likeComment)
router.delete('/unlike/:commentId', isLoggedin, commentIdParams, unlikeComment)
router.get('/my-likes/:postId', isLoggedin, validateParams({
  postId: { check: isObjectId, message: 'postId must be a valid id' }
}), getUserCommentLikes)

// Public routes
router.get('/post/:postId', validateParams({
  postId: { check: isObjectId, message: 'postId must be a valid id' }
}), getCommentsByPost)
router.get('/:commentId', commentIdParams, getComment)

export default router
