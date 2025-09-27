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
          <p className="text-gray-600 mt-2">Access your food partner dashboard</p>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
            <LogIn className="w-5 h-5 mr-2" />
            Coming Soon
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Partner login functionality will be available soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default PartnerLogin
