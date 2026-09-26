import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import UserRegister from '../pages/User/UserRegister'
import UserLogin from '../pages/User/UserLogin'
import PartnerRegister from '../pages/FoodPartner/PartnerRegister'
import PartnerLogin from '../pages/FoodPartner/PartnerLogin'
import PartnerProfile from '../pages/FoodPartner/PartnerProfile'
import CreateFood from '../pages/FoodPartner/CreateFood'
import Dashboard from '../pages/FoodPartner/Dashboard'
import OrderDetail from '../pages/FoodPartner/OrderDetail'
import UserProfile from '../pages/User/UserProfile'
import ProfileSettings from '../pages/User/ProfileSettings'
import OrderHistory from '../pages/OrderHistory'
import Checkout from '../pages/Checkout'
import CartPage from '../pages/CartPage'
import OrderConfirmation from '../pages/OrderConfirmation'
import OrderTracking from '../pages/OrderTracking'
import ErrorPage from '../pages/404'
import WorkingProgress from '../pages/WorkingProgress'
import Reel from '../pages/Reel'
import CreatePost from '../pages/User/CreatePost'
import About from '../pages/About'
import Contact from '../pages/Contact'
import AdminPage from '../pages/Admin/AdminPage'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-200">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = false, allowedType = null }) => {
  const { authType, isAuthenticated, loading, authChecked } = useAuth()

  // Show loading while checking auth
  if (!authChecked || loading) {
    return <LoadingScreen />
  }

  // If route requires authentication
  if (requireAuth) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    if (allowedType && authType !== allowedType) {
      return <Navigate to="/" replace />
    }
  }

  // If user is authenticated and trying to access login/register pages
  if (!requireAuth && isAuthenticated && ['/login', '/register', '/partner-login', '/partner-register'].includes(window.location.pathname)) {
    return <Navigate to="/" replace />
  }

  return children
}

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact-us' element={<Contact />} />
        <Route path='/work' element={<WorkingProgress />} />

        {/* Auth Routes - Redirect if already logged in */}
        <Route path='/register' element={<ProtectedRoute><UserRegister /></ProtectedRoute>} />
        <Route path='/login' element={<ProtectedRoute><UserLogin /></ProtectedRoute>} />
        <Route path='/partner-register' element={<ProtectedRoute><PartnerRegister /></ProtectedRoute>} />
        <Route path='/partner-login' element={<ProtectedRoute><PartnerLogin /></ProtectedRoute>} />

        {/* User Protected Routes */}
        <Route path='/create-post' element={<ProtectedRoute requireAuth allowedType="user"><CreatePost /></ProtectedRoute>} />
        <Route path='/reels' element={<ProtectedRoute requireAuth ><Reel /></ProtectedRoute>} />
        <Route path='/profile' element={<ProtectedRoute requireAuth allowedType="user"><UserProfile /></ProtectedRoute>} />
        <Route path='/profile/settings' element={<ProtectedRoute requireAuth allowedType="user"><ProfileSettings /></ProtectedRoute>} />
        <Route path='/order/history' element={<ProtectedRoute requireAuth allowedType="user"><OrderHistory /></ProtectedRoute>} />
        <Route path='/checkout' element={<ProtectedRoute requireAuth allowedType="user"><Checkout /></ProtectedRoute>} />
        <Route path='/cart' element={<ProtectedRoute requireAuth allowedType="user"><CartPage /></ProtectedRoute>} />
        <Route path='/order/confirmation/:orderId' element={<ProtectedRoute requireAuth allowedType="user"><OrderConfirmation /></ProtectedRoute>} />
        <Route path='/order/tracking/:orderId' element={<ProtectedRoute requireAuth allowedType="user"><OrderTracking /></ProtectedRoute>} />

        {/* Partner Protected Routes */}
        <Route path='/partner-dashboard' element={<ProtectedRoute requireAuth allowedType="partner"><Dashboard /></ProtectedRoute>} />
        <Route path='/order/:orderId' element={<ProtectedRoute requireAuth allowedType="partner"><OrderDetail /></ProtectedRoute>} />
        <Route path='/CreateFood' element={<ProtectedRoute requireAuth allowedType="partner"><CreateFood /></ProtectedRoute>} />
        <Route path='/partner-profile' element={<ProtectedRoute requireAuth allowedType="partner"><PartnerProfile /></ProtectedRoute>} />
        <Route path='/partner-profile/settings' element={<ProtectedRoute requireAuth allowedType="partner"><PartnerProfile /></ProtectedRoute>} />

        {/* Admin Protected Routes */}
        <Route path='/admin-login' element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path='/admin/dashboard' element={<ProtectedRoute requireAuth allowedType="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* 404 Route */}
        <Route path='*' element={<ErrorPage />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes