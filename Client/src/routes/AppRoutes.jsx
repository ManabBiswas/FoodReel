import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from '../pages/Home'
import UserRegister from '../pages/User/UserRegister'
import UserLogin from '../pages/User/UserLogin'
import PartnerRegister from '../pages/FoodPartner/PartnerRegister'
import PartnerLogin from '../pages/FoodPartner/PartnerLogin'
import PartnerProfile from '../pages/FoodPartner/PartnerProfile'
import CreateFood from '../pages/FoodPartner/CreateFood'
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
import { useAuth } from '../hooks/useAuth'
import FoodReelLogo from '../assets/logo.png'

// Lazy-loaded components for code splitting so heavy components are only loaded when needed. This improves initial load time and performance.
const Dashboard = lazy(() => import('../pages/FoodPartner/Dashboard'))
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'))
const FoodFestEvents = lazy(() => import('../pages/User/FoodFestEvents'))
const FoodFestEventDetail = lazy(() => import('../pages/User/FoodFestEventDetail'))
const MyTickets = lazy(() => import('../pages/User/MyTickets'))
const StallApplications = lazy(() => import('../pages/FoodPartner/StallApplications'))
const CreateEventProposal = lazy(() => import('../pages/User/CreateEventProposal'))
const OrganizerDashboard = lazy(() => import('../pages/User/OrganizerDashboard'))

// Set of paths that require authentication   
// This is used to redirect authenticated users away from login/register pages to their intended destination or home page.    
const AUTH_PATHS = new Set(['/login', '/register', '/partner-login', '/partner-register'])

// Loading Component — warm parchment, logo mark, indeterminate bar.
// Transform/opacity only so it stays smooth while the route chunk resolves.
const LoadingScreen = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center px-6"
    style={{ background: 'var(--color-background-light)' }}
    role="status"
    aria-live="polite"
  >
    <img
      src={FoodReelLogo}
      alt="FoodReel"
      className="h-12 w-32 object-contain animate-pulse"
      style={{ animationDuration: '2.4s' }}
    />
    <p className="mt-4 font-serif text-xl font-bold tracking-tight" style={{ color: 'var(--color-text-base)' }}>
      FoodReel
    </p>
    <div
      className="foodreel-load-bar mt-5 h-1 w-40 overflow-hidden rounded-full"
      style={{ background: 'var(--color-border-light)' }}
      aria-hidden="true"
    >
      <div
        className="h-full w-1/3 rounded-full"
        style={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-primary))' }}
      />
    </div>
    <p className="mt-3 font-sans text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-faint)' }}>
      Loading your table
    </p>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = false, allowedType = null }) => {
  const { authType, isAuthenticated, authChecked } = useAuth()
  const location = useLocation()

  // If auth is not checked
  if (!authChecked) {
    return <LoadingScreen />
  }

  // If route requires authentication
  if (requireAuth) {
    if (!isAuthenticated) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: `${location.pathname}${location.search}` }}
        />
      )
    }
    if (allowedType && authType !== allowedType) {
      return <Navigate to="/" replace />
    }
  }

  // If user is authenticated and trying to access login/register pages,
  // honour the same return path the login form uses. This also avoids a race
  // between the post-login navigate and this redirect.
  if (!requireAuth && isAuthenticated && AUTH_PATHS.has(location.pathname)) {
    const from = location.state?.from
    const fallback =
      authType === 'partner' ? '/partner-dashboard' : authType === 'admin' ? '/admin/dashboard' : '/'
    const safeFrom =
      typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : fallback
    return <Navigate to={safeFrom} replace />
  }

  return children
}

const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact-us' element={<Contact />} />
          <Route path='/work' element={<WorkingProgress />} />
          <Route path='/events' element={<FoodFestEvents />} />
          <Route path='/events/:eventId' element={<FoodFestEventDetail />} />

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
          <Route path='/my-tickets' element={<ProtectedRoute requireAuth allowedType="user"><MyTickets /></ProtectedRoute>} />
          <Route path='/events/host' element={<ProtectedRoute requireAuth allowedType="user"><CreateEventProposal /></ProtectedRoute>} />
          <Route path='/events/organize' element={<ProtectedRoute requireAuth allowedType="user"><OrganizerDashboard /></ProtectedRoute>} />

          {/* Partner Protected Routes */}
          <Route path='/partner-dashboard' element={<ProtectedRoute requireAuth allowedType="partner"><Dashboard /></ProtectedRoute>} />
          <Route path='/order/:orderId' element={<ProtectedRoute requireAuth allowedType="partner"><OrderDetail /></ProtectedRoute>} />
          <Route path='/CreateFood' element={<ProtectedRoute requireAuth allowedType="partner"><CreateFood /></ProtectedRoute>} />
          <Route path='/partner-profile' element={<ProtectedRoute requireAuth allowedType="partner"><PartnerProfile /></ProtectedRoute>} />
          <Route path='/partner-profile/settings' element={<ProtectedRoute requireAuth allowedType="partner"><PartnerProfile /></ProtectedRoute>} />
          <Route path='/partner-foodfest' element={<ProtectedRoute requireAuth allowedType="partner"><StallApplications /></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path='/admin-login' element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path='/admin/dashboard' element={<ProtectedRoute requireAuth allowedType="admin"><AdminDashboard /></ProtectedRoute>} />

          {/* 404 Route */}
          <Route path='*' element={<ErrorPage />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default AppRoutes
