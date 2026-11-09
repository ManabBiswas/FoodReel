import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, Store, CheckCircle, Ban, Activity, TrendingUp, ShoppingBag, BarChart3, RefreshCw
} from 'lucide-react'
import { Spinner, Empty, StatCard, ChartTooltip } from '../AdminUI'
import { PALETTE } from '../adminConstants'

const serverMessage = (err) =>
  err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Network request failed'

const AnalyticsTab = ({ navigate, setError }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Each endpoint loads independently: one 500 must not blank the whole tab.
  // Previously a single Promise.all rejection meant every chart disappeared
  // behind a generic "Failed to load analytics", even when the server had
  // successfully returned the user/partner counts.
  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    setLoadError('')

    const [rev, users, partners] = await Promise.allSettled([
      axios.get(API_ENDPOINTS.admin.revenueAnalytics, axiosConfig),
      axios.get(API_ENDPOINTS.admin.userAnalytics, axiosConfig),
      axios.get(API_ENDPOINTS.admin.partnerAnalytics, axiosConfig),
    ])

    if ([rev, users, partners].some(
      (r) => r.status === 'rejected' && r.reason?.response?.status === 401,
    )) {
      navigate('/admin-login')
      setLoading(false)
      return
    }

    const failures = []
    if (rev.status === 'rejected') failures.push(`Revenue: ${serverMessage(rev.reason)}`)
    if (users.status === 'rejected') failures.push(`Users: ${serverMessage(users.reason)}`)
    if (partners.status === 'rejected') failures.push(`Partners: ${serverMessage(partners.reason)}`)

    if (failures.length === 3) {
      setAnalytics(null)
      const message = `Failed to load analytics — ${failures.join(' · ')}`
      setLoadError(message)
      setError(message)
    } else {
      setAnalytics({
        revenue: rev.status === 'fulfilled'
          ? (rev.value.data.revenueByMonth || []).map((row) => ({
              ...row,
              _id: row?._id != null ? String(row._id) : '',
              revenue: Number(row?.revenue) || 0,
              orders: Number(row?.orders) || 0,
            }))
          : [],
        users: users.status === 'fulfilled' ? users.value.data.analytics || {} : {},
        partners: partners.status === 'fulfilled' ? partners.value.data.analytics || {} : {},
      })
      if (failures.length > 0) {
        // Partial data is still useful: keep the charts on screen and show
        // the warning inline with a working retry, instead of the shared
        // error box whose retry only clears the message.
        setLoadError(`Some analytics failed to load — ${failures.join(' · ')}`)
      }
    }
    setLoading(false)
  }, [navigate, setError])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics, reloadKey])

  if (loading && !analytics) return <Spinner />
  if (!analytics) {
    return (
      <div className="chart-container" style={{ textAlign: 'center', padding: '48px 20px' }}>
        <Empty text="No analytics data" />
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="btn-primary"
          style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {loadError && (
        <div
          role="alert"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '12px 16px', borderRadius: 12, background: 'rgba(255,184,0,0.12)',
            border: '1px solid rgba(255,184,0,0.4)', color: '#8a5a00', fontSize: 13,
          }}
        >
          <span style={{ flex: 1, minWidth: 200 }}>{loadError}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Retry
          </button>
        </div>
      )}
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="Total Users"       value={analytics.users.totalUsers ?? 0}          icon={Users}       color="#ff6a00" bg="rgba(255,106,0,0.1)" />
        <StatCard title="Active Users"      value={analytics.users.activeUsers ?? 0}         icon={Activity}    color="#16a34a" bg="rgba(22,163,74,0.1)" />
        <StatCard title="Verified Partners" value={analytics.partners.verifiedPartners ?? 0} icon={CheckCircle} color="#ffb800" bg="rgba(255,184,0,0.12)" />
        <StatCard title="Blocked Users"     value={analytics.users.blockedUsers ?? 0}        icon={Ban}         color="#dc2626" bg="rgba(220,38,38,0.08)" />
      </div>

      {/* Revenue + Orders combo chart */}
      <div className="chart-container">
        <p className="chart-title"><TrendingUp style={{ width: 15, height: 15, color: '#ff6a00' }} /> Revenue & Orders — Monthly</p>
        {analytics.revenue.length === 0 ? <Empty text="No revenue data yet" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6a00" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ff6a00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,8,0.07)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" orientation="left" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => { const n = Number(v) || 0; return n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}` }} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#ff6a00" strokeWidth={2.5}
                fill="url(#revGrad)" dot={{ r: 4, fill: '#ff6a00', strokeWidth: 2, stroke: '#ffffff' }} />
              <Bar yAxisId="ord" dataKey="orders" name="Orders" radius={[5, 5, 0, 0]} maxBarSize={28}>
                {analytics.revenue.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.75} />)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue growth line chart */}
      {analytics.revenue.length > 1 && (
        <div className="chart-container">
          <p className="chart-title"><Activity style={{ width: 15, height: 15, color: '#16a34a' }} /> Revenue Growth Trend</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,8,0.07)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${((Number(v) || 0) / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip prefix="₹" />} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5}
                dot={{ r: 5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Donut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="chart-container">
          <p className="chart-title"><Users style={{ width: 15, height: 15, color: '#ff6a00' }} /> User Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Active', value: analytics.users.activeUsers || 0 },
                { name: 'New This Month', value: analytics.users.newUsersThisMonth || 0 },
                { name: 'Blocked', value: analytics.users.blockedUsers || 0 },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={58} outerRadius={85}
                paddingAngle={4} dataKey="value" stroke="none">
                {['#16a34a', '#ff6a00', '#dc2626'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title"><Store style={{ width: 15, height: 15, color: '#16a34a' }} /> Partner Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Verified', value: analytics.partners.verifiedPartners || 0 },
                { name: 'Unverified', value: analytics.partners.unverifiedPartners || 0 },
                { name: 'Blocked', value: analytics.partners.blockedPartners || 0 },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={58} outerRadius={85}
                paddingAngle={4} dataKey="value" stroke="none">
                {['#ffb800', '#ff6a00', '#dc2626'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title"><BarChart3 style={{ width: 15, height: 15, color: '#1a1208' }} /> Partner Stats</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
              data={[
                { name: 'Verified', value: analytics.partners.verifiedPartners || 0, fill: '#ffb800' },
                { name: 'Unverified', value: analytics.partners.unverifiedPartners || 0, fill: '#ff6a00' },
                { name: 'Blocked', value: analytics.partners.blockedPartners || 0, fill: '#dc2626' },
              ]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'rgba(26,18,8,0.06)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
