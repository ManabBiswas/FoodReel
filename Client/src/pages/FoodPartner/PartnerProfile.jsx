import React, { useState } from 'react'
import axios from 'axios'
import Navbar from '../../Components/Navbar'
import { Building2, MapPin, Phone, Mail, Users, UtensilsCrossed, Heart, LogOut, Settings, Plus, Grid3X3, Bookmark, Tag } from 'lucide-react'

const PartnerProfile = () => {
  const [activeTab, setActiveTab] = useState('posts')
  
  // Mock data - in real app, this would come from API
  const partnerData = {
    companyName: "Mario's Italian Kitchen",
    username: "@marios_kitchen",
    email: "mario@italienkitchen.com", 
    phone: "+1 234 567 8900",
    address: "123 Food Street, Culinary District, City 12345",
    bio: "🍝 Authentic Italian Cuisine since 1995\n🏆 Award-winning pasta & pizza\n📍 Downtown location • Delivery available",
    followers: 1250,
    foodItems: 24,
    following: 89,
    verified: true,
    profileImage: "/api/placeholder/150/150"
  }

  // Mock food items data
  const foodItems = [
    { id: 1, name: "Spaghetti Special", image: "/api/placeholder/300/533", likes: 156, comments: 23, type: "video", duration: "0:45" },
    { id: 2, name: "Pizza Margherita", image: "/api/placeholder/300/533", likes: 243, comments: 18, type: "image" },
    { id: 3, name: "Lasagna Delight", image: "/api/placeholder/300/533", likes: 198, comments: 31, type: "video", duration: "1:20" },
    { id: 4, name: "Risotto Mushroom", image: "/api/placeholder/300/533", likes: 134, comments: 12, type: "video", duration: "0:38" },
    { id: 5, name: "Tiramisu", image: "/api/placeholder/300/533", likes: 278, comments: 45, type: "image" },
    { id: 6, name: "Bruschetta", image: "/api/placeholder/300/533", likes: 167, comments: 28, type: "video", duration: "0:52" },
    { id: 7, name: "Carbonara", image: "/api/placeholder/300/533", likes: 223, comments: 19, type: "video", duration: "1:05" },
    { id: 8, name: "Gelato Mix", image: "/api/placeholder/300/533", likes: 189, comments: 33, type: "image" },
    { id: 9, name: "Minestrone", image: "/api/placeholder/300/533", likes: 145, comments: 15, type: "video", duration: "0:41" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto bg-white min-h-screen">
        {/* Profile Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-6">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              {/* Company Name and Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900">{partnerData.companyName}</h2>
                  {partnerData.verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex justify-center sm:justify-start gap-2">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4 cursor-pointer" />
                    Edit Profile
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center sm:justify-start gap-6 mb-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{partnerData.foodItems}</span>
                  <span className="text-gray-600 ml-1">posts</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{partnerData.followers.toLocaleString()}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{partnerData.following}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </div>
              </div>

              {/* Bio */}
              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-line mb-3">
                {partnerData.bio}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-3 h-3" />
                  <span>{partnerData.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{partnerData.phone}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-3 h-3" />
                  <span className="text-center sm:text-left">{partnerData.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center">
            <div className="flex">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${
                  activeTab === 'posts' 
                    ? 'text-gray-900 border-t-2 border-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${
                  activeTab === 'saved' 
                    ? 'text-gray-900 border-t-2 border-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </button>
              <button 
                onClick={() => setActiveTab('tagged')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${
                  activeTab === 'tagged' 
                    ? 'text-gray-900 border-t-2 border-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Tagged</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="pb-8">
          {activeTab === 'posts' && (
            <>
              {foodItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 sm:px-6 lg:px-8">
                  {foodItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                    >
                      {/* Portrait 9:16 Aspect Ratio Container (like reels) */}
                      <div className="aspect-[9/16] w-full bg-gray-200 flex items-center justify-center relative">
                        <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                        
                        {/* Content Type Indicators */}
                        <div className="absolute top-2 right-2 z-10">
                          {item.type === 'video' ? (
                            <div className="flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                              </svg>
                              <span className="text-white text-xs font-medium">{item.duration}</span>
                            </div>
                          ) : (
                            <div className="bg-black/60 rounded p-1">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Play Button Overlay for Videos */}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/60 transition-colors">
                              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Stats Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between text-white text-sm font-medium mb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{item.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                <span>{item.comments}</span>
                              </div>
                            </div>
                          </div>
                          <h3 className="text-white text-xs font-medium truncate">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      {/* Content Type Badge at Bottom */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'video' 
                            ? 'bg-red-500/80 text-white' 
                            : 'bg-blue-500/80 text-white'
                        }`}>
                          {item.type === 'video' ? 'Reel' : 'Post'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 mb-4">Start sharing your delicious food creations</p>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                    Create Your First Post
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No Saved Posts</h3>
              <p className="text-gray-500">Save posts you like to see them here</p>
            </div>
          )}

          {activeTab === 'tagged' && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Tag className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No Tagged Posts</h3>
              <p className="text-gray-500">Posts you're tagged in will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PartnerProfile