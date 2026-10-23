import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { ChefHat, Check, X, Clock } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'
import { fmtCur } from '../adminConstants'

/**
 * The review queue for partner cancellation requests.
 */
const CancelRequestsTab = ({ navigate, setError }) => {
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [deciding, setDeciding] = useState(null)
  // One note per request. A single shared note used to leak across the queue
  const [notes, setNotes] = useState({})

  const fetchRequests = useCallback(async (pg = 1) => {
    try {
      setLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.cancelRequests}?page=${pg}&limit=10`, axiosConfig)
      setRequests(res.data.requests || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load cancellation requests')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchRequests(page) }, [page, fetchRequests])

  const decide = useCallback(async (orderId, decision) => {
    try {
      setDeciding(`${orderId}:${decision}`)
      await axios.post(
        API_ENDPOINTS.admin.decideCancelRequest(orderId),
        { decision, note: (notes[orderId] || '').trim() },
        axiosConfig
      )
      setNotes(prev => ({ ...prev, [orderId]: '' }))
      setRequests(prev => prev.filter(r => r.orderId !== orderId))
      fetchRequests(page)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record the decision')
    } finally { setDeciding(null) }
  }, [notes, page, fetchRequests, setError])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
        {pagination.total} request{pagination.total === 1 ? '' : 's'} awaiting review
      </p>

      {loading ? <Spinner /> : requests.length === 0 ? (
        <Empty text="No cancellation requests" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => (
            <div key={r.orderId} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ChefHat style={{ width: 17, height: 17, color: '#F59E0B' }} />
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>
                      #{String(r.orderId).slice(-8).toUpperCase()}
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      <Clock style={{ width: 10, height: 10 }} /> awaiting review
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px' }}>
                    {r.customer?.name || r.customer?.email || 'Unknown customer'}
                    {r.partner ? ` · ${r.partner}` : ''}
                    {' · '}
                    {r.requestedAt ? new Date(r.requestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>

                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px' }}>
                    <strong style={{ color: 'var(--text)' }}>Reason:</strong> {r.reason || 'Not specified'}
                  </p>
                  {r.details && (
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 4px', fontStyle: 'italic' }}>
                      "{r.details}"
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
                    {(r.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                </div>

                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', margin: 0 }}>
                  {fmtCur(r.amount)}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <input
                  value={notes[r.orderId] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [r.orderId]: e.target.value.slice(0, 500) }))}
                  placeholder="Optional note for the partner…"
                  aria-label={`Optional note for request ${String(r.orderId).slice(-8).toUpperCase()}`}
                  style={{
                    flex: 1, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 12, outline: 'none'
                  }}
                />
                <button
                  className="btn-icon"
                  disabled={deciding === `${r.orderId}:approve`}
                  onClick={() => decide(r.orderId, 'approve')}
                  title="Approve — cancel the order and refund the customer"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Check style={{ width: 13, height: 13 }} /> Approve
                </button>
                <button
                  className="btn-icon"
                  disabled={deciding === `${r.orderId}:reject`}
                  onClick={() => decide(r.orderId, 'reject')}
                  title="Reject — the partner must prepare and deliver the order"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <X style={{ width: 13, height: 13 }} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={pagination.page} pages={pagination.pages} setPage={setPage} />
    </div>
  )
}

export default CancelRequestsTab
