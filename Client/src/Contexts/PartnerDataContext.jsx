import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

export const PartnerDataContext = createContext(null)

/**
 * PartnerDataProvider - Single source of truth for all partner data
 * Provides: profile, statistics, posts, loading, error, refresh
 */
export const PartnerDataProvider = ({ children }) => {
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [posts, setPosts] = useState(null) // { food: [], advertisement: [] }
  const [counts, setCounts] = useState(null) // { total, food, advertisement }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  /**
   * Fetch all partner data from backend
   * Combines: auth check, food/my-posts, derives statistics
   */
  const fetchPartnerData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError('')

      // Fetch partner profile, food posts, and ads in parallel from different endpoints
      const [authRes, foodRes, adsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig),
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig).catch(() => ({ data: { data: [] } }))
      ])

      const partner = authRes.data?.foodPartner
      setPartnerProfile(partner)

      // Extract counts & posts from food endpoint (only food items, not food ads)
      const backendCounts = foodRes.data?.counts || {}
      const grouped = foodRes.data?.foods || {}

      // Normalize food post data from foodModel
      const foodPosts = (grouped.food || []).map((p) => ({
        ...p,
        id: p._id || p.id, // Normalize MongoDB _id to id
        postType: 'food',
        likeCount: p.likeCount || p.likes?.length || 0,
        commentCount: p.commentCount || p.comments?.length || 0,
        savesCount: p.savesCount || p.saves?.length || 0
      }))

      // Normalize advertisement data from Advertisement collection
      const adPosts = (adsRes.data?.data || []).map((a) => ({
        ...a,
        id: a._id || a.id, // Normalize MongoDB _id to id
        postType: 'advertisement',
        // Map 'file' field to 'image' or 'video' based on type
        image: a.type === 'image' ? a.file : undefined,
        video: a.type === 'video' ? a.file : undefined,
        likeCount: a.likeCount || a.likes?.length || 0,
        commentCount: a.commentCount || a.comments?.length || 0
      }))

      // Combine ad counts
      const totalAdCount = adPosts.length
      setCounts({
        ...backendCounts,
        advertisement: totalAdCount
      })

      setPosts({ food: foodPosts, advertisement: adPosts })

      // Calculate statistics for dashboard
      setStatistics({
        food: {
          count: backendCounts.food ?? foodPosts.length,
          totalLikes: foodPosts.reduce((s, p) => s + p.likeCount, 0),
          totalReviews: foodPosts.reduce((s, p) => s + p.commentCount, 0),
          totalSaves: foodPosts.reduce((s, p) => s + p.savesCount, 0)
        },
        advertisement: {
          count: totalAdCount,
          totalLikes: adPosts.reduce((s, a) => s + a.likeCount, 0),
          totalComments: adPosts.reduce((s, a) => s + a.commentCount, 0)
        }
      })
    } catch (err) {
      console.error('Partner data fetch error:', err)
      const msg = err.response?.data?.message || 'Failed to load partner data'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchPartnerData()
  }, [fetchPartnerData])

  const handleRefresh = useCallback(() => {
    fetchPartnerData(true)
  }, [fetchPartnerData])

  const value = {
    // Data
    partnerProfile,
    statistics,
    posts, // { food: [], advertisement: [] }
    counts, // { total, food, advertisement }

    // State
    loading,
    refreshing,
    error,

    // Methods
    refresh: handleRefresh,
    refetch: fetchPartnerData
  }

  return (
    <PartnerDataContext.Provider value={value}>
      {children}
    </PartnerDataContext.Provider>
  )
}

/**
 * Hook: usePartnerData
 * Access all partner data from context
 */
export const usePartnerData = () => {
  const context = useContext(PartnerDataContext)
  if (!context) {
    throw new Error('usePartnerData must be used within PartnerDataProvider')
  }
  return context
}

export default PartnerDataProvider
