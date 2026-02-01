import React, { useState } from 'react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import BackToTop from '../Components/BackToTop'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { 
  Send, 
  Mail, 
  User, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Clock, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'

const Contact = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await axios.post(API_ENDPOINTS.contact.send, { name, email, message }, axiosConfig)
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col  md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-400 via-red-400 to-red-500 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="text-center relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span className="text-sm font-medium">We'd love to hear from you</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                Contact Us
              </h1>
              <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto font-medium">
                Have a question, partnership inquiry, or feedback? We're here to help!
              </p>
            </div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 opacity-20 hidden md:block">
            <div className="w-20 h-20 bg-yellow-300 rounded-full animate-bounce"></div>
          </div>
          <div className="absolute bottom-10 right-10 opacity-20 hidden md:block">
            <div className="w-16 h-16 bg-white rounded-full animate-pulse"></div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-gray-500 font-medium">
                    Fill out the form below and we'll get back to you within a few business days.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400" 
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="john@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400" 
                      />
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Message
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                      <textarea 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        rows={5} 
                        required 
                        placeholder="How can we help you?"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-900 placeholder:text-gray-400 resize-none" 
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                    <button 
                      type="submit" 
                      disabled={status === 'sending'}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold tracking-wide hover:from-orange-600 hover:to-red-600 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                    
                    {/* Status Messages */}
                    {status === 'sent' && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span>Message sent — thanks!</span>
                      </div>
                    )}
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 font-medium">
                        <AlertCircle className="w-5 h-5" />
                        <span>Failed to send. Try again later.</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Contact Cards */}
              <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Mail className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Email Support</h4>
                    <p className="text-gray-500 text-sm mb-2">Our team is here to help</p>
                    <a href="mailto:support@foodreel.example" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                      support@foodreel.example
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-500 text-sm mb-2">Mon-Fri from 9am to 6pm</p>
                    <a href="tel:+1234567890" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Visit Us</h4>
                    <p className="text-gray-500 text-sm mb-2">Come say hello</p>
                    <p className="text-blue-600 font-semibold">
                      123 Food Street, Flavor Town
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Response Time</h4>
                    <p className="text-gray-500 text-sm mb-2">Average response</p>
                    <p className="text-purple-600 font-semibold">
                      Within 24-48 hours
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Teaser */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
                <h4 className="font-bold text-lg mb-2">Need Quick Answers?</h4>
                <p className="text-orange-100 text-sm mb-4 leading-relaxed">
                  Check out our FAQ section for answers to common questions about orders, partnerships, and more.
                </p>
                <a 
                  href="/about" 
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}

export default Contact
