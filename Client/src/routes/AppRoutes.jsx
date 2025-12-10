import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import UserRegister from '../pages/User/UserRegister'
import UserLogin from '../pages/User/UserLogin'
import PartnerRegister from '../pages/FoodPartner/PartnerRegister'
import PartnerLogin from '../pages/FoodPartner/PartnerLogin'
import PartnerProfile from '../pages/FoodPartner/PartnerProfile'
import CreateFood from '../pages/FoodPartner/CreateFood'
import Dashboard from '../pages/FoodPartner/Dashboard'
import UserProfile from '../pages/User/UserProfile'
import ProfileSettings from '../pages/User/ProfileSettings'
import ErrorPage from '../pages/404'
import WorkingProgress from '../pages/WorkingProgress'
import Reel from '../pages/Reel'
import CreatePost from '../pages/User/CreatePost'
import About from '../pages/About'
import Contact from '../pages/Contact'
import AdminPage from '../pages/Admin/AdminPage'
import AdminDashboard from '../pages/Admin/AdminDashboard'

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact-us' element={<Contact />} />
        <Route path='/register' element={<UserRegister />} />
        <Route path='/login' element={<UserLogin />} />
        <Route path='/create-post' element={<CreatePost />} />
        <Route path='/partner-register' element={<PartnerRegister />} />
        <Route path='/partner-login' element={<PartnerLogin />} />
        <Route path='/partner-dashboard' element={<Dashboard />} />
        <Route path='/CreateFood' element={<CreateFood />} />
        <Route path='/profile' element={<UserProfile />} />
        <Route path='/profile/settings' element={<ProfileSettings />} />
        <Route path='/partner-profile' element={<PartnerProfile />} />
        <Route path='*' element={<ErrorPage />} />
        <Route path='/reels' element={<Reel />} />
        <Route path='/work' element={<WorkingProgress />} />
        <Route path='/admin-login-you-are-admin' element={<AdminPage />} />
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes