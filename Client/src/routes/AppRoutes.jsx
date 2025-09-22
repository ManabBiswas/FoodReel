import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import UserRegister from '../pages/User/UserRegister'
import UserLogin from '../pages/User/UserLogin'
import PartnerRegister from '../pages/FoodPartner/PartnerRegister'
import PartnerLogin from '../pages/FoodPartner/PartnerLogin'
import PartnerProfile from '../pages/FoodPartner/PartnerProfile'
import CreateFood from '../pages/FoodPartner/CrateFood'
import Dashboard from '../pages/FoodPartner/Dashboard'
import UserProfile from '../pages/User/UserProfile'

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<UserRegister />} />
        <Route path='/login' element={<UserLogin />} />
        <Route path='/partner-register' element={<PartnerRegister />} />
        <Route path='/partner-login' element={<PartnerLogin />} />
        <Route path='/CreateFood' element={<CreateFood />} />
        <Route path='/partner-dashboard' element={<Dashboard />} />
        <Route path='/profile' element={<UserProfile />} />
        <Route path='/partner-profile' element={<PartnerProfile />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes