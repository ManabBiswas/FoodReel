import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../../config/Api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, Store, CheckCircle, Ban, Activity, TrendingUp, ShoppingBag, BarChart3
} from 'lucide-react'
import { Spinner, Empty, StatCard, ChartTooltip } from '../AdminUI'
import { PALETTE } from '../adminConstants'

const AnalyticsTab = ({ navigate, setError }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [revRes, userRes, partnerRes] = await Promise.all([
        axios.get(API_ENDPOINTS.admin.revenueAnalytics, axiosConfig),
        axios.get(API_ENDPOINTS.admin.userAnalytics, axiosConfig),
        axios.get(API_ENDPOINTS.admin.partnerAnalytics, axiosConfig),
      ])
      setAnalytics({
        revenue: revRes.data.revenueByMonth || [],
        users: userRes.data.analytics || {},
        partners: partnerRes.data.analytics || {},
      })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load analytics')
    } finally { setLoading(false) }
  }, [navigate, setError])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  if (loading) return <Spinner />
  if (!analytics) return <Empty text="No analytics data" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="Total Users"       value={analytics.users.totalUsers ?? 0}          icon={Users}       color="#60A5FA" bg="rgba(96,165,250,0.1)" />
        <StatCard title="Active Users"      value={analytics.users.activeUsers ?? 0}         icon={Activity}    color="#34D399" bg="rgba(52,211,153,0.1)" />
        <StatCard title="Verified Partners" value={analytics.partners.verifiedPartners ?? 0} icon={CheckCircle} color="#22D3EE" bg="rgba(34,211,238,0.1)" />
        <StatCard title="Blocked Users"     value={analytics.users.blockedUsers ?? 0}        icon={Ban}         color="#F87171" bg="rgba(248,113,113,0.1)" />
      </div>

      {/* Revenue + Orders combo chart */}
      <div className="chart-container">
        <p className="chart-title"><TrendingUp style={{ width: 15, height: 15, color: '#818CF8' }} /> Revenue & Orders — Monthly</p>
        {analytics.revenue.length === 0 ? <Empty text="No revenue data yet" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" orientation="left" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#6366F1" strokeWidth={2.5}
                fill="url(#revGrad)" dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#111520' }} />
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
          <p className="chart-title"><Activity style={{ width: 15, height: 15, color: '#34D399' }} /> Revenue Growth Trend</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip prefix="₹" />} />
              <Line type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={2.5}
                dot={{ r: 5, fill: '#34D399', stroke: '#111520', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#34D399', stroke: '#111520', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Donut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="chart-container">
          <p className="chart-title"><Users style={{ width: 15, height: 15, color: '#60A5FA' }} /> User Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Active', value: analytics.users.activeUsers || 0 },
                { name: 'New This Month', value: analytics.users.newUsersThisMonth || 0 },
                { name: 'Blocked', value: analytics.users.blockedUsers || 0 },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={58} outerRadius={85}
                paddingAngle={4} dataKey="value" stroke="none">
                {['#34D399', '#60A5FA', '#F87171'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title"><Store style={{ width: 15, height: 15, color: '#34D399' }} /> Partner Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Verified', value: analytics.partners.verifiedPartners || 0 },
                { name: 'Unverified', value: analytics.partners.unverifiedPartners || 0 },
                { name: 'Blocked', value: analytics.partners.blockedPartners || 0 },
              ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={58} outerRadius={85}
                paddingAngle={4} dataKey="value" stroke="none">
                {['#22D3EE', '#FCD34D', '#F87171'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7}
                formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title"><BarChart3 style={{ width: 15, height: 15, color: '#A78BFA' }} /> Partner Stats</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
              data={[
                { name: 'Verified', value: analytics.partners.verifiedPartners || 0, fill: '#22D3EE' },
                { name: 'Unverified', value: analytics.partners.unverifiedPartners || 0, fill: '#FCD34D' },
                { name: 'Blocked', value: analytics.partners.blockedPartners || 0, fill: '#F87171' },
              ]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'rgba(255,255,255,0.03)' }} />
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
