import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPost',
      required: true,
      index: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment must not be empty'],
      maxlength: [500, 'Comment must not exceed 500 characters']
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  },
  {
    timestamps: true
  }
)

// Index for efficient querying
commentSchema.index({ postId: 1, createdAt: -1 })
commentSchema.index({ postedBy: 1 })
commentSchema.index({ parentCommentId: 1 })

// Virtual for populated user info
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'postedBy',
  foreignField: '_id',
  justOne: true
})

export const Comment = mongoose.model('Comment', commentSchema)
