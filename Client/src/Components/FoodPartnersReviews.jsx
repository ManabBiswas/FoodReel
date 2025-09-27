import React from 'react'
import { Star, CheckCircle, User } from 'lucide-react'

const FoodPartnersReviews = () => {
  // Mock reviews data
  const reviews = [
    {
      id: 1,
      customerName: "Sarah Johnson",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Spaghetti Special",
      rating: 5,
      comment: "Absolutely delicious! The pasta was cooked perfectly and the sauce was amazing. Will definitely order again!",
      date: "2 days ago",
      verified: true
    },
    {
      id: 2,
      customerName: "Mike Chen",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Pizza Margherita",
      rating: 4,
      comment: "Great pizza with fresh ingredients. The crust was crispy and the mozzarella was perfect. Only wish the delivery was a bit faster.",
      date: "3 days ago",
      verified: true
    },
    {
      id: 3,
      customerName: "Emily Rodriguez",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Tiramisu",
      rating: 5,
      comment: "Best tiramisu in the city! So creamy and the coffee flavor was spot on. Thank you for this amazing dessert!",
      date: "5 days ago",
      verified: false
    },
    {
      id: 4,
      customerName: "David Wilson",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Lasagna Delight",
      rating: 4,
      comment: "Hearty portion and very tasty. The layers were well balanced. Would love to see a vegetarian option too!",
      date: "1 week ago",
      verified: true
    },
    {
      id: 5,
      customerName: "Lisa Thompson",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Carbonara",
      rating: 5,
      comment: "Authentic Italian carbonara! The eggs were perfectly creamy and the pancetta was crispy. Felt like I was in Rome!",
      date: "1 week ago",
      verified: true
    },
    {
      id: 6,
      customerName: "James Miller",
      customerAvatar: "/api/placeholder/40/40",
      foodItem: "Bruschetta",
      rating: 3,
      comment: "Good flavors but the bread was a bit soggy when it arrived. Maybe package the toppings separately for delivery?",
      date: "2 weeks ago",
      verified: false
    }
  ]

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const totalReviews = reviews.length

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
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-1">
                  {averageRating.toFixed(1)} ({totalReviews} reviews)
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
                          <h4 className="font-medium text-gray-900">{review.customerName}</h4>
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
                          <span>{review.date}</span>
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
