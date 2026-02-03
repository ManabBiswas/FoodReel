import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  FileText, 
  Settings, 
  LogOut,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Menu,
  X
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    // TODO: Add actual logout logic
    console.log('Admin logged out')
    navigate('/admin-login')
  }

  // Mock stats data
  const stats = [
    { 
      title: 'Total Users', 
      value: '1,234', 
      change: '+12%', 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Food Partners', 
      value: '87', 
      change: '+5%', 
      icon: Store, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Total Posts', 
      value: '2,456', 
      change: '+18%', 
      icon: FileText, 
      color: 'bg-purple-500' 
    },
    { 
      title: 'Active Orders', 
      value: '45', 
      change: '-3%', 
      icon: ShoppingBag, 
      color: 'bg-orange-500' 
    }
  ]

  // Mock recent activity
  const recentActivity = [
    { id: 1, type: 'success', message: 'New user registered: john@example.com', time: '5 min ago' },
    { id: 2, type: 'warning', message: 'Partner verification pending: Pizza Palace', time: '15 min ago' },
    { id: 3, type: 'success', message: 'New post published by @foodlover', time: '1 hour ago' },
    { id: 4, type: 'warning', message: 'Reported content needs review', time: '2 hours ago' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans antialiased">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 shadow-lg hover:shadow-xl transition"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 text-white p-6 z-40 transform transition-transform duration-300 shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-sm ">FoodReel Admin</h1>
          <p className="text-indigo-200 text-xs mt-1 font-medium uppercase tracking-wider">Dashboard</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium tracking-wide">Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium tracking-wide">Users</span>
          </button>

          <button
            onClick={() => { setActiveTab('partners'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'partners' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="font-medium tracking-wide">Food Partners</span>
          </button>

          <button
            onClick={() => { setActiveTab('posts'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'posts' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium tracking-wide">Posts & Reels</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium tracking-wide">Settings</span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors mt-auto absolute bottom-6 left-6 right-6"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-72 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8 mt-16 lg:mt-0">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard Overview</h2>
          <p className="text-gray-500 mt-2 font-medium text-base">Welcome back, Admin 👋</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg shadow-md`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</h3>
              <p className="text-3xl font-black tracking-tight bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Recent Activity</h3>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold tracking-wide transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow">
                {activity.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-medium leading-relaxed">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Analytics</h4>
            <p className="text-purple-100 text-sm mb-4 font-medium leading-relaxed">View detailed analytics and reports</p>
            <button className="bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              View Reports
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <Users className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Manage Users</h4>
            <p className="text-blue-100 text-sm mb-4 font-medium leading-relaxed">View and manage all registered users</p>
            <button className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              Manage Users
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <Store className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Partner Requests</h4>
            <p className="text-green-100 text-sm mb-4 font-medium leading-relaxed">Review pending partner applications</p>
            <button className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              Review Requests
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
