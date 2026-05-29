import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, FileSpreadsheet, Lock, Unlock, Plus, Search, Edit, Key } from 'lucide-react'
import { toast } from 'sonner'
import lectureService from '@/services/lectureService'
import facultyService from '@/services/facultyService'
import academicDegreeService from '@/services/academicDegreeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const emptyForm = {
  lecturerCode: '',
  fullName: '',
  email: '',
  facultyId: '',
  academicDegree: '',
  phone: '',
  avatarUrl: '',
  isActive: true,
}

const normalize = (value) => String(value || '').trim().toLowerCase()

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) return <span className="ml-1 inline-block h-3.5 w-3.5 text-slate-400">↕</span>
  return sortConfig.direction === 'asc'
    ? <span className="ml-1 inline-block h-3.5 w-3.5 text-[#08387F]">↑</span>
    : <span className="ml-1 inline-block h-3.5 w-3.5 text-[#08387F]">↓</span>
}

export default function LecturerManagement() {
  const [faculties, setFaculties]         = useState([])
  const [degreeOptions, setDegreeOptions] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [importFile, setImportFile]     = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importedRows, setImportedRows] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', confirmLabel: 'Xác nhận' })
  const confirmActionRef = useRef(null)
  const fileRef = useRef(null)

  const fetchLecturers = useCallback(async (page = currentPage, size = pageSize, code = searchCode, name = searchName) => {
    setLoading(true)
    try {
      const { rows, total: t } = await lectureService.list({ lecturerCode: code, fullName: name, page, pageSize: size })
      setLecturers(rows)
      setTotal(t)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách giảng viên')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchCode, searchName])

  useEffect(() => {
    facultyService.list().then(setFaculties).catch(() => {})
    academicDegreeService.list().then(setDegreeOptions).catch(() => {})
  }, [])

  useEffect(() => {
    fetchLecturers(currentPage, pageSize, searchCode, searchName)
  }, [currentPage, pageSize])

  const sortedLecturers = useMemo(() => {
    if (!sortConfig.key) return lecturers
    return [...lecturers].sort((a, b) => {
      const aVal = normalize(a[sortConfig.key])
      const bVal = normalize(b[sortConfig.key])
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
  }, [lecturers, sortConfig])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (safePage > 3) pages.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
    if (safePage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchLecturers(1, pageSize, searchCode, searchName)
  }

  const resetForm = () => setForm(emptyForm)

  const openForm = (lecturer = null) => {
    if (lecturer) {
      setEditing(lecturer)
      setForm({
        lecturerCode: lecturer.lecturerCode || '',
        fullName: lecturer.fullName || '',
        email: lecturer.email || '',
        facultyId: lecturer.facultyId || '',
        academicDegree: lecturer.academicDegree || '',
        phone: lecturer.phone || '',
        avatarUrl: lecturer.avatarUrl || '',
        isActive: Boolean(lecturer.isActive),
      })
    } else {
      setEditing(null)
      resetForm()
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.lecturerCode.trim() || !form.fullName.trim()) {
      toast.error('Vui lòng nhập mã giảng viên và họ tên')
      return
    }

    setSubmitting(true)
    try {
      if (editing?.id) {
        await lectureService.update(editing.id, form)
        toast.success('Cập nhật giảng viên thành công')
      } else {
        await lectureService.create(form)
        toast.success('Đã thêm giảng viên')
      }
      setIsFormOpen(false)
      setEditing(null)
      resetForm()
      fetchLecturers(1, pageSize, searchCode, searchName)
      setCurrentPage(1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu giảng viên thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Vui lòng chọn file Excel trước')
      return
    }
    setImportSubmitting(true)
    setImportResult(null)
    try {
      const data = await importFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet])
      const lecturersToImport = rows.map((row) => ({
        lecturerCode:   String(row.lecturerCode  || row['Mã giảng viên'] || row['Mã số giảng viên'] || row.code || '').trim(),
        fullName:       String(row.fullName      || row['Họ tên']        || row.name               || '').trim(),
        email:          String(row.email         || row['Email']         || '').trim(),
        facultyName:    String(row.facultyName   || row['Tên khoa']      || row['Khoa']            || row['faculty_name'] || '').trim() || undefined,
        academicDegree: String(row.academicDegree|| row['Học vị']        || row['academic_degree'] || '').trim() || undefined,
        phone:          String(row.phone         || row['Số điện thoại'] || '').trim(),
        avatarUrl:      String(row.avatarUrl     || row['avatar_url']    || '').trim(),
      })).filter((item) => item.lecturerCode && item.fullName)

      if (lecturersToImport.length === 0) {
        toast.error('File Excel không có dữ liệu hợp lệ')
        return
      }

      setImportedRows(lecturersToImport)
      const loadingToast = toast.loading(`Đang nhập ${lecturersToImport.length} giảng viên...`)
      const result = await lectureService.importLecturers(lecturersToImport)
      toast.dismiss(loadingToast)
      setImportResult(result)

      if (result.successCount > 0) fetchLecturers(1, pageSize, searchCode, searchName)
      if (result.errorCount === 0) {
        toast.success(`Đã nhập ${result.successCount} giảng viên thành công`)
        setIsImportOpen(false)
        setImportFile(null)
        setCurrentPage(1)
      } else {
        toast.warning(`${result.successCount}/${result.total} thành công — ${result.errorCount} dòng lỗi`)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nhập Excel thất bại')
    } finally {
      setImportSubmitting(false)
    }
  }

  const downloadImportErrors = () => {
    if (!importResult?.errors?.length) return
    const errRows = importResult.errors.map(({ row, lecturer_code, message }) => ({
      'Dòng': row ?? '',
      'Mã giảng viên': lecturer_code || importedRows[(row ?? 2) - 2]?.lecturerCode || '',
      'Họ tên': importedRows[(row ?? 2) - 2]?.fullName || '',
      'Lỗi': message || '',
    }))
    const ws = XLSX.utils.json_to_sheet(errRows)
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
    XLSX.writeFile(wb, 'loi_import_giang_vien.xlsx')
  }

  const downloadTemplate = () => {
    const data = [{
      'Mã giảng viên': 'GV001',
      'Họ tên':        'Nguyễn Văn A',
      'Email':         'a.gv001@school.edu.vn',
      'Tên khoa':      'Công nghệ thông tin',
      'Học vị':        'Thạc sĩ',
      'Số điện thoại': '0901234567',
      'avatar_url':    '',
    }]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'GiangVien')
    XLSX.writeFile(wb, 'mau_import_giang_vien.xlsx')
  }

  const openConfirmDialog = ({ title, description, confirmLabel = 'Xác nhận', onConfirm }) => {
    confirmActionRef.current = onConfirm
    setConfirmDialog({ open: true, title, description, confirmLabel })
  }

  const handleConfirmDialogChange = (open) => {
    setConfirmDialog((prev) => ({ ...prev, open }))
    if (!open) confirmActionRef.current = null
  }

  const handleConfirmAction = async () => {
    const action = confirmActionRef.current
    handleConfirmDialogChange(false)
    if (typeof action === 'function') await action()
  }

  const lockOne = async (lecturer, action = 'lock') => {
    const actionLabel = action === 'unlock' ? 'mở khóa' : 'khóa'
    try {
      await lectureService.lockAccount(lecturer.id, action)
      toast.success(`Đã ${actionLabel} tài khoản giảng viên`)
      fetchLecturers(currentPage, pageSize, searchCode, searchName)
    } catch (err) {
      toast.error(err?.response?.data?.message || `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} tài khoản thất bại`)
    }
  }

  const handleLockLecturer = (lecturer, action = 'lock') => {
    const actionLabel = action === 'unlock' ? 'mở khóa' : 'khóa'
    openConfirmDialog({
      title: `Xác nhận ${actionLabel} tài khoản`,
      description: `Bạn có chắc muốn ${actionLabel} tài khoản của ${lecturer.fullName}?`,
      confirmLabel: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} tài khoản`,
      onConfirm: () => lockOne(lecturer, action),
    })
  }

  const handleResetPassword = (lecturer) => {
    openConfirmDialog({
      title: 'Xác nhận đặt lại mật khẩu',
      description: `Đặt lại mật khẩu của ${lecturer.fullName} về 12345678?`,
      confirmLabel: 'Đặt lại mật khẩu',
      onConfirm: async () => {
        try {
          await lectureService.resetPassword(lecturer.id, '12345678')
          toast.success('Đã reset mật khẩu về 12345678')
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Reset mật khẩu thất bại')
        }
      },
    })
  }

  const handleLockAll = async (isLock = true) => {
    const action = isLock ? 'lock' : 'unlock'
    const actionLabel = isLock ? 'khóa' : 'mở khóa'

    openConfirmDialog({
      title: `Xác nhận ${actionLabel} toàn bộ`,
      description: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ giảng viên theo bộ lọc hiện tại?`,
      confirmLabel: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ`,
      onConfirm: async () => {
        const loadingToast = toast.loading(`Đang ${actionLabel} toàn bộ tài khoản...`)
        try {
          const { total } = await lectureService.list({ lecturerCode: searchCode, fullName: searchName, page: 1, pageSize: 1 })
          if (!total) {
            toast.dismiss(loadingToast)
            toast.error(`Không có giảng viên để ${actionLabel}`)
            return
          }
          const { rows } = await lectureService.list({ lecturerCode: searchCode, fullName: searchName, page: 1, pageSize: Math.max(total, 1) })
          const lecturerIds = rows.map((item) => item.id).filter(Boolean)
          const bulkResult = await lectureService.lockAccounts(lecturerIds, action)
          const result = bulkResult?.data || {}
          const success = Number(result.successCount || 0)
          const fail = Number(result.errorCount || 0)
          toast.dismiss(loadingToast)
          if (success > 0) toast.success(`Đã ${actionLabel} ${success} tài khoản giảng viên`)
          if (fail > 0) toast.error(`${fail} tài khoản ${actionLabel} thất bại`)
          fetchLecturers(1, pageSize, searchCode, searchName)
          setCurrentPage(1)
        } catch (err) {
          toast.dismiss(loadingToast)
          toast.error(err?.response?.data?.message || `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ thất bại`)
        }
      },
    })
  }

  const handleExportExcel = async () => {
    try {
      const loadingToast = toast.loading('Đang tải dữ liệu để xuất Excel...')
      const { total } = await lectureService.list({ lecturerCode: searchCode, fullName: searchName, page: 1, pageSize: 1 })
      const { rows } = await lectureService.list({ lecturerCode: searchCode, fullName: searchName, page: 1, pageSize: Math.max(total, 1) })
      const data = rows.map((item, index) => ({
        STT: index + 1,
        user_id: item.userId,
        'Mã giảng viên': item.lecturerCode,
        'Họ tên': item.fullName,
        Email: item.email,
        Khoa: item.facultyName,
        'Học vị': item.academicDegree,
        'Số điện thoại': item.phone,
        avatar_url: item.avatarUrl,
        is_active: item.isActive ? 1 : 0,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'GiangVien')
      XLSX.writeFile(wb, 'danh_sach_giang_vien.xlsx')
      toast.dismiss(loadingToast)
      toast.success('Đã xuất Excel')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xuất Excel thất bại')
    }
  }

  const getRowLockAction = (lecture) => lecture.isActive ? 'lock' : 'unlock'

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý giảng viên</CardTitle>
          <CardDescription>Tra cứu, thêm mới, import/export Excel và khóa tài khoản giảng viên.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mã giảng viên</label>
              <Input value={searchCode} onChange={(e) => setSearchCode(e.target.value)} placeholder="Nhập mã giảng viên" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Họ tên</label>
              <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Nhập họ tên" />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => openForm()}>
              <Plus className="mr-2 h-4 w-4" /> Thêm giảng viên
            </Button>
            <Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Thêm bằng Excel
            </Button>
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" /> Xuất Excel
            </Button>
            <Button type="button" variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => handleLockAll(true)}>
              <Lock className="mr-2 h-4 w-4" /> Khóa toàn bộ
            </Button>
            <Button type="button" variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => handleLockAll(false)}>
              <Unlock className="mr-2 h-4 w-4" /> Mở khóa toàn bộ
            </Button>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">Tổng: {total}</Badge>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách giảng viên</CardTitle>
          <CardDescription>Kết quả lọc theo mã giảng viên và họ tên.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: 'lecturerCode',  label: 'Mã GV' },
                    { key: 'fullName',      label: 'Họ tên' },
                    { key: 'facultyName',   label: 'Khoa' },
                    { key: 'academicDegree', label: 'Học vị' },
                    { key: 'email',         label: 'Email' },
                    { key: 'phone',         label: 'Số điện thoại' },
                    { key: 'isActive',      label: 'Trạng thái' },
                    { key: null,            label: 'Hành động' },
                  ].map(({ key, label }) => (
                    <TableHead key={label} className={key ? 'cursor-pointer select-none whitespace-nowrap' : undefined} onClick={key ? () => setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' })) : undefined}>
                      {label}
                      {key && <SortIcon column={key} sortConfig={sortConfig} />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : sortedLecturers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Không tìm thấy giảng viên phù hợp.</TableCell></TableRow>
                ) : (
                  sortedLecturers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-slate-900">{item.lecturerCode}</TableCell>
                      <TableCell>{item.fullName}</TableCell>
                      <TableCell>{item.facultyName || '—'}</TableCell>
                      <TableCell>{item.academicDegree || '—'}</TableCell>
                      <TableCell>{item.email || '—'}</TableCell>
                      <TableCell>{item.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge className={item.isActive ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                          {item.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-px">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="ghost" size="icon-sm" title={item.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} onClick={() => openConfirmDialog({ title: `Xác nhận ${item.isActive ? 'khóa' : 'mở khóa'} tài khoản`, description: `Bạn có chắc muốn ${item.isActive ? 'khóa' : 'mở khóa'} tài khoản của ${item.fullName}?`, confirmLabel: `${item.isActive ? 'Khóa' : 'Mở khóa'} tài khoản`, onConfirm: () => lockOne(item, getRowLockAction(item)) })}>
                            {item.isActive ? <Lock className="h-4 w-4 text-rose-500" /> : <Unlock className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" title="Sửa thông tin" onClick={() => openForm(item)}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" title="Đổi mật khẩu" onClick={() => handleResetPassword(item)}>
                            <Key className="h-4 w-4 text-purple-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Hiển thị</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }} className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]">
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span>/ trang — {total} giảng viên</span>
            </div>

            <Pagination className="w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)) }} className={safePage === 1 ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
                {getPageNumbers().map((page, idx) => page === '...' ? (
                  <PaginationItem key={`ellipsis-${idx}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" isActive={page === safePage} onClick={(e) => { e.preventDefault(); setCurrentPage(page) }}>{page}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)) }} className={safePage === totalPages ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setEditing(null); resetForm() } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa giảng viên' : 'Thêm giảng viên'}</DialogTitle>
            <DialogDescription>Nhập thông tin giảng viên theo form bên dưới.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {[
              ['Mã giảng viên', 'lecturerCode', 'VD: GV001'],
              ['Họ tên', 'fullName', 'VD: Nguyễn Văn A'],
              ['Email', 'email', 'gv@school.edu.vn'],
              ['Số điện thoại', 'phone', 'VD: 0901234567'],
              ['Avatar URL', 'avatarUrl', 'https://...'],
            ].map(([label, field, placeholder]) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-semibold">{label}</label>
                <Input value={form[field]} onChange={(e) => setForm((cur) => ({ ...cur, [field]: e.target.value }))} placeholder={placeholder} />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Khoa</label>
              <select
                value={form.facultyId}
                onChange={(e) => setForm((cur) => ({ ...cur, facultyId: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                <option value="">-- Chọn khoa --</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.facultyName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Học vị</label>
              <select
                value={form.academicDegree}
                onChange={(e) => setForm((cur) => ({ ...cur, academicDegree: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                <option value="">-- Chọn học vị --</option>
                {degreeOptions.map((d) => (
                  <option key={d.id} value={d.degreeName}>{d.degreeName}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu giảng viên'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) { setImportFile(null); setImportResult(null); setImportedRows([]) } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm giảng viên bằng Excel</DialogTitle>
            <DialogDescription>Tải file mẫu, chọn file Excel và nhập danh sách giảng viên.</DialogDescription>
          </DialogHeader>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#04ae9a]/40 bg-[#04ae9a]/5 px-6 py-8 text-center transition-colors hover:border-[#04ae9a] hover:bg-[#04ae9a]/10"
          >
            <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-[#04ae9a]/15"><FileSpreadsheet className="h-7 w-7 text-[#02a28a]" /></div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
              <p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls, .csv</p>
            </div>
            {importFile ? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div> : <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm text-slate-600">
              Cột bắt buộc: <strong>Mã giảng viên</strong>, <strong>Họ tên</strong>. Tùy chọn: Tên khoa, Học vị, Email, SĐT.
            </div>
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" />Tải file mẫu</Button>
          </div>

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
                          <th className="px-3 py-2 text-left font-semibold text-rose-700">Mã GV</th>
                          <th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((err, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-1.5 text-slate-600">{err.row}</td>
                            <td className="px-3 py-1.5 text-slate-800">{err.lecturer_code || '—'}</td>
                            <td className="px-3 py-1.5 text-rose-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={downloadImportErrors}>
                    <Download className="mr-2 h-3.5 w-3.5" /> Tải file lỗi về
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleImport} disabled={importSubmitting}>{importSubmitting ? 'Đang nhập...' : 'Nhập giảng viên'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.open} onOpenChange={handleConfirmDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>{confirmDialog.confirmLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
