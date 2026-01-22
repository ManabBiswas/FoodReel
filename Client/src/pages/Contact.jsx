import React, { useState } from 'react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

const Contact = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      // If backend /api/contact exists it will receive this. If not, we'll just mimic success.
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          <h1 className="text-5xl italic font-serif font-extrabold mb-4 bg-gradient-to-tr from-amber-300 to-red-400 bg-clip-text text-transparent ">Contact Us</h1>
          <p className="text-gray-600 mb-8">Have a question, partnership inquiry, or feedback? Send us a message and we'll get back to you within a few business days.</p>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={submit} className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-red-400 focus:ring-red-400" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-red-400 focus:ring-red-400" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Message</span>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} required className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-red-400 focus:ring-red-400" />
              </label>

              <div className="flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-md font-semibold hover:bg-rose-500 hover:cursor-pointer">Send message</button>
                {status === 'sending' && <span className="text-sm text-gray-500">Sending...</span>}
                {status === 'sent' && <span className="text-sm text-green-600">Message sent — thanks!</span>}
                {status === 'error' && <span className="text-sm text-red-600">Failed to send. Try again later.</span>}
              </div>
            </form>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold">Support</h4>
              <p className="text-sm text-gray-500">support@foodreel.example</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold">Visit Us</h4>
              <p className="text-sm text-gray-500">123 Food Street, Flavor Town</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Contact
