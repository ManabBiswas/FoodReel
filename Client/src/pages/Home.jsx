import React from 'react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { Play, Heart, Video, ShoppingBag } from 'lucide-react'

const Home = () => {
  const featuredFoods = [
    {
      id: 1,
      name: "Spaghetti Masterpiece",
      description: "Delicious homemade pasta with rich tomato sauce",
      image: "/api/placeholder/300/400",
      chef: "Chef Mario",
      likes: "1.2K",
      duration: "15s"
    },
    {
      id: 2,
      name: "Burger Delight",
      description: "Juicy beef burger with fresh vegetables",
      image: "/api/placeholder/300/400",
      chef: "Chef Sarah",
      likes: "892",
      duration: "12s"
    },
    {
      id: 3,
      name: "Pizza Paradise",
      description: "Wood-fired pizza with premium ingredients",
      image: "/api/placeholder/300/400",
      chef: "Chef Tony",
      likes: "2.1K",
      duration: "20s"
    }
  ]

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
              <button className="bg-white text-red-500 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition cursor-pointer">
                Watch Food Reels
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-red-500 transition cursor-pointer">
                Join as Partner
              </button>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredFoods.map((food) => (
              <div key={food.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-white" fill="currentColor" />
                      </div>
                      <p className="text-gray-600">Food Video Preview</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {food.duration}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                    <Heart className="w-4 h-4 mr-1 text-red-400" fill="currentColor" />
                    {food.likes}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{food.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{food.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">by {food.chef}</span>
                    <button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition">
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <button className="bg-white text-red-500 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition cursor-pointer">
              Start Watching
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-red-500 transition cursor-pointer">
              Become a Partner
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home