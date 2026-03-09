import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { LogOut, Menu, X, RefreshCw, Bell, Zap } from 'lucide-react'

import AdminGlobalStyles from '../../Components/admin/AdminGlobalStyles'
import { Confirm, ErrBox } from '../../Components/admin/AdminUI'
import { TABS } from '../../Components/admin/adminConstants'

import OverviewTab from '../../Components/admin/tabs/OverviewTab'
import UsersTab from '../../Components/admin/tabs/UsersTab'
import PartnersTab from '../../Components/admin/tabs/PartnersTab'
import ContentTab from '../../Components/admin/tabs/ContentTab'
import OrdersTab from '../../Components/admin/tabs/OrdersTab'
import ReviewsTab from '../../Components/admin/tabs/ReviewsTab'
import AnalyticsTab from '../../Components/admin/tabs/AnalyticsTab'

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD — Thin Shell
═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  /* ── Logout ────────────────────────────────────────── */
  const handleLogout = async () => {
    try { await axios.post(API_ENDPOINTS.auth.adminLogout, {}, axiosConfig) } catch {
      console.warn('Logout request failed')
     }
    navigate('/admin-login')
  }

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="admin-root">
      <AdminGlobalStyles />
      {confirmAction && (
        <Confirm msg={confirmAction.msg} onYes={() => { confirmAction.fn(); setConfirmAction(null) }} onNo={() => setConfirmAction(null)} />
      )}

      {/* ── Mobile toggle ── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 50, padding: '8px', borderRadius: 10, background: 'rgba(17,21,32,0.9)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text2)' }}
        className="mobile-toggle">
        {sidebarOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
      </button>

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, height: '100%', width: 260,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        zIndex: 40, display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo-ring">
              <Zap style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>FoodReel</h1>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', margin: 0, opacity: 0.9 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', padding: '6px 12px 8px', marginTop: 4 }}>Navigation</p>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: isActive ? '#A5B4FC' : 'var(--text2)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                <tab.icon style={{ width: 17, height: 17, color: isActive ? '#A5B4FC' : 'var(--text3)', flexShrink: 0 }} />
                {tab.label}
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#A5B4FC', boxShadow: '0 0 8px #6366F1' }} />}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#F87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}
            onClick={handleLogout}>
            <LogOut style={{ width: 17, height: 17 }} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 30 }} />}

      {/* ── Main ── */}
      <main className="main-content">
        {/* Header */}
        <div className="header-bar">
          <div style={{ paddingLeft: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 12, margin: '2px 0 0', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)', transition: 'all 0.2s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}>
              <Bell style={{ width: 16, height: 16 }} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#F87171', border: '1.5px solid var(--surface)' }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: 1400 }} className="anim-fade">
          {error && <ErrBox msg={error} onRetry={() => setError('')} />}

          {/* Tab Content Router */}
          {activeTab === 'overview' && <OverviewTab navigate={navigate} setError={setError} setActiveTab={setActiveTab} />}
          {activeTab === 'users' && <UsersTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'partners' && <PartnersTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'content' && <ContentTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'orders' && <OrdersTab navigate={navigate} setError={setError} />}
          {activeTab === 'reviews' && <ReviewsTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'analytics' && <AnalyticsTab navigate={navigate} setError={setError} />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

      