import React from 'react'
import {
  AlertCircle, ChevronLeft, ChevronRight, Package,
  ArrowUpRight, TrendingDown
} from 'lucide-react'

export const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366F1', animation: 'spin 0.7s linear infinite' }} />
    <p style={{ color: 'var(--text3)', fontSize: 13, fontWeight: 500 }}>Loading...</p>
  </div>
)

export const ErrBox = ({ msg, onRetry }) => (
  <div style={{ padding: '14px 18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
    <AlertCircle style={{ width: 18, height: 18, color: '#F87171', flexShrink: 0 }} />
    <p style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>{msg}</p>
    {onRetry && <button onClick={onRetry} className="btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}>Retry</button>}
  </div>
)

export const Empty = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Package style={{ width: 28, height: 28, color: 'var(--text3)' }} />
    </div>
    <p style={{ color: 'var(--text3)', fontSize: 13, fontWeight: 500 }}>{text}</p>
  </div>
)

export const Pagination = ({ page, pages, setPage }) => pages > 1 ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }}>
    <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft style={{ width: 16, height: 16 }} /></button>
    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
      const start = Math.max(1, Math.min(page - 2, pages - 4))
      const num = start + i
      return num <= pages ? (
        <button key={num} className={`pagination-num ${num === page ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
      ) : null
    })}
    <button className="pagination-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight style={{ width: 16, height: 16 }} /></button>
  </div>
) : null

export const Confirm = ({ msg, onYes, onNo }) => (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <AlertCircle style={{ width: 22, height: 22, color: '#F87171' }} />
      </div>
      <p style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'center', fontSize: 15, marginBottom: 8, fontFamily: 'var(--font-display)' }}>{msg}</p>
      <p style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>This action cannot be undone.</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onNo} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
        <button onClick={onYes} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Delete</button>
      </div>
    </div>
  </div>
)

export const ChartTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E2438', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 130 }}>
      <p style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 14, fontWeight: 700, color: p.color || '#A5B4FC', fontFamily: 'var(--font-display)' }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  )
}

export const StatCard = ({ title, value, icon: Icon, color, bg, change }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon && <Icon style={{ width: 20, height: 20, color }} />}
      </div>
      {change !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 700, color: change >= 0 ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: 3, background: change >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', padding: '3px 8px', borderRadius: 20 }}>
          {change >= 0 ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{title}</p>
    <p style={{ color: 'var(--text)', fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: 12, opacity: 0.4 }} />
  </div>
)
