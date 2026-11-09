import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Ban, Package } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'
import { fmtCur, STATUS_COLORS } from '../adminConstants'

//  its for orders that are still cancellable by the admin (before the partner has marked it ready or delivered)
const CANCELLABLE = ['pending', 'confirmed', 'preparing']

const OrdersTab = ({ navigate, setError, setConfirmAction, onDataChanged }) => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchOrders = useCallback(async (pg = 1, st = 'all') => {
    try {
      setLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.orders}?page=${pg}&limit=10&status=${st}`, axiosConfig)
      setOrders(res.data.orders || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load orders')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchOrders(page, status) }, [page, status, fetchOrders])

  /* Cancel a stranded order (blocked partner can no longer act). Paid online
     orders auto-refund server-side; the confirm modal in the shell guards
     accidental clicks, and the refund claim is atomic against double-clicks. */
  const cancelOrder = async (order) => {
    try {
      const res = await axios.post(
        API_ENDPOINTS.admin.cancelOrder(order._id),
        { reason: 'Cancelled by admin (partner unavailable)' },
        axiosConfig,
      )
      setOrders((prev) => prev.filter((o) => o._id !== order._id))
      onDataChanged?.()
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel order')
      return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'var(--surface)', padding: '8px 10px', borderRadius: 12, border: '1px solid var(--border)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancel_requested', 'cancelled'].map(s => (
          <button key={s} className={`status-filter ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1) }}>{s}</button>
        ))}
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{pagination.total} orders</p>
      {loading ? <Spinner /> : orders.length === 0 ? <Empty text="No orders found" /> : (
        <div className="card">
          {orders.map((o, idx) => {
            const sc = STATUS_COLORS[o.status] || { bg: 'rgba(26,18,8,0.05)', text: '#6b6460', dot: '#9e9890' }
            return (
              <div key={o._id} className="row-item"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: idx < orders.length - 1 ? '1px solid rgba(26,18,8,0.06)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package style={{ width: 17, height: 17, color: '#ff6a00' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>#{o._id?.slice(-8).toUpperCase()}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />{o.status}
                    </span>
                    {CANCELLABLE.includes(o.status) && setConfirmAction && (
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        title="Cancel this order (refunds the customer if paid online)"
                        aria-label={`Cancel order ${o._id?.slice(-8).toUpperCase()}`}
                        onClick={() => setConfirmAction({
                          msg: `Cancel order #${o._id?.slice(-8).toUpperCase()}? The customer gets refunded automatically if they paid online.`,
                          fn: () => cancelOrder(o),
                        })}
                      >
                        <Ban style={{ width: 15, height: 15 }} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>{o.user?.name || o.user?.email || 'Unknown'} · {o.items?.length || 0} items</p>
                  {(() => {
                    const partners = [...new Set((o.items || []).map((i) => i.foodPartner?.companyName).filter(Boolean))]
                    return partners.length > 0 ? (
                      <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0' }}>{partners.join(', ')}</p>
                    ) : null
                  })()}
                  <p style={{ fontSize: 10, color: 'var(--text3)', margin: '2px 0 0', opacity: 0.7 }}>
                    {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {o.paymentDetails?.method ? ` · ${o.paymentDetails.method === 'cash_on_delivery' ? 'COD' : o.paymentDetails.method} · ${o.paymentDetails.status || 'unpaid'}` : ''}
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', flexShrink: 0 }}>{fmtCur(o.pricing?.totalAmount)}</p>
              </div>
            )
          })}
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} setPage={setPage} />
    </div>
  )
}

export default OrdersTab
