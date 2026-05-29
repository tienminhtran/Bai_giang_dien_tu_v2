import { BookOpen, GraduationCap, Users } from 'lucide-react'

const CARDS = [
  { icon: Users,         label: 'Giảng viên', value: '—', sub: 'Trong khoa',     color: 'text-blue-600 bg-blue-50' },
  { icon: BookOpen,      label: 'Môn học',    value: '—', sub: 'Đang hoạt động', color: 'text-indigo-600 bg-indigo-50' },
  { icon: GraduationCap, label: 'Sinh viên',  value: '—', sub: 'Đang theo học',  color: 'text-green-600 bg-green-50' },
]

export default function DepartmentHeadDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900">Tổng quan Trưởng Khoa/Viện</h2>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý giảng viên và môn học trong khoa</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="flex items-start gap-4 border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-0.5 text-2xl font-black text-slate-800">{value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Việc cần làm</h3>
          <p className="text-sm italic text-slate-400">Chưa có dữ liệu</p>
        </div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Thông báo</h3>
          <p className="text-sm italic text-slate-400">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  )
}
