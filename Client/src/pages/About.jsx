import React from 'react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import Logo from '../assets/logo.png'
import { Heart, Users, MapPin, Star } from 'lucide-react'

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <img src={Logo} alt="FoodReel" className="h-20 w-auto mb-6 object-contain" />
                <p className="text-gray-600 mb-4">FoodReel brings together short, delightful food videos and a simple way to order from the restaurants and chefs behind them. We believe great food deserves to be shared — and ordered — with zero friction.</p>
                <p className="text-gray-600">Whether you are a home cook, a small restaurant, or a food partner, FoodReel helps you showcase what you make and connect with hungry viewers.</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-red-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Community First</h4>
                      <p className="text-sm text-gray-500">Built for food lovers and creators to share authentic experiences.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-yellow-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Support Local</h4>
                      <p className="text-sm text-gray-500">We make it easy for local chefs and restaurants to reach nearby customers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Discover & Order</h4>
                      <p className="text-sm text-gray-500">See a reel you love and order the dish without leaving the app.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-indigo-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Local Focus</h4>
                      <p className="text-sm text-gray-500">Find food partners and creators in your neighborhood.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Our Story</h3>
                <p className="text-gray-600 mb-4">FoodReel started as a simple idea: make the food discovery experience visual, quick and actionable. We combined short-form video with straightforward ordering and a partner-first platform.</p>
                <p className="text-gray-600 mb-4">We care about good UX, fair partner economics, and celebrating food creators. If you'd like to partner with us or share feedback, we'd love to hear from you.</p>

                <div className="mt-6">
                  <a href="/create-post" className="inline-block px-5 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600">Share a Reel</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h3 className="text-2xl font-semibold mb-6">Meet the Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gray-200 mb-3 flex items-center justify-center">MB</div>
                <h4 className="font-semibold">Manab Biswas</h4>
                <p className="text-sm text-gray-500">Founder & Developer</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gray-200 mb-3 flex items-center justify-center">JS</div>
                <h4 className="font-semibold">Jane Smith</h4>
                <p className="text-sm text-gray-500">Product</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gray-200 mb-3 flex items-center justify-center">AK</div>
                <h4 className="font-semibold">A. Kumar</h4>
                <p className="text-sm text-gray-500">Design</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gray-200 mb-3 flex items-center justify-center">RV</div>
                <h4 className="font-semibold">R. Verma</h4>
                <p className="text-sm text-gray-500">Operations</p>
              </div>
            </div>
          </div>
        </section> */}
      </main>

      <Footer />
    </div>
  )
}

export default About
