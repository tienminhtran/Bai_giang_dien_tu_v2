import { BookOpen, GraduationCap, Video } from 'lucide-react'

const CARDS = [
  { icon: GraduationCap, label: 'Sinh viên', value: '—', sub: 'Trong ngành',     color: 'text-green-600 bg-green-50' },
  { icon: BookOpen,      label: 'Môn học',   value: '—', sub: 'Đang hoạt động',  color: 'text-indigo-600 bg-indigo-50' },
  { icon: Video,         label: 'Bài giảng', value: '—', sub: 'Đã đăng tải',     color: 'text-violet-600 bg-violet-50' },
]

export default function MajorHeadDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900">Dashboard Chủ nhiệm Ngành</h2>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý sinh viên và môn học trong ngành</p>
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
          <h3 className="mb-3 font-bold text-slate-900">Sinh viên trong ngành</h3>
          <p className="text-sm italic text-slate-400">Chưa có dữ liệu</p>
        </div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Môn học đang mở</h3>
          <p className="text-sm italic text-slate-400">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  )
}
