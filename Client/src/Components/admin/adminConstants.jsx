import {
  LayoutDashboard, Users, Store, FileText,
  ShoppingBag, Star, BarChart3
} from 'lucide-react'

export const fmtCur = n =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0)}`

export const STATUS_COLORS = {
  pending:   { bg: 'rgba(251,191,36,0.15)',  text: '#F59E0B', dot: '#F59E0B' },
  confirmed: { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', dot: '#3B82F6' },
  preparing: { bg: 'rgba(139,92,246,0.15)',  text: '#8B5CF6', dot: '#8B5CF6' },
  ready:     { bg: 'rgba(20,184,166,0.15)',  text: '#14B8A6', dot: '#14B8A6' },
  delivered: { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', dot: '#22C55E' },
  completed: { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', dot: '#22C55E' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', dot: '#EF4444' },
}

export const PALETTE = [
  '#6EE7F7', '#818CF8', '#A78BFA', '#F472B6',
  '#34D399', '#FCD34D', '#FB923C', '#60A5FA'
]

export const PIE_COLORS = ['#34D399', '#818CF8', '#F472B6', '#FBBF24']

export const TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'partners',  label: 'Partners',  icon: Store },
  { id: 'content',   label: 'Content',   icon: FileText },
  { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
  { id: 'reviews',   label: 'Reviews',   icon: Star },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]
