import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, BookOpen, ClipboardList, ChevronRight, Loader2, Building2, Layers } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { ROLES } from '../../constants'
import bgImage from '../../../assets/role.jpg'

const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label:       'Quản trị viên',
    description: 'Quản lý toàn bộ hệ thống, người dùng và dữ liệu',
    icon:        ShieldCheck,
    border:      'border-red-200 hover:border-red-400',
    iconBg:      'bg-red-100',
    iconColor:   'text-red-600',
    text:        'text-red-700',
    path:        '/dashboard/admin',
  },
  [ROLES.LECTURER]: {
    label:       'Giảng viên',
    description: 'Quản lý bài giảng, môn học và tương tác sinh viên',
    icon:        BookOpen,
    border:      'border-blue-200 hover:border-blue-400',
    iconBg:      'bg-blue-100',
    iconColor:   'text-blue-600',
    text:        'text-blue-700',
    path:        '/dashboard/lecturer',
  },
  [ROLES.COUNCIL]: {
    label:       'Hội đồng chấm',
    description: 'Tham gia chấm điểm và đánh giá bài giảng',
    icon:        ClipboardList,
    border:      'border-purple-200 hover:border-purple-400',
    iconBg:      'bg-purple-100',
    iconColor:   'text-purple-600',
    text:        'text-purple-700',
    path:        '/dashboard/council',
  },
  [ROLES.DEPARTMENT_HEAD]: {
    label:       'Trưởng Khoa/Viện',
    description: 'Quản lý giảng viên và môn học trong khoa',
    icon:        Building2,
    border:      'border-orange-200 hover:border-orange-400',
    iconBg:      'bg-orange-100',
    iconColor:   'text-orange-600',
    text:        'text-orange-700',
    path:        '/dashboard/department-head',
  },
  [ROLES.MAJOR_HEAD]: {
    label:       'Chủ nhiệm Ngành',
    description: 'Quản lý sinh viên và môn học trong ngành',
    icon:        Layers,
    border:      'border-teal-200 hover:border-teal-400',
    iconBg:      'bg-teal-100',
    iconColor:   'text-teal-600',
    text:        'text-teal-700',
    path:        '/dashboard/major-head',
  },
}

export default function UserRole() {
  const { user, logout, refreshUser, selectRole } = useAuth()
  const navigate  = useNavigate()
  const [fetching, setFetching] = useState(false)

  // Xoá activeRole mỗi khi vào trang chọn role → bắt buộc chọn lại
  useEffect(() => {
    selectRole(null)
    const fetchMe = async () => {
      setFetching(true)
      await refreshUser()
      setFetching(false)
    }
    fetchMe()
  }, [])

  const roles   = (user?.roles || []).filter((r) => r !== ROLES.STUDENT)
  const profile = user?.profile || {}
  const name    = profile.full_name     || user?.username || 'Người dùng'
  const code    = profile.lecturer_code || profile.student_code || '—'
  const dept    = profile.department    || ''
  const email   = profile.email         || ''
  const phone   = profile.phone         || ''
  const avatar  = name.charAt(0).toUpperCase()

  const handleSelectRole = (role) => {
    selectRole(role)                                          // lưu role đang active
    navigate(ROLE_CONFIG[role]?.path || '/me', { replace: true })
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-slate-900/60" />

      <div className="relative z-10 w-full max-w-lg">

        {/* Thông tin user */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-3xl font-black mx-auto mb-4">
            {fetching
              ? <Loader2 size={28} className="animate-spin text-white/70" />
              : avatar}
          </div>

          {fetching ? (
            <p className="text-white/60 text-sm animate-pulse">Đang tải thông tin...</p>
          ) : (
            <>

              <h1 className="text-white text-2xl font-black">Xin chào, {name}</h1>
            </>
          )}

          <p className="text-white/60 text-sm mt-4 font-medium">Vui lòng chọn vai trò để tiếp tục</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3 mb-6">
          {!fetching && roles.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center text-white/70">
              Tài khoản chưa được gán vai trò
            </div>
          ) : (
            roles.map((role) => {
              const cfg = ROLE_CONFIG[role]
              if (!cfg) return null
              const Icon = cfg.icon
              return (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  disabled={fetching}
                  className={`w-full group flex items-center gap-4 p-5 bg-white border-2 ${cfg.border} shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60`}
                >
                  <div className={`w-14 h-14 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className={cfg.iconColor} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-black text-base ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{cfg.description}</p>
                  </div>
                  <ChevronRight size={20} className={`${cfg.iconColor} opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                </button>
              )
            })
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-b-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 Phòng Đào Tạo — E-Learning PDT
        </p>
      </div>
    </div>
  )
}
