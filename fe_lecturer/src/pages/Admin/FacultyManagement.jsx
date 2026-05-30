import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Edit, FileSpreadsheet, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import facultyService from '@/services/facultyService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const emptyForm = { facultyName: '' }

//  Dialog thêm / sửa khoa 
function FacultyDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, editing }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#08387F]">
            {editing ? 'Chỉnh sửa khoa/viện' : 'Thêm khoa/viện'}
          </DialogTitle>
          <DialogDescription>Nhập tên khoa hoặc viện.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-sm font-semibold text-slate-700">
            Tên khoa/viện <span className="text-rose-500">*</span>
          </label>
          <Input
            value={form.facultyName}
            onChange={(e) => onFormChange((p) => ({ ...p, facultyName: e.target.value }))}
            placeholder="VD: Công nghệ thông tin"
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            type="button"
            className="bg-[#08387F] text-white hover:bg-[#072f6a]"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm khoa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

//  Dialog import Excel 
function ImportDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting }) {
  const inputRef = useRef(null)
  const handleZoneClick  = () => inputRef.current?.click()
  const handleZoneKey    = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
  const handleDrop       = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileChange(f) }
  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import danh sách Khoa/Viện</DialogTitle>
          <DialogDescription>Tải file mẫu, điền dữ liệu và import để thêm hàng loạt.</DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          role="button" tabIndex={0}
          onClick={handleZoneClick} onKeyDown={handleZoneKey}
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
          <p className="mb-1 font-semibold text-slate-700">Cấu trúc file (1 cột):</p>
          <code className="text-xs text-slate-500">Tên khoa</code>
          <p className="mt-1 text-xs text-slate-400">Mỗi dòng là một khoa/viện. Tên trùng sẽ bị bỏ qua.</p>
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
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Tên khoa</th>
                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-1.5 text-slate-600">{err.row}</td>
                          <td className="px-3 py-1.5 text-slate-800">{err.faculty_name || '—'}</td>
                          <td className="px-3 py-1.5 text-rose-600">{err.message}</td>
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
            {submitting ? 'Đang nhập...' : 'Import khoa/viện'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

//  Download template 
const downloadTemplate = () => {
  const sample = [
    { 'Tên khoa': 'Công nghệ thông tin' },
    { 'Tên khoa': 'Điện - Điện tử' },
    { 'Tên khoa': 'Cơ khí' },
  ]
  const ws = XLSX.utils.json_to_sheet(sample)
  ws['!cols'] = [{ wch: 35 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Khoa')
  XLSX.writeFile(wb, 'mau_import_khoa_vien.xlsx')
}

//  Trang chính 
export default function FacultyManagement() {
  const [faculties, setFaculties]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [editing, setEditing]       = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const [importOpen, setImportOpen]         = useState(false)
  const [importFile, setImportFile]         = useState(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importResult, setImportResult]     = useState(null)
  const [importedRows, setImportedRows]     = useState([])

  const fetchFaculties = async () => {
    setLoading(true)
    try {
      const data = await facultyService.list()
      setFaculties(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách khoa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFaculties() }, [])

  const filtered = faculties.filter((f) =>
    f.facultyName.toLowerCase().includes(search.trim().toLowerCase())
  )

  //  Mở dialog thêm / sửa 
  const openCreate  = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit    = (f) => { setEditing(f); setForm({ facultyName: f.facultyName }); setDialogOpen(true) }
  const closeDialog = (open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyForm) } }

  //  Lưu (tạo hoặc cập nhật) 
  const handleSubmit = async () => {
    if (!form.facultyName.trim()) { toast.error('Vui lòng nhập tên khoa/viện'); return }
    setSubmitting(true)
    try {
      if (editing) {
        await facultyService.update(editing.id, { facultyName: form.facultyName })
        toast.success('Cập nhật khoa thành công')
      } else {
        await facultyService.create({ facultyName: form.facultyName })
        toast.success('Thêm khoa thành công')
      }
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
      fetchFaculties()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu khoa thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  //  Xóa 
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await facultyService.remove(deleteTarget.id)
      toast.success('Đã xóa khoa')
      setDeleteTarget(null)
      fetchFaculties()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa khoa thất bại')
      setDeleteTarget(null)
    }
  }

  //  Import Excel 
  const openImport  = () => { setImportOpen(true); setImportFile(null); setImportResult(null); setImportedRows([]) }
  const closeImport = (open) => {
    setImportOpen(open)
    if (!open) { setImportFile(null); setImportResult(null); setImportedRows([]) }
  }

  const handleImport = async () => {
    if (!importFile) { toast.error('Vui lòng chọn file Excel'); return }
    setImportSubmitting(true)
    setImportResult(null)
    try {
      const data = await importFile.arrayBuffer()
      const wb   = XLSX.read(data, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      const records = rows
        .map((row) => ({
          faculty_name: String(
            row.faculty_name || row['Tên khoa'] || row['ten_khoa'] || row['Tên Khoa'] || ''
          ).trim(),
        }))
        .filter((r) => r.faculty_name)

      if (records.length === 0) {
        toast.error('File không có dữ liệu hợp lệ. Cần cột "Tên khoa".')
        setImportSubmitting(false)
        return
      }

      setImportedRows(records)
      const result = await facultyService.importFaculties(records)
      setImportResult(result)

      if (result.successCount > 0) fetchFaculties()
      if (result.errorCount === 0) {
        toast.success(`Đã import ${result.successCount} khoa/viện thành công`)
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
    const errRows = importResult.errors.map(({ row, faculty_name, message }) => ({
      'Dòng': row ?? '',
      'Tên khoa': faculty_name || importedRows[(row ?? 2) - 2]?.faculty_name || '',
      'Lỗi': message || '',
    }))
    const ws = XLSX.utils.json_to_sheet(errRows)
    ws['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
    XLSX.writeFile(wb, 'loi_import_khoa_vien.xlsx')
  }

  return (
    <div className="space-y-6">
      {/*  Card 1: Filter + Actions  */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý Khoa/Viện/Phòng ban</CardTitle>
          <CardDescription>Thêm, sửa, xóa và import danh sách khoa/viện trong hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Bộ lọc */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tên khoa/viện</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên khoa..."
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]">
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
              {search && (
                <Button type="button" variant="outline" onClick={() => setSearch('')} title="Xóa tìm kiếm">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Thêm khoa/viện
            </Button>
            <Button type="button" variant="outline" className="border-slate-400 bg-white text-slate-600 hover:bg-slate-50" onClick={downloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Tải file mẫu
            </Button>
            <Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={openImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {filtered.length} khoa/viện
          </Badge>
        </CardContent>
      </Card>

      {/*  Card 2: Bảng danh sách  */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách Khoa/Viện</CardTitle>
          <CardDescription>Kết quả tìm kiếm theo tên khoa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Tên khoa/viện</TableHead>
                  <TableHead className="w-px whitespace-nowrap">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-slate-500">
                      {search ? 'Không tìm thấy khoa phù hợp.' : 'Chưa có khoa/viện nào.'}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((f, idx) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-slate-900">{f.facultyName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" title="Sửa tên khoa" onClick={() => openEdit(f)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title="Xóa khoa" onClick={() => setDeleteTarget(f)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/*  Dialog thêm/sửa  */}
      <FacultyDialog
        isOpen={dialogOpen}
        onOpenChange={closeDialog}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        editing={editing}
      />

      {/*  Dialog import Excel  */}
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

      {/*  Dialog xác nhận xóa  */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khoa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa khoa <strong>{deleteTarget?.facultyName}</strong>?
              Không thể xóa nếu có giảng viên đang thuộc khoa này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
              Xóa khoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
