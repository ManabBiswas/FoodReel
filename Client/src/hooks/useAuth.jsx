import { useContext } from 'react'
import AuthContext from '../Contexts/AuthContext'

/**
 * Custom hook for accessing authentication context
 * Provides smoother access to auth state and methods
 * 
 * @returns {Object} Auth context value with state and methods
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
 * Simplified version for quick auth checks
 * 
 * @returns {Boolean} Authentication status
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook for getting current user data
 * Returns user or partner whoever is logged in
 * 
 * @returns {Object|null} Current user/partner object
 */
export const useCurrentUser = () => {
  const { currentUser } = useAuth()
  return currentUser
}

/**
 * Hook for user-specific operations
 * Only use in user-facing components
 * 
 * @returns {Object} User state and operations
 */
export const useUser = () => {
  const { user, isUser, loginUser, updateUserProfile } = useAuth()
  
  return {
    user,
    isUser,
    loginUser,
    updateProfile: updateUserProfile
  }
}

/**
 * Hook for partner-specific operations
 * Only use in partner-facing components
 * 
 * @returns {Object} Partner state and operations
 */
export const usePartner = () => {
  const { partner, isPartner, loginPartner, updatePartnerProfile } = useAuth()
  
  return {
    partner,
    isPartner,
    loginPartner,
    updateProfile: updatePartnerProfile
  }
}

/**
 * Hook for authentication guards
 * Use for protecting routes and components
 * 
 * @returns {Object} Auth guard utilities
 */
export const useAuthGuard = () => {
  const { isAuthenticated, loading, authChecked, authType } = useAuth()
  
  return {
    isAuthenticated,
    loading,
    authChecked,
    authType,
    canAccess: (requiredType) => {
      if (!requiredType) return isAuthenticated
      return authType === requiredType
    },
    isReady: authChecked && !loading
  }
}

/**
 * Hook for logout with navigation
 * Automatically handles cleanup and redirect
 * 
 * @returns {Function} Logout function
 */
export const useLogout = () => {
  const { logout } = useAuth()
  return logout
}

export default useAuth