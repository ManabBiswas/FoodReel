import { useContext } from 'react'
import { PartnerDataContext } from '../config/contexts'

/**
 * Hook to access partner data from context
 * Use in components to get: partnerProfile, posts, loading, refreshing, error, refresh
 */
export const usePartnerData = () => {
  const context = useContext(PartnerDataContext)
  if (!context) {
    throw new Error('usePartnerData must be used within PartnerDataProvider')
  }
  return context
}
