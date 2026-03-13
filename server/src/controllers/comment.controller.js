import { Comment } from '../models/comment.model.js'
import { CommentLike } from '../models/commentLike.model.js'
import UserPost from '../models/userPost.model.js'

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { postId, text, parentCommentId } = req.body
    const userId = req.user?._id || req.userId

    // Validate input
    if (!postId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment text are required'
      })
    }

    // Verify post exists
    const post = await UserPost.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Create comment
    const comment = new Comment({
      postId,
      postedBy: userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    })

    await comment.save()
    
    // Populate user info
    await comment.populate({
      path: 'postedBy',
      select: 'firstName lastName profileImage email'
    })

    // Update parent comment's replies if this is a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $addToSet: { replies: comment._id } },
        { new: true }
      )
    }

    // Increment post comment count
    await UserPost.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    )

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    })
  }
}

// Get all comments for a post
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query

    // Verify post exists
    const post = await UserPost.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    const skip = (page - 1) * limit

    // Get parent comments only (not replies)
    const comments = await Comment.find({
      postId,
      parentCommentId: null
    })
      .populate({
        path: 'postedBy',
        select: 'firstName lastName profileImage email'
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'postedBy',
          select: 'firstName lastName profileImage email'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      // .lean()

    const total = await Comment.countDocuments({
      postId,
      parentCommentId: null
    })

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    })
  }
}

// Get single comment with replies
export const getComment = async (req, res) => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)
      .populate({
        path: 'postedBy',
        select: 'firstName lastName profileImage email'
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'postedBy',
          select: 'firstName lastName profileImage email'
        }
      })

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Comment retrieved successfully',
      data: comment
    })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comment',
      error: error.message
    })
  }
}

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { text } = req.body
    const userId = req.user?._id || req.userId

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      })
    }

    // Find comment and verify ownership
    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    if (comment.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      })
    }

    // Update comment
    comment.text = text.trim()
    comment.isEdited = true
    comment.editedAt = new Date()
    await comment.save()

    await comment.populate({
      path: 'postedBy',
      select: 'firstName lastName profileImage email'
    })

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    })
  }
}

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user?._id || req.userId

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Verify ownership or admin status
    if (comment.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      })
    }

    const postId = comment.postId

    // Delete comment and its likes
    await Comment.findByIdAndDelete(commentId)
    await CommentLike.deleteMany({ commentId })

    // Remove from parent comment's replies if applicable
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(
        comment.parentCommentId,
        { $pull: { replies: commentId } },
        { new: true }
      )
    }

    // Decrement post comment count
    await UserPost.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: -1 } },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    })
  }
}

// Like a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.body
    const userId = req.user?._id || req.userId

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if already liked
    const existingLike = await CommentLike.findOne({
      commentId,
      userId
    })

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this comment'
      })
    }

    // Create like
    const like = new CommentLike({
      commentId,
      userId,
      postId: comment.postId
    })

    await like.save()

    // Update comment like count
    await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: 1 } },
      { new: true }
    )

    return res.status(201).json({
      success: true,
      message: 'Comment liked successfully',
      data: like
    })
  } catch (error) {
    console.error('Error liking comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message
    })
  }
}

// Unlike a comment
export const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user?._id || req.userId

    const like = await CommentLike.findOneAndDelete({
      commentId,
      userId
    })

    if (!like) {
      return res.status(404).json({
        success: false,
        message: 'Like not found'
      })
    }

    // Update comment like count
    await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: -1 } },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Comment unliked successfully'
    })
  } catch (error) {
    console.error('Error unliking comment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike comment',
      error: error.message
    })
  }
}

// Get user's comment likes for a post
export const getUserCommentLikes = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user?._id || req.userId

    const likes = await CommentLike.find({
      postId,
      userId
    }).select('commentId')

    return res.status(200).json({
      success: true,
      message: 'User comment likes retrieved successfully',
      data: likes
    })
  } catch (error) {
    console.error('Error fetching user comment likes:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user comment likes',
      error: error.message
    })
  }
}