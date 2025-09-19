import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {/* Placeholder avatar: first letter of name */}
            <span className="text-3xl font-bold text-blue-700">{user?.firstName?.[0] || 'U'}</span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
            <p className="text-sm text-gray-600 mt-1">{user?.mobile}</p>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">Logout</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile