import { LayoutDashboard, Users, Store, FileText, ShoppingBag, Star, BarChart3, ChefHat, Zap, CalendarDays } from 'lucide-react'

export const fmtCur = n =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0)}`

export const STATUS_COLORS = {
  pending:   { bg: 'rgba(255,184,0,0.15)',  text: '#b45309', dot: '#ffb800' },
  confirmed: { bg: 'rgba(255,106,0,0.12)',  text: '#e55a00', dot: '#ff6a00' },
  preparing: { bg: 'rgba(26,18,8,0.08)',    text: '#1a1208', dot: '#1a1208' },
  ready:     { bg: 'rgba(229,90,0,0.12)',   text: '#e55a00', dot: '#e55a00' },
  delivered: { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a', dot: '#16a34a' },
  completed: { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a', dot: '#16a34a' },
  cancelled: { bg: 'rgba(220,38,38,0.10)',  text: '#dc2626', dot: '#dc2626' },
  cancel_requested: { bg: 'rgba(255,184,0,0.15)', text: '#b45309', dot: '#ffb800' },
}

export const PALETTE = [
  '#ff6a00', '#ffb800', '#1a1208', '#e55a00',
  '#16a34a', '#ff8533', '#b45309', '#dc2626'
]

export const PIE_COLORS = ['#16a34a', '#ff6a00', '#ffb800', '#dc2626']

export const TABS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'partners',  label: 'Partners',  icon: Store },
  { id: 'content',   label: 'Content',   icon: FileText },
  { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
  { id: 'cancels',   label: 'Cancel Requests', icon: ChefHat },
  { id: 'reviews',   label: 'Reviews',   icon: Star },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'events',    label: 'Events',    icon: CalendarDays },
  { id: 'event-proposals', label: 'Event Proposals', icon: Zap },
]