import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

// Create Auth Context
const AuthContext = createContext(null)



// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [partner, setPartner] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authType, setAuthType] = useState(null) // 'user', 'partner', 'admin', or null
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication status on mount
  const checkAuth = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      // Try to verify admin authentication first
      try {
        const adminResponse = await axios.get(API_ENDPOINTS.auth.adminVerify, axiosConfig)
        if (adminResponse?.data?.admin) {
          setAdmin(adminResponse.data.admin)
          setIsAuthenticated(true)
          setAuthType('admin')
          setUser(null)
          setPartner(null)
          return
        }
      } catch {
        // Admin not authenticated, continue to check user
      }

      // Try to verify user authentication
      try {
        const userResponse = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
        if (userResponse?.data?.user) {
          setUser(userResponse.data.user)
          setIsAuthenticated(true)
          setAuthType('user')
          setPartner(null)
          setAdmin(null)
          return
        }
      } catch {
        // User not authenticated, continue to check partner
      }

      // Try to verify partner authentication
      try {
        const partnerResponse = await axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig)
        if (partnerResponse?.data?.foodPartner) {
          setPartner(partnerResponse.data.foodPartner)
          setIsAuthenticated(true)
          setAuthType('partner')
          setUser(null)
          setAdmin(null)
          return
        }
      } catch {
        // Partner not authenticated
      }

      // None authenticated
      setUser(null)
      setPartner(null)
      setAdmin(null)
      setIsAuthenticated(false)
      setAuthType(null)
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      setPartner(null)
      setAdmin(null)
      setIsAuthenticated(false)
      setAuthType(null)
    } finally {
      if (!silent) setLoading(false)
      setAuthChecked(true)
    }
  }, [])

  // Run auth check on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Login user
  const loginUser = useCallback(async (credentials) => {
    try {
      setLoading(true)
      const response = await axios.post(
        API_ENDPOINTS.auth.userLogin,
        credentials,
        axiosConfig
      )

      if (response.data && response.data.message === "User logged in successfully") {
        // Fetch user profile
        const profileResponse = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
        if (profileResponse?.data?.user) {
          setUser(profileResponse.data.user)
          setPartner(null)
          setAdmin(null)
          setIsAuthenticated(true)
          setAuthType('user')
        }
        return { success: true, data: response.data }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Login partner
  const loginPartner = useCallback(async (credentials) => {
    try {
      setLoading(true)
      const response = await axios.post(
        API_ENDPOINTS.auth.partnerLogin,
        credentials,
        axiosConfig
      )

      if (response.data) {
        // Fetch partner profile
        const profileResponse = await axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig)
        if (profileResponse?.data?.foodPartner) {
          setPartner(profileResponse.data.foodPartner)
          setUser(null)
          setAdmin(null)
          setIsAuthenticated(true)
          setAuthType('partner')
        }
        return { success: true, data: response.data }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Login admin
  const loginAdmin = useCallback(async (credentials) => {
    try {
      setLoading(true)
      const response = await axios.post(
        API_ENDPOINTS.auth.adminLogin,
        credentials,
        axiosConfig
      )

      if (response.data) {
        // Fetch admin profile
        const profileResponse = await axios.get(API_ENDPOINTS.auth.adminVerify, axiosConfig)
        if (profileResponse?.data?.admin) {
          setAdmin(profileResponse.data.admin)
          setUser(null)
          setPartner(null)
          setIsAuthenticated(true)
          setAuthType('admin')
        }
        return { success: true, data: response.data }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      if (authType === 'user') {
        await axios.post(API_ENDPOINTS.auth.userLogout, {}, axiosConfig)
      } else if (authType === 'partner') {
        await axios.post(API_ENDPOINTS.auth.partnerLogout, {}, axiosConfig)
      } else if (authType === 'admin') {
        await axios.post(API_ENDPOINTS.auth.adminLogout, {}, axiosConfig)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setPartner(null)
      setAdmin(null)
      setIsAuthenticated(false)
      setAuthType(null)
      setLoading(false)
    }
  }, [authType])

  // Update user profile (optimistic update)
  const updateUserProfile = useCallback((updates) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : null)
  }, [])

  // Update partner profile (optimistic update)
  const updatePartnerProfile = useCallback((updates) => {
    setPartner(prev => prev ? ({ ...prev, ...updates }) : null)
  }, [])

  // Update admin profile (optimistic update)
  const updateAdminProfile = useCallback((updates) => {
    setAdmin(prev => prev ? ({ ...prev, ...updates }) : null)
  }, [])

  // Refresh auth state (after profile updates)
  const refreshAuth = useCallback(async () => {
    await checkAuth(true) // Silent refresh
  }, [checkAuth])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    user,
    partner,
    admin,
    isAuthenticated,
    authType, // 'user', 'partner', or 'admin'
    loading,
    authChecked,

    // Computed values
    isUser: authType === 'user',
    isPartner: authType === 'partner',
    isAdmin: authType === 'admin',
    currentUser: user || partner || admin,

    // Methods
    loginUser,
    loginPartner,
    loginAdmin,
    logout,
    updateUserProfile,
    updatePartnerProfile,
    updateAdminProfile,
    refreshAuth,
    checkAuth,
  }), [
    user,
    partner,
    admin,
    isAuthenticated,
    authType,
    loading,
    authChecked,
    loginUser,
    loginPartner,
    loginAdmin,
    logout,
    updateUserProfile,
    updatePartnerProfile,
    updateAdminProfile,
    refreshAuth,
    checkAuth
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
