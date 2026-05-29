import { ClipboardList, CheckCircle2, ListChecks } from 'lucide-react'

const CARDS = [
  { icon: ClipboardList, label: 'Phiếu cần chấm', value: '—', sub: 'Đang chờ xử lý', color: 'text-orange-600 bg-orange-50' },
  { icon: CheckCircle2,  label: 'Đã hoàn tất',    value: '—', sub: 'Đợt hiện tại',   color: 'text-green-600 bg-green-50' },
  { icon: ListChecks,    label: 'Tiêu chí',        value: '—', sub: 'Đang áp dụng',  color: 'text-purple-600 bg-purple-50' },
]

export default function CouncilDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900">Dashboard Hội đồng chấm</h2>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý chấm điểm và kiểm định bài giảng</p>
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
          <h3 className="font-bold text-slate-900 mb-3">Danh sách cần xử lý</h3>
          <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Trạng thái chấm điểm</h3>
          <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  )
}
