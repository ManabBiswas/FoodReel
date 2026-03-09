import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import {
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, Store, ShoppingBag, FileText, IndianRupee,
  Package, Activity, TrendingUp, ArrowUpRight, BarChart3
} from 'lucide-react'
import { Spinner, Empty, StatCard, ChartTooltip } from '../AdminUI'
import { fmtCur, STATUS_COLORS, PALETTE, PIE_COLORS } from '../adminConstants'

const OverviewTab = ({ navigate, setError, setActiveTab }) => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [statsRes, ordersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.admin.dashboard, axiosConfig),
        axios.get(`${API_ENDPOINTS.admin.orders}?limit=5&page=1`, axiosConfig)
      ])
      setDashboardStats(statsRes.data.stats)
      setRecentOrders(ordersRes.data.orders || [])
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load dashboard')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  const orderStatusData = useMemo(() => {
    if (!recentOrders.length) return []
    const counts = {}
    recentOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [recentOrders])

  const overviewPieData = useMemo(() => {
    if (!dashboardStats) return []
    return [
      { name: 'Users', value: dashboardStats.totalUsers || 0 },
      { name: 'Partners', value: dashboardStats.totalPartners || 0 },
      { name: 'Food Items', value: dashboardStats.totalFoodItems || 0 },
      { name: 'Ads', value: dashboardStats.totalAds || 0 },
    ].filter(d => d.value > 0)
  }, [dashboardStats])

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="Total Users"    value={dashboardStats?.totalUsers ?? 0}    icon={Users}       color="#60A5FA" bg="rgba(96,165,250,0.1)"   change={12} />
        <StatCard title="Food Partners"  value={dashboardStats?.totalPartners ?? 0}  icon={Store}       color="#34D399" bg="rgba(52,211,153,0.1)"   change={8} />
        <StatCard title="Total Orders"   value={dashboardStats?.totalOrders ?? 0}    icon={ShoppingBag} color="#A78BFA" bg="rgba(167,139,250,0.1)" change={-3} />
        <StatCard title="Food Items"     value={dashboardStats?.totalFoodItems ?? 0} icon={Package}     color="#FCD34D" bg="rgba(252,211,77,0.1)"   change={5} />
      </div>

      {/* Revenue banner */}
      {dashboardStats && (
        <div className="revenue-banner">
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IndianRupee style={{ width: 16, height: 16, color: '#A5B4FC' }} />
                <p style={{ color: '#A5B4FC', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Revenue</p>
              </div>
              <p style={{ fontSize: 42, fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.03em', color: 'white' }}>{fmtCur(dashboardStats.totalRevenue || 0)}</p>
              <p style={{ color: 'rgba(165,180,252,0.7)', fontSize: 12, margin: '6px 0 0' }}>Lifetime platform earnings</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ label: 'Active Ads', val: dashboardStats.totalAds || 0 }, { label: 'Orders', val: dashboardStats.totalOrders || 0 }].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '14px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'white', margin: 0 }}>{item.val}</p>
                  <p style={{ fontSize: 11, color: 'rgba(165,180,252,0.7)', margin: '3px 0 0', fontWeight: 600 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {orderStatusData.length > 0 && (
          <div className="chart-container">
            <p className="chart-title"><Activity style={{ width: 15, height: 15, color: '#6EE7F7' }} /> Order Status Distribution</p>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none">
                  {orderStatusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {overviewPieData.length > 0 && (
          <div className="chart-container">
            <p className="chart-title"><TrendingUp style={{ width: 15, height: 15, color: '#34D399' }} /> Platform Overview</p>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={overviewPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none">
                  {overviewPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dashboardStats && (
          <div className="chart-container">
            <p className="chart-title"><BarChart3 style={{ width: 15, height: 15, color: '#A78BFA' }} /> Platform Metrics</p>
            <ResponsiveContainer width="100%" height={210}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%"
                data={[
                  { name: 'Users', value: dashboardStats.totalUsers || 0, fill: '#60A5FA' },
                  { name: 'Partners', value: dashboardStats.totalPartners || 0, fill: '#34D399' },
                  { name: 'Orders', value: dashboardStats.totalOrders || 0, fill: '#A78BFA' },
                  { name: 'Items', value: dashboardStats.totalFoodItems || 0, fill: '#FCD34D' },
                ]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
          <p className="chart-title" style={{ margin: 0 }}><Package style={{ width: 15, height: 15, color: '#A78BFA' }} /> Recent Orders</p>
          <button onClick={() => setActiveTab('orders')} style={{ fontSize: 12, fontWeight: 600, color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#A5B4FC'}
            onMouseLeave={e => e.currentTarget.style.color = '#818CF8'}>
            View All <ArrowUpRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
        {recentOrders.length === 0 ? <Empty text="No orders yet" /> : (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {recentOrders.map((order, idx) => {
              const sc = STATUS_COLORS[order.status] || { bg: 'rgba(255,255,255,0.05)', text: '#94A3B8', dot: '#94A3B8' }
              return (
                <div key={order._id} className="row-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: idx < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package style={{ width: 16, height: 16, color: '#818CF8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>#{order._id?.slice(-8).toUpperCase()}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 0' }}>
                      {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                    {order.status}
                  </span>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text)', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>{fmtCur(order.pricing?.totalAmount)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Manage Users', icon: Users,      tab: 'users',     g: 'linear-gradient(135deg, #1e40af, #3b82f6)',   shadow: 'rgba(59,130,246,0.3)' },
          { label: 'Partners',     icon: Store,      tab: 'partners',  g: 'linear-gradient(135deg, #065f46, #10b981)',   shadow: 'rgba(16,185,129,0.3)' },
          { label: 'Content',      icon: FileText,   tab: 'content',   g: 'linear-gradient(135deg, #78350f, #f59e0b)',   shadow: 'rgba(245,158,11,0.3)' },
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
