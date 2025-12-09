import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { 
  Play, 
  Heart, 
  Video, 
  ShoppingBag, 
  Loader2, 
  MessageCircle, 
  IndianRupee, 
  Clock, 
  Megaphone,
  Tag,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {
  const [featuredFoods, setFeaturedFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch food reels from API
  useEffect(() => {
    const fetchFoodReels = async () => {
      try {
         setLoading(true)
        const response = await axios.get(API_ENDPOINTS.food.getTrending, {
          ...axiosConfig,
          params: { limit: 5 }
        })
        
        console.log('Food reels response:', response.data)
        
        // Format the food data for display
        const formattedFoods = response.data.foods?.map(food => ({
          id: food._id,
          name: food.name,
          description: food.description || "Delicious food post",
          image: food.image,
          video: food.video,
          type: food.type,
          postType: food.postType || 'food',
          duration: food.duration || "15s",
          likes: food.likeCount || 0,
          comments: food.commentCount || 0,
          tags: food.tags || [],
          partner: food.foodPartner?.restaurantName || food.foodPartner?.companyName || "Food Partner",
          createdAt: food.createdAt,
          // Food-specific fields
          price: food.price,
          currency: food.currency || 'INR',
          preparationTime: food.preparationTime,
          // Advertisement-specific fields
          promotionType: food.promotionType,
          prices: food.prices,
          validUntil: food.validUntil,
          promoCode: food.promoCode
        })) || []
        
        setFeaturedFoods(formattedFoods)
      } catch (error) {
        console.error('Error fetching food reels:', error)
        setError('Failed to load food reels')
      } finally {
        setLoading(false)
      }
    }

    fetchFoodReels()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 via-red-400 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Food Through 
              <span className="block text-yellow-200">Short Videos</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-red-100 max-w-2xl mx-auto">
              Watch mouth-watering food reels and order directly from talented chefs and restaurants
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/reels" ><button className="bg-white text-red-500 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition cursor-pointer">
                Watch Food Reels
              </button></Link>
              <Link to="/partner-register" >
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-red-500 transition cursor-pointer">
                Join as Partner
              </button></Link>
            </div>
          </div>
        </div>
        
        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 opacity-20">
          <div className="w-20 h-20 bg-yellow-300 rounded-full animate-bounce"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <div className="w-16 h-16 bg-red-300 rounded-full animate-pulse"></div>
        </div>
      </section>

      {/* Featured Food Reels */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trending Food Reels
            </h2>
            <p className="text-gray-600 text-lg">
              Discover the most popular food videos from our community
            </p>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <span className="ml-2 text-gray-600">Loading delicious food reels...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Food Reels Grid */}
          {!loading && !error && (
            <>
              {featuredFoods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredFoods.map((food) => (
                    <div key={food.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                      <div className="relative">
                        <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative overflow-hidden">
                          {food.type === 'video' && food.video ? (
                            <video
                              src={food.video}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseEnter={(e) => e.target.play()}
                              onMouseLeave={(e) => e.target.pause()}
                            />
                          ) : food.type === 'image' && food.image ? (
                            <img
                              src={food.image}
                              alt={food.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-8">
                              <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Play className="w-8 h-8 text-white" fill="currentColor" />
                              </div>
                              <p className="text-gray-600">Food {food.type || 'Post'}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Post type badge */}
                        <div className="absolute top-4 left-4">
                          {food.postType === 'advertisement' ? (
                            <div className="bg-purple-500 bg-opacity-90 text-white px-2 py-1 rounded flex items-center text-xs">
                              <Megaphone className="w-3 h-3 mr-1" />
                              Promo
                            </div>
                          ) : (
                            <div className="bg-green-500 bg-opacity-90 text-white px-2 py-1 rounded flex items-center text-xs">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Food
                            </div>
                          )}
                        </div>

                        {/* Duration badge for videos */}
                        {food.type === 'video' && food.duration && (
                          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                            {food.duration}
                          </div>
                        )}
                        
                        {/* Likes and comments */}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                            <Heart className="w-4 h-4 mr-1 text-red-400" fill="currentColor" />
                            {food.likes}
                          </div>
                          {food.comments > 0 && (
                            <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1 text-blue-400" />
                              {food.comments}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{food.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{food.description}</p>
                        
                        {/* Tags */}
                        {food.tags && food.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {food.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Food-specific information */}
                        {food.postType === 'food' && (
                          <div className="mb-3 space-y-2">
                            {food.price && (
                              <div className="flex items-center text-green-600 font-semibold">
                                <IndianRupee className="w-4 h-4 mr-1" />
                                {food.price} {food.currency}
                              </div>
                            )}
                            {food.preparationTime && (
                              <div className="flex items-center text-gray-600 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                {food.preparationTime} min prep time
                              </div>
                            )}
                          </div>
                        )}

                        {/* Advertisement-specific information */}
                        {food.postType === 'advertisement' && (
                          <div className="mb-3 space-y-2">
                            {food.promotionType && (
                              <div className="text-purple-600 text-sm font-medium capitalize">
                                {food.promotionType.replace('_', ' ')} Offer
                              </div>
                            )}
                            {food.prices && (food.prices.original || food.prices.discounted) && (
                              <div className="flex items-center gap-2">
                                {food.prices.original && (
                                  <span className="text-gray-500 line-through text-sm">
                                    ₹{food.prices.original}
                                  </span>
                                )}
                                {food.prices.discounted && (
                                  <span className="text-red-600 font-semibold">
                                    ₹{food.prices.discounted}
                                  </span>
                                )}
                              </div>
                            )}
                            {food.promoCode && (
                              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs inline-block">
                                Code: {food.promoCode}
                              </div>
                            )}
                            {food.validUntil && (
                              <div className="flex items-center text-gray-600 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Valid until {new Date(food.validUntil).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">by {food.partner}</span>
                          {food.postType === 'food' ? (
                            <button className="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition cursor-pointer flex items-center">
                              <ShoppingBag className="w-4 h-4 mr-1" />
                              Order Now
                            </button>
                          ) : (
                            <button className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm hover:bg-purple-600 transition cursor-pointer flex items-center">
                              <Megaphone className="w-4 h-4 mr-1" />
                              View Offer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Food Reels Yet</h3>
                  <p className="text-gray-500 mb-4">Be the first to discover amazing food content!</p>
                  <button className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition">
                    Become a Partner
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FoodReel Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Watch Food Reels</h3>
              <p className="text-gray-600">Browse through amazing short food videos from top chefs and restaurants</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Your Favorite</h3>
              <p className="text-gray-600">Like and save the food videos that make your mouth water</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Directly</h3>
              <p className="text-gray-600">Order the exact dish from the reel and get it delivered to your door</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-red-500 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Food Journey?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of food lovers discovering amazing dishes every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to='/reels' >
            <button className="bg-white text-red-500 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition cursor-pointer">
              Start Watching
            </button>
            </Link>
            <Link to='/partner-register' ><button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-red-500 transition cursor-pointer">
              Become a Partner
            </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home