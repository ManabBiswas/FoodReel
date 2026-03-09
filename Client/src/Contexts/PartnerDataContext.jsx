import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { PartnerDataContext } from '../config/contexts'

/**
 * PartnerDataProvider - Simple storage for partner data
 * Provides: partnerProfile, posts, loading, error, refresh
 */
export const PartnerDataProvider = ({ children }) => {
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [posts, setPosts] = useState(null) // { food: [], advertisement: [] }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  /**
   * Fetch all partner data - simple, no transformations
   */
  const fetchPartnerData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError('')

      // Fetch in parallel
      const [authRes, foodRes, adsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig),
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig).catch(() => ({ data: { data: [] } }))
      ])

      setPartnerProfile(authRes.data?.foodPartner)

      const grouped = foodRes.data?.foods || {}
      const foodPosts = grouped.food || []
      
      // Map ads: convert 'file' field to 'image' or 'video' based on type
      const adPosts = (adsRes.data?.data || []).map(ad => ({
        ...ad,
        id: ad._id,
        image: ad.type === 'image' ? ad.file : undefined,
        video: ad.type === 'video' ? ad.file : undefined
      }))

      setPosts({ food: foodPosts, advertisement: adPosts })
    } catch (err) {
      console.error('Partner data fetch error:', err)
      setError(err.response?.data?.message || 'Failed to load partner data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch once on mount
  useEffect(() => {
    fetchPartnerData()
  }, [])

  const value = {
    partnerProfile,
    posts, // { food: [], advertisement: [] }
    loading,
    refreshing,
    error,
    refresh: () => fetchPartnerData(true)
  }

  return (
    <PartnerDataContext.Provider value={value}>
      {children}
    </PartnerDataContext.Provider>
  )
}

export default PartnerDataProvider

