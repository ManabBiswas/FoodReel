import { useContext } from 'react'
import AuthContext from '../Contexts/AuthContext'

/**
 * Main authentication hook
 * Provides access to all auth state and methods
 * 
 * @returns {Object} Complete auth context
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook for checking if user is authenticated
 * @returns {Boolean} True if any user type is logged in
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook for getting current user/partner/admin
 * @returns {Object|null} Currently logged in user object
 */
export const useCurrentUser = () => {
  const { currentUser } = useAuth()
  return currentUser
}

/**
 * Hook for getting auth type
 * @returns {String|null} 'user', 'partner', 'admin', or null
 */
export const useAuthType = () => {
  const { authType } = useAuth()
  return authType
}

/**
 * Hook for type checking helpers
 * @returns {Object} Boolean flags for each user type
 */
export const useUserType = () => {
  const { isUser, isPartner, isAdmin } = useAuth()
  return { isUser, isPartner, isAdmin }
}

/**
 * Hook for logout functionality
 * @returns {Function} Logout function
 */
export const useLogout = () => {
  const { logout } = useAuth()
  return logout
}

export default useAuth
