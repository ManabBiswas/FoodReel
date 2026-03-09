import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Star, Trash2 } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'

const ReviewsTab = ({ navigate, setError, setConfirmAction }) => {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchReviews = useCallback(async (pg = 1) => {
    try {
      setLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.reviews}?page=${pg}&limit=10`, axiosConfig)
      setReviews(res.data.reviews || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load reviews')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchReviews(page) }, [page, fetchReviews])

  const deleteReview = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteReview(id), axiosConfig)
      setReviews(prev => prev.filter(r => r._id !== id))
    } catch { setError('Failed to delete review') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{pagination.total} reviews</p>
      {loading ? <Spinner /> : reviews.length === 0 ? <Empty text="No reviews" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {reviews.map(r => (
            <div key={r._id} className="review-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>{(r.user?.name || 'A')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{r.user?.name || r.user?.email || 'Anonymous'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 0' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <button className="btn-icon btn-delete" onClick={() => setConfirmAction({ msg: 'Delete this review?', fn: () => deleteReview(r._id) })}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: 15, height: 15, color: i < (r.rating || 0) ? '#FCD34D' : 'rgba(255,255,255,0.08)', fill: i < (r.rating || 0) ? '#FCD34D' : 'none' }} />
                ))}
              </div>
              {r.comment && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, margin: 0 }}>{r.comment}</p>}
              {r.title && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>"{r.title}"</p>}
            </div>
          ))}
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} setPage={setPage} />
    </div>
  )
}

export default ReviewsTab
