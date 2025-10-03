import mongoose from 'mongoose'

const advertisementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  postType: {
    type: String,
    default: 'advertisement'
  },
  tags: [{
    type: String,
    trim: true
  }],
  promotionType: {
    type: String,
    required: true,
    enum: ['discount', 'bogo', 'combo', 'seasonal', 'announcement']
  },
  prices: {
    original: {
      type: Number,
      min: 0
    },
    discounted: {
      type: Number,
      min: 0
    }
  },
  validUntil: {
    type: Date
  },
  promoCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  file: {
    type: String
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPartner',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for better query performance
advertisementSchema.index({ partnerId: 1, createdAt: -1 })
advertisementSchema.index({ promotionType: 1, isActive: 1 })
advertisementSchema.index({ validUntil: 1 })

// Virtual for checking if advertisement is still valid
advertisementSchema.virtual('isValid').get(function() {
  if (!this.validUntil) return true
  return new Date() <= this.validUntil
})

// Ensure virtual fields are serialized
advertisementSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Advertisement', advertisementSchema)