import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import UserRegister from '../pages/UserRegister'
import UserLogin from '../pages/UserLogin'
import PartnerRegister from '../pages/PartnerRegister'
import PartnerLogin from '../pages/PartnerLogin'
import CreateFood from '../pages/FoodPartner/CrateFood'
import Dashboard from '../pages/FoodPartner/Dashboard'

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
        <Route path='/Partner-Dashboard' element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default AppRoutes