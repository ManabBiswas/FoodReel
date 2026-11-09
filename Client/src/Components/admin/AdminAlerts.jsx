import React, { useEffect, useRef } from 'react'
import {
  AlertCircle, ArrowRight, BellRing, CheckCircle, ChefHat, RefreshCw,
  ShoppingBag, Star, Store, Users, X, Zap,
} from 'lucide-react'

/* Instant alerts — derives its rows from GET /api/admin/alerts (see
   server getAdminAlerts). Every row maps to an existing admin tab so one
   click takes the admin straight to the queue that clears it. */

const ICONS = {
  cancelRequests: ChefHat,
  reviews: Star,
  proposals: Zap,
  partners: Store,
  latestOrder: ShoppingBag,
  orders24h: ShoppingBag,
  newUsers24h: Users,
}

const PRIORITY_META = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
  task: { label: 'Task', color: '#e55a00', bg: 'rgba(255,106,0,0.10)' },
  info: { label: 'Update', color: '#9e9890', bg: 'rgba(26,18,8,0.05)' },
}

const timeAgo = (at) => {
  if (!at) return ''
  const time = new Date(at).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Date.now() - time
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  return new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const AlertRow = ({ alert, onNavigate }) => {
  const Icon = ICONS[alert.id] || BellRing
  const meta = PRIORITY_META[alert.priority] || PRIORITY_META.info
  const when = timeAgo(alert.at)
  return (
    <button
      type="button"
      onClick={() => alert.tab && onNavigate(alert.tab)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '12px 12px 12px 16px', borderRadius: 14, border: '1px solid var(--border)',
        background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', position: 'relative',
        fontFamily: 'var(--font-body)',
        transition: 'transform 180ms var(--ease-out), border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), background-color 180ms var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,106,0,0.35)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,18,8,0.08)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <span aria-hidden style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 999, background: meta.color }} />
      <span style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color: meta.color }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{alert.title}</span>
          {alert.count > 0 && (
            <span style={{
              minWidth: 22, height: 22, borderRadius: 999, padding: '0 7px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0,
              background: alert.priority === 'urgent' ? '#dc2626' : 'linear-gradient(135deg, #ff6a00, #e55a00)',
              boxShadow: '0 2px 8px rgba(255,106,0,0.35)',
            }}>
              {alert.count > 99 ? '99+' : alert.count}
            </span>
          )}
        </span>
        {alert.subtitle && (
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.subtitle}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: meta.color }}>{meta.label}</span>
          {when && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {when}</span>}
        </span>
      </span>
      <span style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--surface2)' }}>
        <ArrowRight style={{ width: 14, height: 14, color: 'var(--text3)' }} />
      </span>
    </button>
  )
}

const SectionTitle = ({ children }) => (
  <p style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', margin: '16px 4px 8px' }}>
    <span>{children}</span>
    <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </p>
)

const AllCaughtUp = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 20px 24px', marginTop: 8 }}>
    <span style={{
      width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.22)', marginBottom: 12,
    }}>
      <CheckCircle style={{ width: 27, height: 27, color: '#16a34a' }} />
    </span>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>All caught up</span>
    <span style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 4 }}>No tasks need you right now.</span>
  </div>
)

const AdminAlerts = ({ open, onClose, alerts = [], tasksCount = 0, loading = false, error = null, lastUpdated = null, onRefresh, onNavigate }) => {
  const closeRef = useRef(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  if (!open) return null

  const tasks = alerts.filter((alert) => alert.priority !== 'info')
  const updates = alerts.filter((alert) => alert.priority === 'info')
  const isInitialLoading = loading && alerts.length === 0

  return (
    <div
      role="dialog"
      aria-label="Instant alerts"
      className="anim-fade"
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 40,
        width: 'min(400px, calc(100vw - 24px))', maxWidth: 'calc(100vw - 24px)',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(26,18,8,0.28), 0 0 0 1px rgba(255,255,255,0.6)',
        transformOrigin: 'top right',
      }}
    >
      {/* Tail pointing at the bell */}
      <span aria-hidden style={{
        position: 'absolute', top: -6, right: 25, width: 12, height: 12, zIndex: 2,
        background: '#1a1208', transform: 'rotate(45deg)', borderTop: '1px solid rgba(255,184,0,0.3)', borderLeft: '1px solid rgba(255,184,0,0.3)',
      }} />

      {/* Header — dark editorial banner */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '18px 18px 16px',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        background: 'linear-gradient(135deg, #1a1208 0%, #3a2a12 55%, #6b2800 100%)',
      }}>
        <span aria-hidden style={{
          position: 'absolute', top: -46, right: -46, width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,106,0,0.38)', filter: 'blur(30px)', pointerEvents: 'none',
        }} />
        <span aria-hidden style={{
          position: 'absolute', bottom: -60, left: '30%', width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,184,0,0.14)', filter: 'blur(28px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, #ff6a00, #ffb800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255,106,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}>
            <BellRing style={{ width: 20, height: 20, color: 'white' }} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Instant Alerts
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
              {tasksCount > 0 ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 8px', borderRadius: 999,
                  background: 'linear-gradient(135deg, #ff6a00, #ffb800)', color: '#1a1208',
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {tasksCount} to do
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,214,120,0.9)', fontWeight: 600 }}>All clear</span>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,246,230,0.6)' }}>Tasks & recent updates</span>
            </span>
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh alerts"
              style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, cursor: loading ? 'wait' : 'pointer',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,246,230,0.9)',
                animation: loading ? 'spin 0.8s linear infinite' : 'none',
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close alerts"
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,246,230,0.9)',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 440, overflowY: 'auto', padding: '6px 12px 12px', background: '#fcfaf7' }}>
        {isInitialLoading && (
          <div style={{ padding: '8px 2px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 66, borderRadius: 14, background: 'var(--surface2)', animation: 'fadeIn 0.35s ease both', animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        )}

        {!isInitialLoading && error && alerts.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <span style={{
              width: 52, height: 52, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: 12,
            }}>
              <AlertCircle style={{ width: 24, height: 24, color: '#dc2626' }} />
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
              Couldn&apos;t load alerts
            </p>
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 14px' }}>Check your connection and try again.</p>
            <button type="button" onClick={onRefresh} className="btn-primary" style={{ fontSize: 12, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> Retry
            </button>
          </div>
        )}

        {!isInitialLoading && alerts.length > 0 && (
          <>
            {error && (
              <p style={{ fontSize: 12, color: '#dc2626', padding: '8px 6px 0', margin: 0 }}>
                Couldn&apos;t refresh — showing the last known alerts.
              </p>
            )}
            {tasks.length > 0 && (
              <>
                <SectionTitle>Tasks to do</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tasks.map((alert) => <AlertRow key={alert.id} alert={alert} onNavigate={onNavigate} />)}
                </div>
              </>
            )}
            {tasks.length === 0 && <AllCaughtUp />}
            {updates.length > 0 && (
              <>
                <SectionTitle>Recent updates</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {updates.map((alert) => <AlertRow key={alert.id} alert={alert} onNavigate={onNavigate} />)}
                </div>
              </>
            )}
          </>
        )}
        {!isInitialLoading && alerts.length === 0 && !error && <AllCaughtUp />}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface2)',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,0.15)' }} />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Loading…'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>Auto-refreshes every 30s</span>
      </div>
    </div>
  )
}

export default AdminAlerts
