import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import {
  LineChart, Line, Area, AreaChart, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Users, Store, ShoppingBag, Package, IndianRupee, Activity,
  TrendingUp, ArrowUpRight, RefreshCw, Pause, Play, Radio, AlertTriangle
} from 'lucide-react'
import { Spinner, Empty, ChartTooltip } from '../AdminUI'
import { fmtCur, STATUS_COLORS } from '../adminConstants'
import { useLiveQuery } from '../../../hooks/useLiveQuery'

/* ═══════════════════════════════════════════════════════
   ANIMATED NUMBER — eases from its previous value so a
   dashboard refresh reads as movement, not a flicker.
   ═══════════════════════════════════════════════════════ */
const useCountUp = (target, duration = 900) => {
    const [value, setValue] = useState(target ?? 0)
    const fromRef = useRef(target ?? 0)
    const frameRef = useRef(null)

    useEffect(() => {
        const from = fromRef.current
        const to = Number(target) || 0
        if (from === to) return

        const start = performance.now()
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(Math.round(from + (to - from) * eased))
            if (p < 1) frameRef.current = requestAnimationFrame(tick)
            else fromRef.current = to
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            fromRef.current = to
        }
    }, [target, duration])

    return value
}

const AnimatedValue = ({ value, prefix = '', suffix = '' }) => {
    const n = useCountUp(value)
    return <>{prefix}{n.toLocaleString('en-IN')}{suffix}</>
}

/* ═══════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════ */
const LiveStat = (props) => {
    const { title, value, icon, color, bg, sub } = props
    const Icon = icon
    return (
        <div className="live-stat" style={{ '--stat-color': color, '--stat-bg': bg }}>
            <div className="live-stat-glow" aria-hidden />
            <div className="live-stat-top">
                <span className="live-stat-label">{title}</span>
                <span className="live-stat-icon"><Icon style={{ width: 15, height: 15 }} /></span>
            </div>
            <p className="live-stat-value"><AnimatedValue value={value} /></p>
            {sub && <p className="live-stat-sub">{sub}</p>}
        </div>
    )
}

const Delta = ({ current, previous, label }) => {
    if (previous === undefined || previous === null || previous === 0) {
        return <span className="live-delta neutral">{label}</span>
    }
    const pct = Math.round(((current - previous) / previous) * 100)
    if (pct === 0) return <span className="live-delta neutral">No change {label}</span>
    const up = pct > 0
    return (
        <span className={`live-delta ${up ? 'up' : 'down'}`}>
            {up ? '▲' : '▼'} {Math.abs(pct)}% {label}
        </span>
    )
}

/* ═══════════════════════════════════════════════════════
   LIVE BADGE + CONTROLS
   ═══════════════════════════════════════════════════════ */
const LiveBadge = ({ live, onToggle, onRefresh, lastUpdated, refreshing }) => (
    <div className="live-toolbar">
        <button
            type="button"
            onClick={onToggle}
            className={`live-pill ${live ? 'on' : 'off'}`}
            title={live ? 'Pause live updates' : 'Resume live updates'}
        >
            {live ? <Radio style={{ width: 13, height: 13 }} /> : <Pause style={{ width: 13, height: 13 }} />}
            {live ? 'Live' : 'Paused'}
        </button>

        <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="live-icon-btn"
            title="Refresh now"
            aria-label="Refresh now"
        >
            <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>

        <span className="live-updated">
            {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading…'}
        </span>
    </div>
)

/* ═══════════════════════════════════════════════════════
   TAB
   ═══════════════════════════════════════════════════════ */
const RANGES = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
]

const OverviewTab = ({ navigate, setError, setActiveTab }) => {
    const [liveOn, setLiveOn] = useState(true)
    const [range, setRange] = useState('7d')
    const [series, setSeries] = useState([])

    /* ── Heavy aggregates: 30s poll, server-cached 15s ── */
    const statsQuery = useLiveQuery({
        fetcher: async () => {
            const res = await axios.get(API_ENDPOINTS.admin.dashboard, axiosConfig)
            return res.data.stats
        },
        intervalMs: 30000,
        enabled: liveOn,
    })

    /* ── Cheap counters: 8s poll, server-cached 3s ── */
    const liveQuery = useLiveQuery({
        fetcher: async () => {
            const res = await axios.get(API_ENDPOINTS.admin.dashboardLive, axiosConfig)
            return res.data.live
        },
        intervalMs: 8000,
        enabled: liveOn,
    })

    const fetchSeries = useCallback(async (r) => {
        const res = await axios.get(API_ENDPOINTS.admin.dashboardSeries(r), axiosConfig)
        setSeries(res.data.series || [])
    }, [])

    useEffect(() => {
        fetchSeries(range).catch(() => setSeries([]))
    }, [range, fetchSeries])

    const stats = statsQuery.data
    const live = liveQuery.data

    /* Live counters win when they arrive — they are fresher than the 30s stats. */
    const users = live?.counts?.users ?? stats?.totalUsers ?? 0
    const partners = live?.counts?.partners ?? stats?.totalPartners ?? 0
    const orders = live?.counts?.orders ?? stats?.totalOrders ?? 0
    const items = live?.counts?.foodItems ?? stats?.totalFoodItems ?? 0

    const statusRows = useMemo(() => {
        const byStatus = stats?.byStatus || {}
        return Object.entries(byStatus)
            .map(([status, v]) => ({ status, count: v.count, revenue: v.revenue || 0 }))
            .sort((a, b) => b.count - a.count)
    }, [stats])

    const activeOrders = statusRows
        .filter(r => ['pending', 'confirmed', 'preparing', 'ready'].includes(r.status))
        .reduce((s, r) => s + r.count, 0)

    const hasError = statsQuery.error || liveQuery.error

    /* An expired admin session must not leave a frozen dashboard on screen. */
    useEffect(() => {
        const err = statsQuery.error || liveQuery.error
        if (err?.response?.status === 401) {
            navigate('/admin-login')
        } else if (err && !err.response) {
            setError('Live dashboard connection lost')
        }
    }, [statsQuery.error, liveQuery.error, navigate, setError])

    if (statsQuery.loading && !stats) return <Spinner />

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <LiveBadge
                live={liveOn}
                onToggle={() => setLiveOn(v => !v)}
                onRefresh={() => { statsQuery.refresh(); liveQuery.refresh(); fetchSeries(range) }}
                lastUpdated={liveQuery.lastUpdated || statsQuery.lastUpdated}
                refreshing={statsQuery.loading || liveQuery.loading}
            />

            {hasError && (
                <div className="live-warn">
                    <AlertTriangle style={{ width: 15, height: 15 }} />
                    Live updates interrupted — showing the last known values. Retrying automatically.
                </div>
            )}

            {/* ── Stat grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                <LiveStat title="Total Users" value={users} icon={Users} color="#60A5FA" bg="rgba(96,165,250,0.12)"
                    sub={<Delta current={users} previous={stats?.usersPrev24h} label="vs 24h ago" />} />
                <LiveStat title="Food Partners" value={partners} icon={Store} color="#34D399" bg="rgba(52,211,153,0.12)"
                    sub={<span style={{ color: 'var(--text3)' }}>Verified & active</span>} />
                <LiveStat title="Total Orders" value={orders} icon={ShoppingBag} color="#A78BFA" bg="rgba(167,139,250,0.12)"
                    sub={<Delta current={stats?.orders24h || 0} previous={0} label="in last 24h" />} />
                <LiveStat title="Food Items" value={items} icon={Package} color="#FCD34D" bg="rgba(252,211,77,0.12)"
                    sub={<span style={{ color: 'var(--text3)' }}>{stats?.totalAds || 0} advertisements</span>} />
            </div>

            {/* ── Revenue + activity ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 14, alignItems: 'stretch' }} className="live-split">
                <div className="revenue-banner">
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <IndianRupee style={{ width: 16, height: 16, color: '#A5B4FC' }} />
                            <p style={{ color: '#A5B4FC', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lifetime Revenue</p>
                        </div>
                        <p style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.03em', color: 'white', lineHeight: 1.1 }}>
                            {fmtCur(stats?.totalRevenue || 0)}
                        </p>
                        <p style={{ color: 'rgba(165,180,252,0.72)', fontSize: 12, margin: '8px 0 0' }}>
                            {fmtCur(stats?.paidRevenue || 0)} captured · {fmtCur(stats?.revenue24h || 0)} in the last 24h
                        </p>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Active orders', val: activeOrders },
                            { label: 'Orders / 24h', val: stats?.orders24h || 0 },
                            { label: 'Orders / 7d', val: stats?.orders7d || 0 },
                        ].map(m => (
                            <div key={m.label} style={{ flex: '1 1 90px', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '11px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'white', margin: 0, lineHeight: 1.2 }}>
                                    {m.val.toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: 10, color: 'rgba(165,180,252,0.75)', margin: '2px 0 0', fontWeight: 600 }}>{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live feed */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <p className="chart-title" style={{ margin: 0, padding: '16px 18px 10px' }}>
                        <Activity style={{ width: 15, height: 15, color: '#6EE7F7' }} /> Live activity
                    </p>
                    <div style={{ padding: '0 18px 16px', flex: 1 }}>
                        {live?.latestOrder ? (
                            <div className="live-feed-item">
                                <span className="live-feed-dot" style={{
                                    background: (STATUS_COLORS[live.latestOrder.status] || {}).dot || '#94A3B8'
                                }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                        #{String(live.latestOrder.id).slice(-8).toUpperCase()}
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 0' }}>
                                        {new Date(live.latestOrder.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-display)' }}>
                                        {fmtCur(live.latestOrder.totalAmount)}
                                    </p>
                                    <p style={{ fontSize: 10, textTransform: 'capitalize', color: (STATUS_COLORS[live.latestOrder.status] || {}).text || 'var(--text3)', margin: 0, fontWeight: 700 }}>
                                        {live.latestOrder.status}
                                    </p>
                                </div>
                            </div>
                        ) : <Empty text="No orders yet" />}
                    </div>
                </div>
            </div>

            {/* ── Trend chart ── */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 6px', gap: 12, flexWrap: 'wrap' }}>
                    <p className="chart-title" style={{ margin: 0 }}>
                        <TrendingUp style={{ width: 15, height: 15, color: '#34D399' }} /> Order trend
                    </p>
                    <div className="range-switch">
                        {RANGES.map(r => (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRange(r.key)}
                                className={range === r.key ? 'active' : ''}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ padding: '6px 10px 14px', height: 240 }}>
                    {series.length === 0 ? <Empty text="No trend data" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.45} />
                                        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={18} />
                                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#A78BFA" strokeWidth={2} fill="url(#gradRevenue)" />
                                <Line type="monotone" dataKey="orders" name="Orders" stroke="#34D399" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Pipeline breakdown ── */}
            <div className="card">
                <p className="chart-title" style={{ margin: 0, padding: '16px 18px 12px' }}>
                    <ShoppingBag style={{ width: 15, height: 15, color: '#A78BFA' }} /> Order pipeline
                </p>
                {statusRows.length === 0 ? <Empty text="No orders yet" /> : (
                    <div className="pipeline">
                        {statusRows.map(r => {
                            const sc = STATUS_COLORS[r.status] || { bg: 'rgba(255,255,255,0.05)', text: '#94A3B8', dot: '#94A3B8' }
                            const pct = orders ? Math.round((r.count / orders) * 100) : 0
                            return (
                                <div key={r.status} className="pipeline-row">
                                    <span className="pipeline-label">
                                        <span className="pipeline-dot" style={{ background: sc.dot }} />
                                        <span style={{ textTransform: 'capitalize' }}>{r.status}</span>
                                    </span>
                                    <span className="pipeline-track">
                                        <span
                                            className="pipeline-fill"
                                            style={{ width: `${Math.max(pct, 1.5)}%`, background: sc.dot }}
                                        />
                                    </span>
                                    <span className="pipeline-count">{r.count.toLocaleString('en-IN')}</span>
                                    <span className="pipeline-rev">{fmtCur(r.revenue)}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Quick actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Manage Users', icon: Users,      tab: 'users',     g: 'linear-gradient(135deg, #1e40af, #3b82f6)',   shadow: 'rgba(59,130,246,0.3)' },
                    { label: 'Partners',     icon: Store,      tab: 'partners',  g: 'linear-gradient(135deg, #065f46, #10b981)',   shadow: 'rgba(16,185,129,0.3)' },
                    { label: 'Content',      icon: Package,     tab: 'content',   g: 'linear-gradient(135deg, #78350f, #f59e0b)',   shadow: 'rgba(245,158,11,0.3)' },
                    { label: 'Analytics',    icon: TrendingUp, tab: 'analytics', g: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',   shadow: 'rgba(139,92,246,0.3)' },
                ].map(c => (
                    <button key={c.tab} onClick={() => setActiveTab(c.tab)}
                        className="quick-action"
                        style={{ background: c.g, color: 'white', border: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 16px 40px ${c.shadow}`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <c.icon style={{ width: 22, height: 22, marginBottom: 10, display: 'block', opacity: 0.9 }} />
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>{c.label}</p>
                        <p style={{ fontSize: 11, opacity: 0.6, margin: 0 }}>Manage →</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default OverviewTab
