import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { ArrowLeft, Download, Edit, FileSpreadsheet, Plus, Settings, ToggleLeft, ToggleRight, Upload } from 'lucide-react'
import { toast } from 'sonner'
import courseService from '@/services/courseService'
import courseLecturerService from '@/services/courseLecturerService'
import AssignCourseRoleModal from '@/components/modal/AssignCourseRoleModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE = 20

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Quản lý môn (Manager)' },
  { value: 'member',  label: 'Thành viên (Member)' },
]

const ROLE_ALIAS = {
  manager: 'manager', 'quản lý': 'manager', 'quan ly': 'manager',
  member: 'member', 'thành viên': 'member', 'thanh vien': 'member',
}

const ROLE_BADGE = {
  manager: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  member:  'bg-sky-100 text-sky-700 hover:bg-sky-100',
}

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

const TABS = [
  { key: 'info',      label: 'Mô tả môn học' },
  { key: 'lecturers', label: 'Danh sách giảng viên của môn' },
]

// ── Import dialog (dành riêng cho 1 môn học — chỉ cần 2 cột) ──────────────
function CourseImportDialog({ isOpen, onOpenChange, courseCode, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting }) {
  const inputRef = useRef(null)
  const handleZoneClick   = () => inputRef.current?.click()
  const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
  const handleDrop        = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileChange(f) }
  const handleFileChange  = (e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import giảng viên cho môn {courseCode}</DialogTitle>
          <DialogDescription>Tải file mẫu, điền mã GV + quyền và import.</DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          role="button" tabIndex={0}
          onClick={handleZoneClick} onKeyDown={handleZoneKeyDown}
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#04ae9a]/40 bg-[#04ae9a]/5 px-6 py-6 text-center transition-colors hover:border-[#04ae9a] hover:bg-[#04ae9a]/10 focus:outline-none focus:ring-2 focus:ring-[#04ae9a]/30"
        >
          <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-[#04ae9a]/15">
            <FileSpreadsheet className="h-6 w-6 text-[#02a28a]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn</p>
            <p className="text-xs text-slate-500">Chỉ hỗ trợ .xlsx, .xls</p>
          </div>
          {importFile
            ? <div className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
            : <div className="text-xs text-slate-400">Chưa có file nào được chọn</div>
          }
          <Input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Cấu trúc cột */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="mb-1 font-semibold text-slate-700">Cấu trúc file (2 cột — mã môn học tự điền là <code className="font-mono text-[#08387F]">{courseCode}</code>):</p>
          <code className="text-xs text-slate-500">Mã giảng viên &nbsp;|&nbsp; Quyền</code>
          <p className="mt-1 text-xs text-slate-400">Quyền: <strong>manager</strong> (Quản lý) | <strong>member</strong> (Thành viên)</p>
        </div>

        {/* Kết quả */}
        {importResult && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Tổng: {importResult.total}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Thành công: {importResult.successCount}</span>
              {importResult.errorCount > 0 && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Lỗi: {importResult.errorCount}</span>
              )}
            </div>
            {importResult.errors?.length > 0 && (
              <>
                <div className="max-h-36 overflow-auto rounded-lg border border-rose-200 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 bg-rose-50">
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Dòng</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Mã GV</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-1.5 text-slate-600">{err.row}</td>
                          <td className="px-3 py-1.5 text-slate-800">{err.lecturer_code || '—'}</td>
                          <td className="px-3 py-1.5 text-rose-600">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button type="button" variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={onDownloadErrors}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Tải file lỗi về
                </Button>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onImport} disabled={submitting}>
            {submitting ? 'Đang nhập...' : 'Import phân công'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
export default function CourseDetail() {
  const { courseCode } = useParams()
  const navigate       = useNavigate()
  const { state }      = useLocation()

  const [activeTab, setActiveTab] = useState('info')

  // ── Thông tin môn học ──────────────────────────────────────────────────────
  const [courseInfo, setCourseInfo]       = useState(state?.course || null)
  const [courseLoading, setCourseLoading] = useState(!state?.course)

  // ── Bảng phân công ────────────────────────────────────────────────────────
  const [rows, setRows]             = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Modal gán hàng loạt theo khoa ─────────────────────────────────────────
  const [bulkOpen, setBulkOpen] = useState(false)

  // ── Import Excel ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen]             = useState(false)
  const [importFile, setImportFile]             = useState(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importResult, setImportResult]         = useState(null)
  const [importedRows, setImportedRows]         = useState([])

  // ── Dialog sửa quyền ──────────────────────────────────────────────────────
  const [roleOpen, setRoleOpen]             = useState(false)
  const [roleRecord, setRoleRecord]         = useState(null)
  const [roleValue, setRoleValue]           = useState('member')
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  // ── Dialog thêm thủ công ──────────────────────────────────────────────────
  const [assignOpen, setAssignOpen]             = useState(false)
  const [assignForm, setAssignForm]             = useState({ lecturerCode: '', roleName: 'member' })
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  // tải thông tin môn học nếu không có trong state
  useEffect(() => {
    if (courseInfo) { setCourseLoading(false); return }
    courseService.list({ courseCode, page: 1, pageSize: 1 })
      .then(({ rows: r }) => { if (r[0]) setCourseInfo(r[0]) })
      .catch(() => toast.error('Không tải được thông tin môn học'))
      .finally(() => setCourseLoading(false))
  }, [courseCode]) // eslint-disable-line

  // tải danh sách giảng viên
  useEffect(() => {
    setLoading(true)
    courseLecturerService.list({ courseCode, page, pageSize: PAGE_SIZE })
      .then(({ rows: data, total: count }) => { setRows(data); setTotal(count) })
      .catch(() => toast.error('Không tải được danh sách giảng viên'))
      .finally(() => setLoading(false))
  }, [courseCode, page, refreshKey])

  const afterMutation = () => { setPage(1); setRefreshKey((k) => k + 1) }

  // ── Thêm giảng viên thủ công ──────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignForm.lecturerCode.trim()) { toast.error('Vui lòng nhập mã giảng viên'); return }
    try {
      setAssignSubmitting(true)
      await courseLecturerService.assign({ courseCode, lecturerCode: assignForm.lecturerCode, roleName: assignForm.roleName })
      toast.success('Phân công giảng viên thành công')
      setAssignOpen(false)
      setAssignForm({ lecturerCode: '', roleName: 'member' })
      afterMutation()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Phân công thất bại')
    } finally {
      setAssignSubmitting(false)
    }
  }

  // ── Cập nhật quyền ───────────────────────────────────────────────────────
  const openRoleEdit = (record) => { setRoleRecord(record); setRoleValue(record.roleName); setRoleOpen(true) }

  const handleUpdateRole = async () => {
    try {
      setRoleSubmitting(true)
      await courseLecturerService.updateRole(roleRecord.id, roleValue)
      toast.success('Cập nhật quyền thành công')
      setRoleOpen(false)
      afterMutation()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật quyền thất bại')
    } finally {
      setRoleSubmitting(false)
    }
  }

  // ── Toggle trạng thái ─────────────────────────────────────────────────────
  const handleToggleStatus = async (record) => {
    try {
      await courseLecturerService.updateStatus(record.id, !record.isActive)
      toast.success(record.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt')
      afterMutation()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật trạng thái thất bại')
    }
  }

  // ── Import Excel (course-specific: chỉ cần GV + quyền) ───────────────────
  const downloadImportTemplate = () => {
    const sample = [
      { 'Mã giảng viên': '04112003', 'Quyền': 'manager' },
      { 'Mã giảng viên': '04112004', 'Quyền': 'member'  },
    ]
    const ws = XLSX.utils.json_to_sheet(sample)
    ws['!cols'] = [{ wch: 16 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PhanCong')
    XLSX.writeFile(wb, `mau-import-gv-${courseCode}.xlsx`)
  }

  const openImport = () => { setImportOpen(true); setImportFile(null); setImportResult(null); setImportedRows([]) }
  const closeImport = (open) => {
    setImportOpen(open)
    if (!open) { setImportFile(null); setImportResult(null); setImportedRows([]) }
  }

  const handleImport = async () => {
    if (!importFile) { toast.error('Vui lòng chọn file Excel'); return }
    try {
      setImportSubmitting(true)
      setImportResult(null)
      const data = await importFile.arrayBuffer()
      const wb   = XLSX.read(data, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const raw  = XLSX.utils.sheet_to_json(ws)
      const mapped = raw
        .map((row) => {
          const rawRole = String(row['Quyền'] || row.roleName || row.role_name || '').trim().toLowerCase()
          return {
            courseCode,
            lecturerCode: String(row['Mã giảng viên'] || row.lecturerCode || row.lecturer_code || '').trim(),
            roleName: ROLE_ALIAS[rawRole] || rawRole,
          }
        })
        .filter((r) => r.lecturerCode && ['manager', 'member'].includes(r.roleName))

      if (mapped.length === 0) { toast.error('File không có dữ liệu hợp lệ hoặc thiếu cột'); return }

      setImportedRows(mapped)
      const res    = await courseLecturerService.bulkAssign(mapped)
      const result = res.data
      setImportResult(result)

      if (result.successCount > 0) afterMutation()
      if (result.errorCount === 0) {
        toast.success(`Đã phân công ${result.successCount} giảng viên thành công`)
        setImportOpen(false)
      } else {
        toast.warning(`${result.successCount}/${result.total} thành công — ${result.errorCount} dòng lỗi`)
      }
    } catch {
      toast.error('Không đọc được file Excel hoặc lỗi kết nối')
    } finally {
      setImportSubmitting(false)
    }
  }

  const downloadErrors = () => {
    if (!importResult?.errors?.length) return
    const errRows = importResult.errors.map(({ row, lecturer_code, reason }) => {
      const orig = importedRows[(row ?? 2) - 2] || {}
      return {
        'Dòng':          row ?? '',
        'Mã giảng viên': lecturer_code || orig.lecturerCode || '',
        'Quyền':         orig.roleName || '',
        'Lỗi':           reason || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(errRows)
    ws['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 10 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
    XLSX.writeFile(wb, `loi-import-${courseCode}.xlsx`)
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0">

      {/* ── Breadcrumb ── */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button type="button" className="hover:text-[#08387F] transition-colors" onClick={() => navigate(-1)}>
          Danh sách môn học
        </button>
        <span>/</span>
        <span className="font-medium text-slate-800">Chi tiết môn học</span>
      </div>

      {/* ── Header card ── */}
      <Card className="border-slate-200 shadow-sm rounded-b-none border-b-0">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="space-y-2">
              {courseInfo?.facultyName && (
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{courseInfo.facultyName}</p>
              )}
              <CardTitle className="text-xl font-black text-[#08387F] leading-tight">
                {courseLoading ? '...' : (courseInfo?.courseName || courseCode)}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-500">{courseCode}</span>
                {courseInfo && (
                  <Badge className={courseInfo.isActive
                    ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : 'rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100'
                  }>
                    {courseInfo.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                )}
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm"
              className="shrink-0 gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#08387F]"
              onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </div>

          {/* Tabs — select trên mobile, nút ngang trên desktop */}
          <div className="-mx-6 px-6 border-t border-slate-200">
            {/* Mobile: dropdown */}
            <div className="block sm:hidden py-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
              >
                {TABS.map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label}{tab.key === 'lecturers' && total > 0 ? ` (${total})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop: nút ngang */}
            <div className="hidden sm:flex">
              {TABS.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'border-[#08387F] text-[#08387F]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}>
                  {tab.label}
                  {tab.key === 'lecturers' && total > 0 && (
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{total}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 1 — Mô tả môn học
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'info' && (
        <Card className="border-slate-200 shadow-sm rounded-t-none">
          <CardContent className="pt-6">
            {courseLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">Đang tải...</p>
            ) : !courseInfo ? (
              <p className="py-10 text-center text-sm text-slate-400">Không tìm thấy thông tin môn học.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mã môn học</p>
                  <p className="font-mono font-semibold text-slate-900">{courseInfo.courseCode}</p>
                </div>
                <div className="space-y-1 lg:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tên môn học</p>
                  <p className="font-semibold text-slate-900">{courseInfo.courseName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Số tín chỉ</p>
                  <p className="text-slate-800">{courseInfo.credits || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Khoa chủ quản</p>
                  <p className="text-slate-800">{courseInfo.facultyName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Manager tối đa</p>
                  <p className="text-slate-800">{courseInfo.countManager ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái</p>
                  <Badge className={courseInfo.isActive
                    ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : 'rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100'
                  }>
                    {courseInfo.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
                {courseInfo.description && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mô tả</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{courseInfo.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 2 — Danh sách giảng viên của môn
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'lecturers' && (
        <Card className="border-slate-200 shadow-sm rounded-t-none">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Danh sách giảng viên của môn</CardTitle>
                <CardDescription>
                  Quản lý phân công, quyền và trạng thái giảng viên cho môn <strong>{courseCode}</strong>.
                </CardDescription>
              </div>

              {/* ── Action bar ── */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Gán môn học (bulk theo khoa) */}
                <Button type="button" variant="outline"
                  className="border-[#04a552] bg-white text-[#03951d] hover:bg-[#03951d] hover:text-white"
                  onClick={() => setBulkOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Gán môn học
                </Button>

                {/* Thêm thủ công */}
                <Button type="button" variant="outline"
                  className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50"
                  onClick={() => { setAssignForm({ lecturerCode: '', roleName: 'member' }); setAssignOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" /> Thêm thủ công
                </Button>

                {/* Tải file mẫu import */}
                <Button type="button" variant="outline"
                  className="border-slate-400 bg-white text-slate-600 hover:bg-slate-50"
                  onClick={downloadImportTemplate}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Tải file mẫu
                </Button>

                {/* Import Excel */}
                <Button type="button" variant="outline"
                  className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50"
                  onClick={openImport}>
                  <Upload className="mr-2 h-4 w-4" /> Import Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-none border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead className="whitespace-nowrap">Mã GV</TableHead>
                    <TableHead className="whitespace-nowrap">Họ tên GV</TableHead>
                    <TableHead className="whitespace-nowrap">Học vị</TableHead>
                    <TableHead className="whitespace-nowrap">Khoa</TableHead>
                    <TableHead className="whitespace-nowrap">Bộ môn</TableHead>
                    <TableHead className="whitespace-nowrap">Quyền</TableHead>
                    <TableHead className="whitespace-nowrap">Người PC</TableHead>
                    <TableHead className="whitespace-nowrap">Ngày PC</TableHead>
                    <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                    <TableHead className="w-px whitespace-nowrap">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={11} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={11} className="py-8 text-center text-slate-500">Chưa có giảng viên nào được phân công.</TableCell></TableRow>
                  ) : rows.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-semibold text-slate-900">{r.lecturerCode}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.lecturerName}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">{r.lecturerDegree || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">{r.lecturerFacultyName || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">{r.lecturerDept || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-none ${ROLE_BADGE[r.roleName] || 'bg-slate-100 text-slate-700'}`}>
                          {r.roleName === 'manager' ? 'Manager' : r.roleName === 'member' ? 'Member' : r.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">
                        {r.assignedByName
                          ? <><span className="font-medium">{r.assignedByCode}</span> — {r.assignedByName}</>
                          : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">{formatDate(r.assignedAt)}</TableCell>
                      <TableCell>
                        <Badge className={r.isActive
                          ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
                        }>
                          {r.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" title="Sửa quyền" onClick={() => openRoleEdit(r)}>
                            <Settings className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm"
                            title={r.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            onClick={() => handleToggleStatus(r)}>
                            {r.isActive
                              ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                              : <ToggleLeft  className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-slate-500">{total} giảng viên phân công</span>
              {totalPages > 1 && (
                <Pagination className="w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#"
                        onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1) }}
                        className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
                    </PaginationItem>
                    {getPageNumbers().map((p, i) =>
                      p === '...' ? (
                        <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={p === page}
                            onClick={(e) => { e.preventDefault(); setPage(p) }}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext href="#"
                        onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1) }}
                        className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog sửa quyền ── */}
      <Dialog open={roleOpen} onOpenChange={(open) => { setRoleOpen(open); if (!open) setRoleRecord(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#08387F]">
              <Settings className="h-4 w-4" /> Cập nhật quyền
            </DialogTitle>
            <DialogDescription>{roleRecord?.lecturerCode} — {roleRecord?.lecturerName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="text-sm font-semibold text-slate-700">Quyền mới</label>
            <select value={roleValue} onChange={(e) => setRoleValue(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30">
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-400">Môn học: <strong>{courseCode}</strong></p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRoleOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]"
              onClick={handleUpdateRole} disabled={roleSubmitting}>
              {roleSubmitting ? 'Đang lưu...' : 'Lưu quyền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog thêm giảng viên thủ công ── */}
      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssignForm({ lecturerCode: '', roleName: 'member' }) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#08387F]">Thêm giảng viên</DialogTitle>
            <DialogDescription>Phân công giảng viên cho môn <strong>{courseCode}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mã giảng viên <span className="text-rose-500">*</span></label>
              <Input value={assignForm.lecturerCode}
                onChange={(e) => setAssignForm((p) => ({ ...p, lecturerCode: e.target.value }))}
                placeholder="VD: 04112003"
                onKeyDown={(e) => e.key === 'Enter' && handleAssign()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Quyền <span className="text-rose-500">*</span></label>
              <select value={assignForm.roleName}
                onChange={(e) => setAssignForm((p) => ({ ...p, roleName: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30">
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]"
              onClick={handleAssign} disabled={assignSubmitting}>
              {assignSubmitting ? 'Đang lưu...' : 'Phân công'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal gán hàng loạt theo khoa ── */}
      <AssignCourseRoleModal
        isOpen={bulkOpen}
        onOpenChange={setBulkOpen}
        onSuccess={afterMutation}
      />

      {/* ── Import Excel dialog ── */}
      <CourseImportDialog
        isOpen={importOpen}
        onOpenChange={closeImport}
        courseCode={courseCode}
        importFile={importFile}
        onFileChange={setImportFile}
        importResult={importResult}
        onImport={handleImport}
        onDownloadErrors={downloadErrors}
        submitting={importSubmitting}
      />
    </div>
  )
}
