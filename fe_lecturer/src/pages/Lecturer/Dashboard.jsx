import { BookOpen, GraduationCap, Video } from 'lucide-react'

const CARDS = [
  { icon: BookOpen,      label: 'Môn đang dạy', value: '—', sub: 'Học kỳ hiện tại', color: 'text-blue-600 bg-blue-50' },
  { icon: Video,         label: 'Bài giảng',    value: '—', sub: 'Đã đăng tải',     color: 'text-indigo-600 bg-indigo-50' },
  { icon: GraduationCap, label: 'Sinh viên',    value: '—', sub: 'Đang theo học',   color: 'text-green-600 bg-green-50' },
]

export default function LecturerDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900">Dashboard Giảng viên</h2>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý bài giảng, môn học và sinh viên</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white border border-slate-200 p-5 shadow-sm flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Việc cần làm</h3>
          <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Lịch dạy gần nhất</h3>
          <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  )
}
