import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Home, Wrench, Clock, Coffee, UtensilsCrossed, Users, Sparkles, Link as LinkIcon } from 'lucide-react'

const WorkingProgress = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 animate-bounce delay-0">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <div className="absolute top-20 right-20 animate-bounce delay-300">
          <Users className="w-10 h-10 text-white" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce delay-500">
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <div className="absolute bottom-10 right-10 animate-bounce delay-700">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Go Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => window.history.back()} 
          className="group bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white hover:text-orange-100 p-3 rounded-full font-medium transition-all duration-300 transform hover:scale-110 hover:rotate-[-5deg] shadow-lg hover:shadow-2xl border border-white/20 hover:border-white/40 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="hidden sm:inline text-sm font-medium">Go Back</span>
          </div>
        </button>
      </div>

      <div className="max-w-3xl w-full text-center relative z-10">
        {/* Main Construction Icon with Animation */}
        <div className="mb-8 relative">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 animate-pulse">
                <Wrench className="w-16 h-16 text-white animate-spin-slow" />
              </div>
              {/* Floating sparkles around the icon */}
              <div className="absolute -top-4 -right-4 animate-ping">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="absolute -bottom-4 -left-4 animate-ping delay-500">
                <Sparkles className="w-4 h-4 text-yellow-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Text */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            <span className="inline-block animate-bounce">🍳</span>
            <span className="mx-4">Cooking Up</span>
            <span className="inline-block animate-bounce delay-200">🔧</span>
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-orange-100 mb-4 drop-shadow-lg">
            Something Amazing!
          </h2>
          <p className="text-lg sm:text-xl text-orange-100/90 mb-4 leading-relaxed">
            Our chefs are working hard in the digital kitchen to bring you this feature.
          </p>
          <p className="text-base text-orange-200/80">
            We're adding the perfect ingredients to make your experience even better! 👨‍🍳✨
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="mb-8">
          <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/30 shadow-inner">
            <div className="bg-gradient-to-r from-yellow-300 to-orange-300 h-full rounded-full animate-pulse shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              <div className="w-3/4 h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-orange-100 mt-2">
            <span>Starting the fire...</span>
            <span className="animate-pulse">75% Complete</span>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <Clock className="w-8 h-8 text-orange-200 mx-auto mb-2" />
            <h3 className="text-white font-semibold mb-1">Coming Soon</h3>
            <p className="text-orange-100/80 text-sm">New features in development</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:rotate-1">
            <Users className="w-8 h-8 text-orange-200 mx-auto mb-2" />
            <h3 className="text-white font-semibold mb-1">Community</h3>
            <p className="text-orange-100/80 text-sm">Connecting food lovers & partners</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:rotate-[-1deg]">
            <LinkIcon className="w-8 h-8 text-orange-200 mx-auto mb-2" />
            <h3 className="text-white font-semibold mb-1">Bridge</h3>
            <p className="text-orange-100/80 text-sm">Creating seamless connections</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/" 
            className="group bg-white hover:bg-orange-50 text-orange-500 hover:text-orange-600 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:rotate-[1deg] shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="transition-transform duration-300 group-hover:translate-y-[-1px]">Back to Home</span>
          </Link>
          
          
        </div>

        {/* Fun Message */}
        <div className="mt-8 pb-8 text-orange-100/70 text-sm">
          <p>🔥 Good things take time, like a perfectly cooked meal! 🔥</p>
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-60"></div>
      <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-300 rounded-full animate-ping delay-1000 opacity-40"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-red-300 rounded-full animate-ping delay-500 opacity-50"></div>
    </div>
  )
}

export default WorkingProgress