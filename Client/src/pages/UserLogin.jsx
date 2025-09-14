import React, { useState } from 'react'
import axios from 'axios'
import { Navigate, useNavigate } from 'react-router-dom'

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // if already logged in, send to home
  const token = localStorage.getItem('userToken')
  if (token) return <Navigate to="/home" replace />

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = 'Email is required'
    else {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!re.test(formData.email)) errs.email = 'Enter a valid email'
    }
    if (!formData.password) errs.password = 'Password is required'
    return errs
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('')
    const clientErrors = validate()
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:3000/api/auth/user/login', formData,{
        withCredentials: true
      })
      // const { token: jwt, user } = response.data || {}
      // if (jwt) {
      //   localStorage.setItem('userToken', jwt)
      //   if (user) localStorage.setItem('user', JSON.stringify(user))
      //   navigate('/home')
      // } else {
      //   setMessage('Login succeeded but no token returned')
      // }
    } catch (error) {
      console.error(error)
      const serverMsg = error?.response?.data?.message || error?.message || 'Login failed'
      setMessage(serverMsg)
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
          <p className="text-sm text-gray-600">Welcome back — please enter your details</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${message.includes('successful') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Your password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserLogin