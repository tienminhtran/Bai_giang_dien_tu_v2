import { useMemo, useState, useRef, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, LogOut, Home, ChevronDown } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export default function DashboardLayout({ title, subtitle, menuGroups = [], children }) {
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Collapsible groups — mặc định mở tất cả
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(menuGroups.map((_, i) => [i, true]))
  )
  const toggleGroup = (i) => setOpenGroups((prev) => ({ ...prev, [i]: !prev[i] }))

  const { user, logout, selectRole, activeRole } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const displayName = useMemo(() => {
    const p = user?.profile || {}
    return p.full_name || user?.username || 'Người dùng'
  }, [user])

  const roleLabel = useMemo(() => {
    const map = { admin: 'Quản trị viên', giang_vien: 'Giảng viên', hoi_dong: 'Hội đồng chấm' }
    return map[activeRole] || activeRole || ''
  }, [activeRole])

  const avatar = displayName.charAt(0).toUpperCase()

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout  = () => { logout(); navigate('/login', { replace: true }) }
  const handleSwitchRole = () => { selectRole(null); setDropdownOpen(false); navigate('/me') }
  const handleNav = (path) => { navigate(path); setMobileOpen(false) }

  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#08387F] text-white shadow-2xl transition-all duration-300
      md:static md:translate-x-0 md:sticky md:top-0 md:h-screen md:overflow-hidden
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      ${collapsed ? 'md:w-[72px]' : 'md:w-64'} w-64`}
    >
      {/* Sidebar header */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-3">
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-wide text-white/80">
            BÀI GIẢNG ĐIỆN TỬ
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setCollapsed(v => !v)}
            className="hidden md:flex h-8 w-8 items-center justify-center border border-white/15 bg-white/10 hover:bg-white/20 transition">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={() => setMobileOpen(false)}
            className="md:hidden flex h-8 w-8 items-center justify-center border border-white/15 bg-white/10">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {menuGroups.map((group, gi) => (
          <div key={gi}>
            {group.title && !collapsed && (
              <button
                onClick={() => toggleGroup(gi)}
                className="w-full flex items-center justify-between mt-3 mb-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
              >
                <span>{group.title}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${openGroups[gi] ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            )}
            {group.title && collapsed && <hr className="my-2 border-white/10" />}

            {(openGroups[gi] || !group.title || collapsed) && group.items.map((item) => {
              const Icon   = item.icon
              const EXACT_PATHS = ['/', '/dashboard/admin', '/dashboard/lecturer', '/dashboard/council', '/dashboard/department-head', '/dashboard/major-head']
              const active = location.pathname === item.path ||
                             (!EXACT_PATHS.includes(item.path) &&
                              location.pathname.startsWith(item.path))
              return (
                <button key={item.path} onClick={() => handleNav(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 text-sm transition
                    ${collapsed ? 'justify-center' : ''}
                    ${active
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      {mobileOpen && (
        <button aria-label="close" onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center border border-slate-200 text-[#08387F]">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition-colors"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#08387F] text-sm font-black text-white">
                {avatar}
              </div>
              {/* Name + role */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-b-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{displayName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{roleLabel}</p>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={handleSwitchRole}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Home size={15} className="text-slate-400" />
                    Đổi vai trò
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
