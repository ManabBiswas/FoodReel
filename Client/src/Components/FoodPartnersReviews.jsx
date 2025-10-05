import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { Link } from 'react-router-dom'
import { Star, CheckCircle, User, Loader2 } from 'lucide-react'

const FoodPartnersReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0 })

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.FOOD_PARTNER_REVIEWS, axiosConfig)
      
      setReviews(response.data.reviews || [])
      setReviewStats({
        totalReviews: response.data.totalReviews || 0,
        averageRating: response.data.averageRating || 0
      })
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date // Remove Math.abs to get proper direction
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) // Use Math.floor instead of Math.ceil
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`
    
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  }

  if (loading) {
    return (
      <div className="text-center py-16 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {reviews.length > 0 ? (
        <>
          {/* Reviews Header */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(reviewStats.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-1">
                  {reviewStats.averageRating} ({reviewStats.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="py-6">
                <div className="flex gap-4">
                  {/* Customer Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                          {review.verified && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>Ordered: {review.foodItem}</span>
                          <span>•</span>
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>

                    {/* Review Actions */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <button className="text-gray-500 hover:text-blue-600 transition-colors">
                        Reply
                      </button>
                      <button className="text-gray-500 hover:text-red-600 transition-colors">
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center py-6">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors">
              Load More Reviews
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <Star className="w-6 h-6 text-gray-900" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">Customer reviews will appear here once you start getting orders</p>
        </div>
      )}
    </div>
  )
}

export default FoodPartnersReviews
