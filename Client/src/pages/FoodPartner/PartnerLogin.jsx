import React from 'react'
import { LogIn, Building2 } from 'lucide-react'

const PartnerLogin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Login</h1>
          <p className="text-gray-600 mt-2">Login here to access your food partner dashboard</p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" className="mt-1 p-2 w-full border border-gray-300 rounded-md" />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="password" className="mt-1 p-2 w-full border border-gray-300 rounded-md" />
        </div>
        
        <button className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md cursor-pointer">
          Login
          <LogIn className="w-4 h-4 mr-2 hover:translate-x-[2px]" />
        </button>
      </div>
    </div>
  )
}

export default PartnerLogin
