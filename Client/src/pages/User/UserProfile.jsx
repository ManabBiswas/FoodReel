import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Mail, Phone, Loader2 } from 'lucide-react'

const UserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/auth/verify', { withCredentials: true })
        setUser(res.data.user)
        // no local editing state; just keep the server user
      } catch (err) {
        console.error('Unable to fetch user:', err)
        // Not authenticated -> redirect to login
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:3000/api/auth/user/logout', { withCredentials: true })
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      // Ensure client navigates to login page
      navigate('/login')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center">
        <Loader2 className="animate-spin h-6 w-6 mr-3 text-blue-600" />
        Loading profile...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <User className="w-12 h-12 text-blue-700" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
              <User className="w-6 h-6" />
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-gray-600 mt-3 flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            <p className="text-sm text-gray-600 mt-2 flex items-center justify-center sm:justify-start gap-2">
              <Phone className="w-4 h-4" />
              {user?.mobile}
            </p>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile