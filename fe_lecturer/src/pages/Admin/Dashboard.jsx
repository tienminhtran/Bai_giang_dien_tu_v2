import { Users, BookOpen, FileText, ClipboardList } from 'lucide-react'

const CARDS = [
  { icon: Users,         label: 'Tổng người dùng', value: '—', sub: 'Toàn hệ thống',   color: 'text-blue-600 bg-blue-50' },
  { icon: BookOpen,      label: 'Môn học',          value: '—', sub: 'Đang hoạt động',  color: 'text-indigo-600 bg-indigo-50' },
  { icon: FileText,      label: 'Bài giảng',        value: '—', sub: 'Đã xuất bản',     color: 'text-green-600 bg-green-50' },
  { icon: ClipboardList, label: 'Đợt kiểm định',    value: '—', sub: 'Đang mở',         color: 'text-orange-600 bg-orange-50' },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900">Dashboard Quản trị viên</h2>
        <p className="text-sm text-slate-500 mt-0.5">Tổng quan toàn bộ hệ thống E-Learning PDT</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <h3 className="font-bold text-slate-900 mb-3">Hoạt động gần đây</h3>
          <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Trạng thái hệ thống</h3>
          {[['API', 'Online', 'text-emerald-600'], ['Database', 'Stable', 'text-emerald-600'], ['Storage', '—', 'text-slate-400']].map(([k, v, c]) => (
            <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
              <span className="text-slate-600">{k}</span>
              <span className={`font-semibold ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
