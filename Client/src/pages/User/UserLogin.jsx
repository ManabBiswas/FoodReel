import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication status by making API call to verify cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
        if (response.data && response.data.user) {
          // navigate('/')
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.error('User not authenticated:', error.response?.status);
        setIsLoggedIn(false);
      } finally {
        // setCheckingAuth(false);
      }
    }
    checkAuthStatus()
  }, [navigate])

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/')
    }
  }, [isLoggedIn, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({}) // Clear previous errors

    // Basic validation
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(
        API_ENDPOINTS.auth.userLogin,
        formData,
        axiosConfig
      )
      
      if (response.data && response.data.message === "User logged in successfully") {
        setIsLoggedIn(true)
        navigate('/', { replace: true })
      } else {
        setErrors({ general: 'Login failed - unexpected response format' })
      }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response?.data?.message) {
        // Server returned a specific error message
        setErrors({ general: error.response.data.message })
      } else if (error.response?.data?.errors) {
        // Server returned field-specific errors
        setErrors(error.response.data.errors)
      } else {
        // Generic error handling
        setErrors({ general: error.message || 'Login failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 border border-gray-200">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
          <p className="text-sm text-gray-600">Welcome back — please enter your details</p>
        </div>

        {(errors.general || typeof errors === 'string') && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
            {errors.general || errors}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Logging in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserLogin