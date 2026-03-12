import React, { useState } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal, Video, Image, Play, Bookmark, Eye, Calendar } from 'lucide-react'

const UserPosts = () => {
  // Mock user posts data
  const [posts, setPosts] = useState([
    {
      id: 1,
      type: 'video',
      title: 'Amazing Pizza Experience!',
      description: 'Just tried this incredible margherita pizza at Mario\'s Kitchen. The crust was perfectly crispy and the cheese was so fresh! 🍕',
      thumbnail: '/api/placeholder/400/600',
      duration: '0:45',
      likes: 124,
      comments: 18,
      shares: 7,
      views: 1250,
      createdAt: '2 days ago',
      restaurant: "Mario's Kitchen",
      location: 'Downtown Food District'
    },
    {
      id: 2,
      type: 'image',
      title: 'Homemade Pasta Delight',
      description: 'Made this delicious carbonara at home following a recipe I found. Turned out better than expected! 🍝 #homecooking #pasta',
      image: '/api/placeholder/400/600',
      likes: 89,
      comments: 12,
      shares: 5,
      views: 850,
      createdAt: '5 days ago',
      restaurant: 'Home Kitchen',
      location: 'My Kitchen'
    },
    {
      id: 3,
      type: 'video',
      title: 'Street Food Adventure',
      description: 'Exploring the local street food scene. This taco stand has the most authentic flavors! 🌮',
      thumbnail: '/api/placeholder/400/600',
      duration: '1:23',
      likes: 203,
      comments: 35,
      shares: 12,
      views: 2100,
      createdAt: '1 week ago',
      restaurant: "Jose's Taco Stand",
      location: 'Street Food Market'
    },
    {
      id: 4,
      type: 'image',
      title: 'Dessert Paradise',
      description: 'This tiramisu was absolutely divine! Every spoonful was pure heaven. Perfect end to a great meal 🍰',
      image: '/api/placeholder/400/600',
      likes: 156,
      comments: 24,
      shares: 8,
      views: 1420,
      createdAt: '1 week ago',
      restaurant: 'Sweet Dreams Cafe',
      location: 'City Center'
    },
    {
      id: 5,
      type: 'video',
      title: 'Cooking Tutorial: Perfect Risotto',
      description: 'Step by step guide to making creamy mushroom risotto. The key is patience and constant stirring! 👨‍🍳',
      thumbnail: '/api/placeholder/400/600',
      duration: '3:45',
      likes: 312,
      comments: 67,
      shares: 45,
      views: 4200,
      createdAt: '2 weeks ago',
      restaurant: 'Home Kitchen',
      location: 'Cooking at Home'
    }
  ])

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  const handleSave = (postId) => {
    // Handle save functionality
    console.log('Post saved:', postId)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">You</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{post.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.createdAt} • {post.location}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="relative">
                {post.type === 'video' ? (
                  <div className="aspect-[4/5] bg-gray-200 flex items-center justify-center relative">
                    <div className="text-gray-400">
                      <Video className="w-12 h-12" />
                    </div>
                    
                    {/* Video Duration Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {post.duration}
                    </div>
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/5] bg-gray-200 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-700 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-700 hover:text-green-500 transition-colors">
                      <Share className="w-5 h-5" />
                      <span className="text-sm">{post.shares}</span>
                    </button>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm">{post.views}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSave(post.id)}
                    className="text-gray-700 hover:text-blue-500 transition-colors"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Description */}
                <div className="text-sm text-gray-900 leading-relaxed">
                  <p>{post.description}</p>
                  {post.restaurant && (
                    <p className="text-blue-600 mt-1 font-medium">📍 {post.restaurant}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <Image className="w-6 h-6 text-gray-900" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">No Posts Yet</h3>
          <p className="text-gray-500 mb-4">Share your food experiences with the community</p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Create Your First Post
          </button>
        </div>
      )}
    </div>
  )
}

export default UserPosts