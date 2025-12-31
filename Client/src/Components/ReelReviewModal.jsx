import React from 'react'
import { Star, X, Send } from 'lucide-react'

const ReelReviewModal = ({
  show,
  item,
  reviewData,
  submittingReview,
  showReviewsList,
  existingReviews,
  loadingReviews,
  onClose,
  onSubmit,
  onRatingChange,
  onCommentChange,
  onTabChange
}) => {
  if (!show || !item) return null

  // FIXED: Use keys that match the review model schema
  const ratingCategories = [
    { key: 'food', label: 'Food Quality', icon: '😋' },
    { key: 'service', label: 'Service', icon: '⭐' },
    { key: 'ambiance', label: 'Ambiance', icon: '🎨' },
    { key: 'value', label: 'Value for Money', icon: '💰' }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Reviews
          </h3>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => onTabChange(true)}
            className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
              showReviewsList
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            All Reviews ({existingReviews.length})
          </button>
          <button
            onClick={() => onTabChange(false)}
            className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
              !showReviewsList
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Write Review
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showReviewsList ? (
            /* Reviews List */
            <div className="space-y-4">
              {loadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : existingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No reviews yet</p>
                  <p className="text-white/40 text-sm mt-2">Be the first to review!</p>
                </div>
              ) : (
                existingReviews.map((review, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {review.user?.firstName?.[0]?.toUpperCase() || 
                           review.user?.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {review.user?.firstName || review.user?.name || 'Anonymous'}
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{review.comment}</p>
                    
                    {/* Show detailed ratings if available */}
                    {review.ratings && Object.keys(review.ratings).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {review.ratings.food > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-white/60">Food:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-2.5 h-2.5 ${
                                      s <= review.ratings.food
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-white/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {review.ratings.service > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-white/60">Service:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-2.5 h-2.5 ${
                                      s <= review.ratings.service
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-white/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {review.ratings.ambiance > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-white/60">Ambiance:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-2.5 h-2.5 ${
                                      s <= review.ratings.ambiance
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-white/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {review.ratings.value > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-white/60">Value:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-2.5 h-2.5 ${
                                      s <= review.ratings.value
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-white/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Write Review Form */
            <div className="space-y-6">
              {/* Overall Rating Display */}
              {reviewData.rating > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">Overall Rating:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= reviewData.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-white/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold text-lg">
                        {reviewData.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Categories */}
              <div className="space-y-4">
                <p className="text-white/60 text-sm">Rate different aspects:</p>
                {ratingCategories.map(category => (
                  <div key={category.key}>
                    <label className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onRatingChange(category.key, star)}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= (reviewData.ratings[category.key] || 0)
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-white/30 hover:text-white/50'
                            } transition-all`}
                          />
                        </button>
                      ))}
                      {reviewData.ratings[category.key] > 0 && (
                        <span className="text-white/60 text-sm ml-2 self-center">
                          {reviewData.ratings[category.key]}/5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <label className="text-white font-semibold mb-2 block">
                  Your Review
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={onCommentChange}
                  placeholder="Share your experience... What did you like? What could be improved?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors resize-none h-32"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-xs">
                    Share your honest experience
                  </span>
                  <span className="text-white/40 text-xs">
                    {reviewData.comment.length}/1000
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={onSubmit}
                disabled={submittingReview || reviewData.rating === 0 || !reviewData.comment.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {submittingReview ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
              
              {reviewData.rating === 0 && (
                <p className="text-orange-400 text-xs text-center -mt-2">
                  Please rate at least one category to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReelReviewModal