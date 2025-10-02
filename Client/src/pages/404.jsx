import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search, UtensilsCrossed, Pizza, Coffee, Heart } from 'lucide-react'

const ErrorPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4 relative">
      {/* Go Back Button - Fixed in top left corner */}
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => window.history.back()} 
          className="group bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 hover:text-orange-500 p-3 rounded-full font-medium transition-all duration-300 transform hover:scale-110 hover:rotate-[-5deg] shadow-lg hover:shadow-xl border border-white/30 hover:border-orange-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="hidden sm:inline text-sm font-medium">Go Back</span>
          </div>
        </button>
      </div>

      <div className="max-w-2xl w-full text-center">
        {/* Animated Food Icons */}
        <div className="relative my-8">
          
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="animate-bounce delay-0">
              <Pizza className="w-16 h-16 text-orange-500" />
            </div>
            <div className="animate-bounce delay-100">
              <UtensilsCrossed className="w-20 h-20 text-red-500" />
            </div>
            <div className="animate-bounce delay-200">
              <Coffee className="w-16 h-16 text-amber-600" />
            </div>
          </div>
          
          {/* Floating hearts */}
          <div className="absolute top-0 left-1/4 animate-pulse">
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
          </div>
          <div className="absolute top-4 right-1/4 animate-pulse delay-500">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          </div>
        </div>

        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mb-4">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Oops! This Recipe Doesn't Exist
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Looks like you've wandered into an empty kitchen! 
          </p>
          <p className="text-gray-500 text-base">
            The page you're looking for has been eaten or moved to a different menu.
          </p>
        </div>

        {/* Fun Food Facts */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Did you know?</h3>
          </div>
          <p className="text-gray-600 text-sm italic">
            The average person will try over 7,000 different foods in their lifetime. 
            Unfortunately, this page isn't one of them! 🍕
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/" 
            className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:rotate-[1deg] shadow-lg hover:shadow-2xl flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          
          

          
        </div>

        {/* Popular Suggestions */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Maybe you were looking for:
          </h3>
          <div className="flex flex-wrap justify-center sm:gap-4 gap-2">
            <Link 
              to="/login" 
              className="group bg-white/50 hover:bg-white/80 text-gray-700 hover:text-orange-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] border border-white/30 hover:border-orange-200 hover:shadow-lg cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-[1px]">Login</span>
            </Link>
            <Link 
              to="/register" 
              className="group bg-white/50 hover:bg-white/80 text-gray-700 hover:text-blue-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] border border-white/30 hover:border-blue-200 hover:shadow-lg cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-[1px]">Sign Up</span>
            </Link>
            <Link 
              to="/partner-register" 
              className="group bg-white/50 hover:bg-white/80 text-gray-700 hover:text-purple-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] border border-white/30 hover:border-purple-200 hover:shadow-lg cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-[1px]">Become Partner</span>
            </Link>
            <Link 
              to="/partner-login" 
              className="group bg-white/50 hover:bg-white/80 text-gray-700 hover:text-green-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] border border-white/30 hover:border-green-200 hover:shadow-lg cursor-pointer"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-[1px]">Partner Login</span>
            </Link>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 mb-4 pb-6 text-gray-500 text-sm">
          <p>Lost your appetite? Don't worry, we've got plenty of delicious options waiting for you! 🍽️</p>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage