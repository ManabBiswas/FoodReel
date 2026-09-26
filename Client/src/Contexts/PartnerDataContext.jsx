import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { PartnerDataContext } from '../config/contexts'
import { useAuth } from '../hooks/useAuth'

/**
 * PartnerDataProvider - Simple storage for partner data
 * Provides: partnerProfile, posts, loading, error, refresh
 */
export const PartnerDataProvider = ({ children }) => {
  const { isAuthenticated, authType } = useAuth()
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [posts, setPosts] = useState(null) // { food: [], advertisement: [] }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  /**
   * Fetch all partner data - simple, no transformations
   */
  const fetchPartnerData = useCallback(async (isRefresh = false) => {
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
      if (err.response?.status === 401) {
        setPartnerProfile(null)
        setPosts(null)
        setError('')
        return
      }
      console.error('Partner data fetch error:', err)
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load partner data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Partner data is per-account: load it for a partner session only, and clear
  // the previous partner's data on logout/login so it never leaks.
  useEffect(() => {
    if (authType === 'partner' && isAuthenticated) {
      fetchPartnerData()
    } else {
      setPartnerProfile(null)
      setPosts(null)
      setError('')
      setLoading(false)
    }
  }, [authType, isAuthenticated, fetchPartnerData])

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

