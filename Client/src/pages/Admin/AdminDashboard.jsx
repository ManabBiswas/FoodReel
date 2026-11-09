import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { LogOut, Menu, X, RefreshCw, Bell, Zap } from 'lucide-react'

import AdminGlobalStyles from '../../Components/admin/AdminGlobalStyles'
import { Confirm, ErrBox } from '../../Components/admin/AdminUI'
import AdminAlerts from '../../Components/admin/AdminAlerts'
import { TABS } from '../../Components/admin/adminConstants'
import SplitHeading from '../../Components/admin/SplitHeading'

import OverviewTab from '../../Components/admin/tabs/OverviewTab'
import UsersTab from '../../Components/admin/tabs/UsersTab'
import PartnersTab from '../../Components/admin/tabs/PartnersTab'
import ContentTab from '../../Components/admin/tabs/ContentTab'
import OrdersTab from '../../Components/admin/tabs/OrdersTab'
import CancelRequestsTab from '../../Components/admin/tabs/CancelRequestsTab'
import ReviewsTab from '../../Components/admin/tabs/ReviewsTab'
import AnalyticsTab from '../../Components/admin/tabs/AnalyticsTab'
import EventProposalsTab from '../../Components/admin/tabs/EventProposalsTab'
import EventManagementTab from '../../Components/admin/tabs/EventManagementTab'

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD — Thin Shell
═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const alertsWrapRef = useRef(null)

  /* Instant alerts — one cheap aggregate polled every 30s so the bell badge
     reflects the real queues (cancel requests, reviews, proposals,
     verifications) on every tab, not just the overview. */
  const alertsQuery = useLiveQuery({
    fetcher: async () => {
      const res = await axios.get(API_ENDPOINTS.admin.alerts, axiosConfig)
      return res.data
    },
    intervalMs: 30000,
  })
  const alerts = alertsQuery.data?.alerts || []
  const tasksCount = alertsQuery.data?.tasksCount || 0

  /* Refresh the bell instantly after any action that clears (or creates) an
     alert — waiting for the 30s poll made the “tasks to do” list look stuck. */
  const handleDataChanged = useCallback(() => {
    alertsQuery.refresh()
  }, [alertsQuery.refresh])

  /* Also refresh when switching tabs: queues may have changed while the admin
     was working (including another admin's decisions). */
  useEffect(() => {
    handleDataChanged()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (alertsQuery.error?.response?.status === 401) navigate('/admin-login')
  }, [alertsQuery.error, navigate])

  useEffect(() => {
    if (!alertsOpen) return undefined
    const onPointerDown = (event) => {
      if (alertsWrapRef.current && !alertsWrapRef.current.contains(event.target)) {
        setAlertsOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAlertsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [alertsOpen])

  const toggleAlerts = () => {
    const next = !alertsOpen
    setAlertsOpen(next)
    if (next) alertsQuery.refresh()
  }

  const goToTab = (tabId) => {
    setActiveTab(tabId)
    setAlertsOpen(false)
    setSidebarOpen(false)
  }

  /* ── Logout ────────────────────────────────────────── */
  const handleLogout = async () => {
    // Context logout clears the admin cookie AND auth state — otherwise
    // ProtectedRoute sees the user as still authenticated and bounces.
    await logout()
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
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 50, padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text2)' }}
        className="mobile-toggle">
        {sidebarOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
      </button>

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo-ring">
              <Zap style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
                <SplitHeading as="span" text="FoodReel" style={{ display: 'inline-block' }} />
              </h1>
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
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: isActive ? 'linear-gradient(135deg, rgba(255,106,0,0.11), rgba(255,184,0,0.06))' : 'transparent', color: isActive ? '#e55a00' : 'var(--text2)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                <tab.icon style={{ width: 17, height: 17, color: isActive ? '#e55a00' : 'var(--text3)', flexShrink: 0 }} />
                {tab.label}
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#ff6a00', boxShadow: '0 0 8px #ff6a00' }} />}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}
            onClick={handleLogout}>
            <LogOut style={{ width: 17, height: 17 }} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', backdropFilter: 'blur(4px)', zIndex: 30 }} />}

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
          <div ref={alertsWrapRef} style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <button
              type="button"
              onClick={toggleAlerts}
              aria-haspopup="true"
              aria-expanded={alertsOpen}
              aria-label={tasksCount > 0 ? `Instant alerts, ${tasksCount} tasks to do` : 'Instant alerts'}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)', transition: 'all 0.2s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'rgba(255,106,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}>
              <Bell style={{ width: 16, height: 16 }} />
              {tasksCount > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 3, minWidth: 17, height: 17, padding: '0 5px', borderRadius: 999, background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--surface)', boxShadow: '0 0 0 3px rgba(220,38,38,0.18), 0 2px 8px rgba(220,38,38,0.4)' }}>
                  {tasksCount > 99 ? '99+' : tasksCount}
                </span>
              )}
            </button>
            <AdminAlerts
              open={alertsOpen}
              onClose={() => setAlertsOpen(false)}
              alerts={alerts}
              tasksCount={tasksCount}
              loading={alertsQuery.loading}
              error={alertsQuery.error}
              lastUpdated={alertsQuery.lastUpdated}
              onRefresh={() => alertsQuery.refresh()}
              onNavigate={goToTab}
            />
          </div>
        </div>

        <div className="admin-content anim-fade">
          {error && <ErrBox msg={error} onRetry={() => setError('')} />}

          {/* Tab Content Router */}
          {activeTab === 'overview' && <OverviewTab navigate={navigate} setError={setError} setActiveTab={setActiveTab} />}
          {activeTab === 'users' && <UsersTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'partners' && <PartnersTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} onDataChanged={handleDataChanged} />}
          {activeTab === 'content' && <ContentTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'orders' && <OrdersTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} onDataChanged={handleDataChanged} />}
      {activeTab === 'cancels' && <CancelRequestsTab navigate={navigate} setError={setError} onDataChanged={handleDataChanged} />}
      {activeTab === 'event-proposals' && <EventProposalsTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} onDataChanged={handleDataChanged} />}
      {activeTab === 'events' && <EventManagementTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} />}
          {activeTab === 'reviews' && <ReviewsTab navigate={navigate} setError={setError} setConfirmAction={setConfirmAction} onDataChanged={handleDataChanged} />}
          {activeTab === 'analytics' && <AnalyticsTab navigate={navigate} setError={setError} />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

      