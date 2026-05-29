import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Edit, FileSpreadsheet, Plus, Search, Settings, ToggleLeft, ToggleRight, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import courseLecturerService from '@/services/courseLecturerService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Quản lý môn (Manager)' },
  { value: 'member',  label: 'Thành viên (Member)' },
]

const ROLE_BADGE = {
  manager: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  member:  'bg-sky-100 text-sky-700 hover:bg-sky-100',
}

const emptyAssignForm = { courseCode: '', lecturerCode: '', roleName: 'member' }
const emptyFilters    = { lecturerCode: '', lecturerName: '', roleName: '', courseCode: '', courseName: '', assignedByCode: '', assignedByName: '', isActive: '' }

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

// ── Dialog phân công mới ───────────────────────────────────────────────────
function AssignDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting }) {
  const set = (field) => (e) => onFormChange((p) => ({ ...p, [field]: e.target.value }))
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#08387F]">Phân công giảng viên</DialogTitle>
          <DialogDescription>Nhập mã môn học, mã giảng viên và chọn quyền.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mã môn học <span className="text-rose-500">*</span></label>
            <Input value={form.courseCode} onChange={set('courseCode')} placeholder="VD: 010113" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mã giảng viên <span className="text-rose-500">*</span></label>
            <Input value={form.lecturerCode} onChange={set('lecturerCode')} placeholder="VD: 04112003" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Quyền <span className="text-rose-500">*</span></label>
            <select
              value={form.roleName}
              onChange={set('roleName')}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Phân công'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Dialog sửa quyền ───────────────────────────────────────────────────────
function EditRoleDialog({ isOpen, onOpenChange, record, roleName, onRoleChange, onSubmit, submitting }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#08387F]">
            <Settings className="h-4 w-4" /> Cập nhật quyền
          </DialogTitle>
          <DialogDescription>
            {record?.lecturerCode} — {record?.lecturerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-sm font-semibold text-slate-700">Quyền mới</label>
          <select
            value={roleName}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
          >
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">Môn học: <strong>{record?.courseCode}</strong> — {record?.courseName}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu quyền'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Template download ──────────────────────────────────────────────────────
const downloadTemplate = () => {
  const sample = [
    { 'Mã môn học': '010113', 'Mã giảng viên': '04112003', 'Quyền': 'manager' },
    { 'Mã môn học': '010113', 'Mã giảng viên': '04112004', 'Quyền': 'member'  },
    { 'Mã môn học': '010114', 'Mã giảng viên': '04112003', 'Quyền': 'member'  },
  ]
  const ws = XLSX.utils.json_to_sheet(sample)
  ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'PhanCong')
  XLSX.writeFile(wb, 'mau_import_phan_cong.xlsx')
}

// ── Mapper dòng Excel → object ─────────────────────────────────────────────
const mapRowsToAssignments = (rows = []) => {
  const ROLE_ALIAS = {
    manager: 'manager', 'quản lý': 'manager', 'quan ly': 'manager',
    member: 'member', 'thành viên': 'member', 'thanh vien': 'member',
  }
  return rows
    .map((row) => {
      const rawRole = String(
        row.roleName || row.role_name || row['Quyền'] || row['quyen'] || ''
      ).trim().toLowerCase()
      return {
        courseCode:   String(row.courseCode   || row.course_code   || row['Mã môn học']   || '').trim().toUpperCase(),
        lecturerCode: String(row.lecturerCode || row.lecturer_code || row['Mã giảng viên'] || '').trim(),
        roleName:     ROLE_ALIAS[rawRole] || rawRole,
      }
    })
    .filter((r) => r.courseCode && r.lecturerCode && ['manager', 'member'].includes(r.roleName))
}

// ── Dialog Import Excel ────────────────────────────────────────────────────
function ImportDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting }) {
  const inputRef = useRef(null)
  const handleZoneClick   = () => inputRef.current?.click()
  const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
  const handleDrop        = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileChange(f) }
  const handleFileChange  = (e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import danh sách phân công</DialogTitle>
          <DialogDescription>Tải file mẫu, điền dữ liệu và import để phân công hàng loạt.</DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          role="button" tabIndex={0}
          onClick={handleZoneClick} onKeyDown={handleZoneKeyDown}
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#04ae9a]/40 bg-[#04ae9a]/5 px-6 py-8 text-center transition-colors hover:border-[#04ae9a] hover:bg-[#04ae9a]/10 focus:outline-none focus:ring-2 focus:ring-[#04ae9a]/30"
        >
          <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-[#04ae9a]/15">
            <FileSpreadsheet className="h-7 w-7 text-[#02a28a]" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn</p>
            <p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls</p>
          </div>
          {importFile
            ? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
            : <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>
          }
          <Input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Cấu trúc cột */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="mb-1 font-semibold text-slate-700">Cấu trúc file (3 cột):</p>
          <code className="text-xs text-slate-500">Mã môn học &nbsp;|&nbsp; Mã giảng viên &nbsp;|&nbsp; Quyền</code>
          <p className="mt-1 text-xs text-slate-400">Quyền: <strong>manager</strong> (Quản lý) | <strong>member</strong> (Thành viên)</p>
        </div>

        {/* Kết quả import */}
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
                <div className="max-h-40 overflow-auto rounded-lg border border-rose-200 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 bg-rose-50">
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Dòng</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Mã môn</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Mã GV</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-1.5 text-slate-600">{err.row}</td>
                          <td className="px-3 py-1.5 text-slate-800">{err.course_code   || '—'}</td>
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

// ── Trang chính ────────────────────────────────────────────────────────────
export default function CourseLecturerManagement() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [filters, setFilters] = useState(emptyFilters)
  const lastQueryRef = useRef({ page: 1, pageSize: PAGE_SIZE_OPTIONS[0], ...emptyFilters })

  // assign dialog
  const [assignOpen, setAssignOpen]           = useState(false)
  const [assignForm, setAssignForm]           = useState(emptyAssignForm)
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  // edit role dialog
  const [roleOpen, setRoleOpen]               = useState(false)
  const [roleRecord, setRoleRecord]           = useState(null)
  const [roleValue, setRoleValue]             = useState('member')
  const [roleSubmitting, setRoleSubmitting]   = useState(false)

  // import dialog
  const [importOpen, setImportOpen]           = useState(false)
  const [importFile, setImportFile]           = useState(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importResult, setImportResult]       = useState(null)
  const [importedRows, setImportedRows]       = useState([])

  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  const safePage   = Math.min(page, totalPages)

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (safePage > 3) pages.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
    if (safePage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const setFilter = (field) => (e) => setFilters((p) => ({ ...p, [field]: e.target.value }))

  const fetchRows = async (p = page, ps = pageSize, f = filters) => {
    setLoading(true)
    try {
      lastQueryRef.current = { page: p, pageSize: ps, ...f }
      const { rows: data, total: count } = await courseLecturerService.list({ ...f, page: p, pageSize: ps })
      setRows(data)
      setTotal(count)
      setPage(p)
      setPageSize(ps)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách phân công')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    const q = lastQueryRef.current
    fetchRows(q.page, q.pageSize, q)
  }

  const handleSearch = () => fetchRows(1, pageSize, filters)
  const handleReset  = () => { setFilters(emptyFilters); fetchRows(1, pageSize, emptyFilters) }

  // ── Phân công mới ──────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignForm.courseCode.trim() || !assignForm.lecturerCode.trim()) {
      toast.error('Vui lòng nhập mã môn học và mã giảng viên')
      return
    }
    try {
      setAssignSubmitting(true)
      await courseLecturerService.assign({ courseCode: assignForm.courseCode, lecturerCode: assignForm.lecturerCode, roleName: assignForm.roleName })
      toast.success('Phân công giảng viên thành công')
      setAssignOpen(false)
      setAssignForm(emptyAssignForm)
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Phân công thất bại')
    } finally {
      setAssignSubmitting(false)
    }
  }

  // ── Sửa quyền ─────────────────────────────────────────────────────────
  const openRoleEdit = (record) => {
    setRoleRecord(record)
    setRoleValue(record.roleName)
    setRoleOpen(true)
  }

  const handleUpdateRole = async () => {
    try {
      setRoleSubmitting(true)
      await courseLecturerService.updateRole(roleRecord.id, roleValue)
      toast.success('Cập nhật quyền thành công')
      setRoleOpen(false)
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật quyền thất bại')
    } finally {
      setRoleSubmitting(false)
    }
  }

  // ── Toggle trạng thái ──────────────────────────────────────────────────
  const handleToggleStatus = async (record) => {
    try {
      await courseLecturerService.updateStatus(record.id, !record.isActive)
      toast.success(record.isActive ? 'Đã vô hiệu hóa phân công' : 'Đã kích hoạt phân công')
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật trạng thái thất bại')
    }
  }

  // ── Xuất Excel ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    const loadingToast = toast.loading('Đang tải dữ liệu để xuất Excel...')
    try {
      const { total: count } = await courseLecturerService.list({ ...filters, page: 1, pageSize: 1 })
      const { rows: data }   = await courseLecturerService.list({ ...filters, page: 1, pageSize: Math.max(count, 1) })
      const exportRows = data.map((r, i) => ({
        STT:                i + 1,
        'Mã giảng viên':    r.lecturerCode,
        'Họ tên GV':        r.lecturerName,
        'Bộ môn':           r.lecturerDept || '',
        'Mã môn học':       r.courseCode,
        'Tên môn học':      r.courseName,
        'Quyền':            r.roleName,
        'Người phân công':  r.assignedByName,
        'Mã phân công':     r.assignedByCode,
        'Ngày phân công':   formatDate(r.assignedAt),
        'Trạng thái':       r.isActive ? 'Đang hoạt động' : 'Vô hiệu',
      }))
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'PhanCong')
      XLSX.writeFile(wb, `phan-cong-mon-hoc-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.dismiss(loadingToast)
      toast.success('Đã xuất file Excel')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error(err?.response?.data?.message || 'Xuất Excel thất bại')
    }
  }

  // ── Import Excel ───────────────────────────────────────────────────────
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
      const rows = mapRowsToAssignments(XLSX.utils.sheet_to_json(ws))

      if (rows.length === 0) {
        toast.error('File không có dữ liệu hợp lệ hoặc thiếu cột bắt buộc')
        return
      }
      setImportedRows(rows)
      const res    = await courseLecturerService.bulkAssign(rows)
      const result = res.data
      setImportResult(result)

      if (result.successCount > 0) refresh()
      if (result.errorCount === 0) {
        toast.success(`Đã phân công ${result.successCount} bản ghi thành công`)
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
    const errRows = importResult.errors.map(({ row, course_code, lecturer_code, reason }) => {
      const orig = importedRows[(row ?? 2) - 2] || {}
      return {
        'Dòng': row ?? '', 'Mã môn học': course_code || orig.courseCode || '',
        'Mã giảng viên': lecturer_code || orig.lecturerCode || '',
        'Quyền': orig.roleName || '', 'Lỗi': reason || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(errRows)
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
    XLSX.writeFile(wb, 'loi_import_phan_cong.xlsx')
  }

  return (
    <div className="space-y-6">
      {/* ── Card 1: Filter + Actions ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Phân quyền môn học</CardTitle>
          <CardDescription>Quản lý phân công giảng viên, cập nhật quyền và trạng thái.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mã giảng viên</label>
              <Input value={filters.lecturerCode} onChange={setFilter('lecturerCode')} placeholder="Nhập mã GV" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Họ tên giảng viên</label>
              <Input value={filters.lecturerName} onChange={setFilter('lecturerName')} placeholder="Nhập họ tên" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mã môn học</label>
              <Input value={filters.courseCode} onChange={setFilter('courseCode')} placeholder="Nhập mã môn" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tên môn học</label>
              <Input value={filters.courseName} onChange={setFilter('courseName')} placeholder="Nhập tên môn" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Quyền</label>
              <select value={filters.roleName} onChange={setFilter('roleName')} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30">
                <option value="">Tất cả</option>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mã người phân công</label>
              <Input value={filters.assignedByCode} onChange={setFilter('assignedByCode')} placeholder="Mã GV phân công" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tên người phân công</label>
              <Input value={filters.assignedByName} onChange={setFilter('assignedByName')} placeholder="Họ tên người PC" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
              <select value={filters.isActive} onChange={setFilter('isActive')} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30">
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Vô hiệu</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> Tìm
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} title="Xóa bộ lọc">
              <X className="mr-2 h-4 w-4" /> Xóa lọc
            </Button>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => { setAssignForm(emptyAssignForm); setAssignOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Phân công mới
            </Button>
            <Button type="button" variant="outline" className="border-slate-400 bg-white text-slate-600 hover:bg-slate-50" onClick={downloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Tải file mẫu
            </Button>
            <Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={openImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Xuất Excel
            </Button>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {total} bản ghi
          </Badge>
        </CardContent>
      </Card>

      {/* ── Card 2: Table ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách phân công</CardTitle>
          <CardDescription>Kết quả lọc theo bộ điều kiện tìm kiếm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Mã GV</TableHead>
                  <TableHead className="whitespace-nowrap">Họ tên GV</TableHead>
                  <TableHead className="whitespace-nowrap">Mã môn học</TableHead>
                  <TableHead className="whitespace-nowrap">Tên môn học</TableHead>
                  <TableHead className="whitespace-nowrap">Quyền</TableHead>
                  <TableHead className="whitespace-nowrap">Người phân công</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày PC</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                  <TableHead className="whitespace-nowrap w-px">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-slate-500">Không tìm thấy dữ liệu phù hợp.</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-slate-900 whitespace-nowrap">{r.lecturerCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.lecturerName}</TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">{r.courseCode}</TableCell>
                    <TableCell className="max-w-[180px] truncate" title={r.courseName}>{r.courseName}</TableCell>
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
                        {r.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" title="Sửa quyền" onClick={() => openRoleEdit(r)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title={r.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} onClick={() => handleToggleStatus(r)}>
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
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => fetchRows(1, Number(e.target.value), filters)}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>/ trang — {total} bản ghi</span>
            </div>

            <Pagination className="w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (safePage > 1) fetchRows(safePage - 1, pageSize, filters) }} className={safePage === 1 ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink href="#" isActive={p === safePage} onClick={(e) => { e.preventDefault(); fetchRows(p, pageSize, filters) }}>{p}</PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (safePage < totalPages) fetchRows(safePage + 1, pageSize, filters) }} className={safePage === totalPages ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog phân công mới ── */}
      <AssignDialog
        isOpen={assignOpen}
        onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssignForm(emptyAssignForm) }}
        form={assignForm}
        onFormChange={setAssignForm}
        onSubmit={handleAssign}
        submitting={assignSubmitting}
      />

      {/* ── Dialog sửa quyền ── */}
      <EditRoleDialog
        isOpen={roleOpen}
        onOpenChange={(open) => { setRoleOpen(open); if (!open) setRoleRecord(null) }}
        record={roleRecord}
        roleName={roleValue}
        onRoleChange={setRoleValue}
        onSubmit={handleUpdateRole}
        submitting={roleSubmitting}
      />

      {/* ── Dialog import Excel ── */}
      <ImportDialog
        isOpen={importOpen}
        onOpenChange={closeImport}
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
