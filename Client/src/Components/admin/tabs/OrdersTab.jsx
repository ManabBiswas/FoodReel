import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Package } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'
import { fmtCur, STATUS_COLORS } from '../adminConstants'

const OrdersTab = ({ navigate, setError }) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'var(--surface)', padding: '8px 10px', borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
          <button key={s} className={`status-filter ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1) }}>{s}</button>
        ))}
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{pagination.total} orders</p>
      {loading ? <Spinner /> : orders.length === 0 ? <Empty text="No orders found" /> : (
        <div className="card">
          {orders.map((o, idx) => {
            const sc = STATUS_COLORS[o.status] || { bg: 'rgba(255,255,255,0.05)', text: '#94A3B8', dot: '#94A3B8' }
            return (
              <div key={o._id} className="row-item"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: idx < orders.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package style={{ width: 17, height: 17, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>#{o._id?.slice(-8).toUpperCase()}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />{o.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>{o.user?.name || o.user?.email || 'Unknown'} · {o.items?.length || 0} items</p>
                  <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', margin: '2px 0 0' }}>
                    {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
