import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import { Search, Shield, Ban, Trash2 } from 'lucide-react'
import { Spinner, Empty, Pagination } from '../AdminUI'

const UsersTab = ({ navigate, setError, setConfirmAction }) => {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async (pg = 1, q = '') => {
    try {
      setLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.users}?page=${pg}&limit=10&search=${encodeURIComponent(q)}`, axiosConfig)
      setUsers(res.data.users || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load users')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchUsers(page, search) }, [page, fetchUsers])

  const handleSearch = () => { setPage(1); fetchUsers(1, search) }

  const toggleBlock = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.toggleUserBlock(id), {}, axiosConfig)
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u))
    } catch { setError('Failed to update user') }
  }

  const deleteUser = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteUser(id), axiosConfig)
      setUsers(prev => prev.filter(u => u._id !== id))
    } catch { setError('Failed to delete user') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="search-box">
        <Search style={{ width: 16, height: 16, color: 'var(--text3)', flexShrink: 0 }} />
        <input placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn-primary" onClick={handleSearch} style={{ padding: '6px 14px', fontSize: 12 }}>Search</button>
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>{pagination.total} users total</p>
      {loading ? <Spinner /> : users.length === 0 ? <Empty text="No users found" /> : (
        <div className="card">
          {users.map((user, idx) => (
            <div key={user._id} className="row-item"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(99,102,241,0.25)' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{(user.firstName || user.name || 'U')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{user.firstName || user.name || 'User'} {user.lastName || ''}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {user.isBlocked && <span className="pill" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>Blocked</span>}
                <span style={{ fontSize: 11, color: 'var(--text3)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', fontWeight: 500 }}>
                  {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className={`btn-icon ${user.isBlocked ? 'btn-unblock' : 'btn-block'}`} onClick={() => toggleBlock(user._id)} title={user.isBlocked ? 'Unblock' : 'Block'}>
                  {user.isBlocked ? <Shield style={{ width: 15, height: 15 }} /> : <Ban style={{ width: 15, height: 15 }} />}
                </button>
                <button className="btn-icon btn-delete" onClick={() => setConfirmAction({ msg: `Delete ${user.firstName || user.name || 'this user'}?`, fn: () => deleteUser(user._id) })} title="Delete">
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

export default UsersTab
