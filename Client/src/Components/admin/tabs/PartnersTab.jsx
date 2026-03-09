import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Search, Store, CheckCircle, Shield, ShieldOff, Ban, Trash2 } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'

const PartnersTab = ({ navigate, setError, setConfirmAction }) => {
  const [partners, setPartners] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPartners = useCallback(async (pg = 1, q = '') => {
    try {
      setLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.partners}?page=${pg}&limit=10&search=${encodeURIComponent(q)}`, axiosConfig)
      setPartners(res.data.partners || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load partners')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchPartners(page, search) }, [page, fetchPartners])

  const handleSearch = () => { setPage(1); fetchPartners(1, search) }

  const toggleVerify = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.togglePartnerVerify(id), {}, axiosConfig)
      setPartners(prev => prev.map(p => p._id === id ? { ...p, verified: !p.verified } : p))
    } catch { setError('Failed to update partner') }
  }

  const toggleBlock = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.togglePartnerBlock(id), {}, axiosConfig)
      setPartners(prev => prev.map(p => p._id === id ? { ...p, isBlocked: !p.isBlocked } : p))
    } catch { setError('Failed to update partner') }
  }

  const deletePartner = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deletePartner(id), axiosConfig)
      setPartners(prev => prev.filter(p => p._id !== id))
    } catch { setError('Failed to delete partner') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="search-box">
        <Search style={{ width: 16, height: 16, color: 'var(--text3)', flexShrink: 0 }} />
        <input placeholder="Search by restaurant name…" value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn-primary" onClick={handleSearch} style={{ padding: '6px 14px', fontSize: 12 }}>Search</button>
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{pagination.total} partners total</p>
      {loading ? <Spinner /> : partners.length === 0 ? <Empty text="No partners found" /> : (
        <div className="card">
          {partners.map((p, idx) => (
            <div key={p._id} className="row-item"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: idx < partners.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(52,211,153,0.25)' }}>
                <Store style={{ width: 18, height: 18, color: 'white' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.companyName}</p>
                  {p.verified && <CheckCircle style={{ width: 14, height: 14, color: '#22D3EE', flexShrink: 0 }} />}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {p.isBlocked && <span className="pill" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>Blocked</span>}
                <span className="pill" style={{ background: p.verified ? 'rgba(34,211,238,0.1)' : 'rgba(252,211,77,0.1)', color: p.verified ? '#22D3EE' : '#FCD34D' }}>
                  {p.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className={`btn-icon ${p.verified ? 'btn-revoke' : 'btn-verify'}`} onClick={() => toggleVerify(p._id)} title={p.verified ? 'Revoke' : 'Verify'}>
                  {p.verified ? <ShieldOff style={{ width: 15, height: 15 }} /> : <Shield style={{ width: 15, height: 15 }} />}
                </button>
                <button className={`btn-icon ${p.isBlocked ? 'btn-unblock' : 'btn-block'}`} onClick={() => toggleBlock(p._id)} title={p.isBlocked ? 'Unblock' : 'Block'}>
                  {p.isBlocked ? <Shield style={{ width: 15, height: 15 }} /> : <Ban style={{ width: 15, height: 15 }} />}
                </button>
                <button className="btn-icon btn-delete" onClick={() => setConfirmAction({ msg: `Delete "${p.companyName}"?`, fn: () => deletePartner(p._id) })}>
                  <Trash2 style={{ width: 15, height: 15 }} />
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

export default PartnersTab
