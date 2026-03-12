import mongoose from 'mongoose'

const commentLikeSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPost',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// Compound index to ensure one like per user per comment
commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true })
commentLikeSchema.index({ postId: 1, userId: 1 })

export const CommentLike = mongoose.model('CommentLike', commentLikeSchema)
