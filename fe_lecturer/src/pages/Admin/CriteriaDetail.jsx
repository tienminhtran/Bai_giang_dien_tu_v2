import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { ArrowLeft, Download, Edit, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import gradingTemplateService from '@/services/gradingTemplateService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

const emptyItem = {
  code: '',
  criteriaName: '',
  description: '',
  maxScore: '',
  weight: '',
  displayOrder: '',
  isRequired: true,
}

const truthy = (v) => {
  const s = String(v ?? '').trim().toLowerCase()
  return ['có', 'co', 'x', '1', 'true', 'yes', 'y'].includes(s)
}

// ── Dialog thêm / sửa 1 tiêu chí ──────────────────────────────────────────────
function ItemDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, title, submitLabel }) {
  const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Nhập thông tin tiêu chí chấm.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Mã tiêu chí</label>
            <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="VD: TC01" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Thứ tự hiển thị</label>
            <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} placeholder="VD: 1" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Tên tiêu chí</label>
            <Input value={form.criteriaName} onChange={(e) => set('criteriaName', e.target.value)} placeholder="VD: Nội dung chính xác, khoa học" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Mô tả</label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Diễn giải chi tiết tiêu chí" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Điểm tối đa</label>
            <Input type="number" min={0} step="0.01" value={form.maxScore} onChange={(e) => set('maxScore', e.target.value)} placeholder="VD: 10" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Trọng số (0–1, tùy chọn)</label>
            <Input type="number" min={0} max={1} step="0.0001" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="VD: 0.2" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Bắt buộc</label>
            <select value={form.isRequired ? 'true' : 'false'} onChange={(e) => set('isRequired', e.target.value === 'true')} className={SELECT_CLS}>
              <option value="true">Có</option>
              <option value="false">Không</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Dialog import Excel ───────────────────────────────────────────────────────
function ImportItemsDialog({ isOpen, onOpenChange, importFile, onFileChange, mode, onModeChange, onImport, submitting, onDownloadTemplate }) {
  const inputRef = useRef(null)
  const handleZoneClick = () => inputRef.current?.click()
  const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileChange(f) }
  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import tiêu chí bằng Excel</DialogTitle>
          <DialogDescription>Tải file mẫu, điền dữ liệu rồi upload. Tổng điểm các tiêu chí không vượt quá điểm tối đa của mẫu.</DialogDescription>
        </DialogHeader>

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
            : <div className="text-xs text-slate-400">Chưa có file nào được chọn</div>}
          <Input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-slate-700">Cột: Mã tiêu chí, Tên tiêu chí, Mô tả, Điểm tối đa, Trọng số, Thứ tự, Bắt buộc</p>
            <p className="text-xs text-slate-500">Cột “Bắt buộc”: nhập “có” / “không”.</p>
          </div>
          <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={onDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Tải file mẫu
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Chế độ import</label>
          <select value={mode} onChange={(e) => onModeChange(e.target.value)} className={SELECT_CLS}>
            <option value="append">Thêm vào danh sách hiện có (append)</option>
            <option value="replace">Ghi đè toàn bộ (replace) — chỉ khi mẫu chưa gắn đợt kiểm định</option>
          </select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onImport} disabled={submitting}>
            {submitting ? 'Đang nhập...' : 'Nhập tiêu chí'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CriteriaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [template, setTemplate] = useState(state?.template || null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Add / edit item
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [editItemId, setEditItemId] = useState(null)
  const [itemSubmitting, setItemSubmitting] = useState(false)

  // Import
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importMode, setImportMode] = useState('append')
  const [importSubmitting, setImportSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    gradingTemplateService.getOne(id)
      .then(setTemplate)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được mẫu tiêu chí'))
      .finally(() => setLoading(false))
  }, [id, refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const items = template?.items || []
  const usedScore = items.reduce((s, i) => s + (Number(i.maxScore) || 0), 0)
  const totalMax = Number(template?.totalMaxScore) || 0
  const remaining = Math.max(totalMax - usedScore, 0)

  // ── Add item ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItemId(null)
    setItemForm({ ...emptyItem, displayOrder: items.length + 1 })
    setItemDialogOpen(true)
  }

  const openEdit = (item) => {
    setEditItemId(item.id)
    setItemForm({
      code: item.code,
      criteriaName: item.criteriaName,
      description: item.description,
      maxScore: item.maxScore,
      weight: item.weight,
      displayOrder: item.displayOrder,
      isRequired: item.isRequired,
    })
    setItemDialogOpen(true)
  }

  const handleSubmitItem = async () => {
    if (!itemForm.code.trim() || !itemForm.criteriaName.trim()) { toast.error('Vui lòng nhập mã và tên tiêu chí'); return }
    if (itemForm.maxScore === '' || Number(itemForm.maxScore) <= 0) { toast.error('Điểm tối đa phải lớn hơn 0'); return }
    try {
      setItemSubmitting(true)
      if (editItemId) {
        await gradingTemplateService.updateItem(id, editItemId, itemForm)
        toast.success('Cập nhật tiêu chí thành công')
      } else {
        await gradingTemplateService.addItems(id, itemForm)
        toast.success('Thêm tiêu chí thành công')
      }
      setItemDialogOpen(false)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu tiêu chí thất bại')
    } finally {
      setItemSubmitting(false)
    }
  }

  const handleDeleteItem = (item) => {
    if (!window.confirm(`Xóa tiêu chí "${item.code} — ${item.criteriaName}"?`)) return
    gradingTemplateService.removeItem(id, item.id)
      .then(() => { toast.success('Xóa tiêu chí thành công'); reload() })
      .catch((err) => toast.error(err?.response?.data?.message || 'Xóa thất bại'))
  }

  // ── Import Excel ──────────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const sample = [
      { 'Mã tiêu chí': 'TC01', 'Tên tiêu chí': 'Nội dung chính xác, khoa học', 'Mô tả': 'Kiến thức đúng, cập nhật', 'Điểm tối đa': 30, 'Trọng số': 0.3, 'Thứ tự': 1, 'Bắt buộc': 'có' },
      { 'Mã tiêu chí': 'TC02', 'Tên tiêu chí': 'Hình thức trình bày', 'Mô tả': 'Bố cục, hình ảnh rõ ràng', 'Điểm tối đa': 20, 'Trọng số': 0.2, 'Thứ tự': 2, 'Bắt buộc': 'có' },
    ]
    const ws = XLSX.utils.json_to_sheet(sample)
    ws['!cols'] = [{ wch: 12 }, { wch: 32 }, { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TieuChi')
    XLSX.writeFile(wb, 'mau-import-tieu-chi.xlsx')
  }

  const openImport = () => { setImportOpen(true); setImportFile(null); setImportMode('append') }
  const closeImport = (open) => { setImportOpen(open); if (!open) setImportFile(null) }

  const handleImport = async () => {
    if (!importFile) { toast.error('Vui lòng chọn file Excel'); return }
    try {
      setImportSubmitting(true)
      const data = await importFile.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

      const mapped = raw.map((row) => ({
        code:         String(row['Mã tiêu chí'] ?? row.code ?? '').trim(),
        criteriaName: String(row['Tên tiêu chí'] ?? row.criteria_name ?? '').trim(),
        description:  String(row['Mô tả'] ?? row.description ?? '').trim(),
        maxScore:     row['Điểm tối đa'] ?? row.max_score ?? '',
        weight:       row['Trọng số'] ?? row.weight ?? '',
        displayOrder: row['Thứ tự'] ?? row.display_order ?? '',
        isRequired:   row['Bắt buộc'] === '' ? true : truthy(row['Bắt buộc']),
      })).filter((r) => r.code && r.criteriaName)

      if (mapped.length === 0) { toast.error('File không có dữ liệu hợp lệ (thiếu Mã/Tên tiêu chí)'); return }

      await gradingTemplateService.importItems(id, mapped, importMode)
      toast.success(`Đã import ${mapped.length} tiêu chí thành công`)
      setImportOpen(false)
      setImportFile(null)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import thất bại — kiểm tra lại dữ liệu file')
    } finally {
      setImportSubmitting(false)
    }
  }

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button type="button" className="transition-colors hover:text-[#08387F]" onClick={() => navigate('/dashboard/admin/criteria')}>
          Quản lý tiêu chí
        </button>
        <span>/</span>
        <span className="font-medium text-slate-800">Chi tiết mẫu tiêu chí</span>
      </div>

      {/* Header card */}
      <Card className="rounded-b-none border-b-0 border-slate-200 shadow-sm">
        <CardHeader className="pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl font-black leading-tight text-[#08387F]">
                {loading && !template ? '...' : (template?.templateName || 'Mẫu tiêu chí')}
              </CardTitle>
              {template?.description && <p className="max-w-2xl text-sm text-slate-600">{template.description}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Điểm tối đa: {totalMax}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Điểm đạt: {template?.passScore ?? '—'}</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Đã dùng: {usedScore}/{totalMax} (còn {remaining})</span>
                {template && (
                  <Badge className={template.isActive
                    ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : 'rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                    {template.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                  </Badge>
                )}
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#08387F]" onClick={() => navigate('/dashboard/admin/criteria')}>
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Items card */}
      <Card className="rounded-t-none border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Danh sách tiêu chí</CardTitle>
              <CardDescription>Quản lý các tiêu chí con của mẫu này.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Thêm tiêu chí
              </Button>
              <Button type="button" variant="outline" className="border-slate-400 bg-white text-slate-600 hover:bg-slate-50" onClick={downloadTemplate}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Tải file mẫu
              </Button>
              <Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={openImport}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">TT</TableHead>
                  <TableHead className="w-[100px]">Mã</TableHead>
                  <TableHead>Tên tiêu chí</TableHead>
                  <TableHead className="w-[240px]">Mô tả</TableHead>
                  <TableHead className="w-[100px]">Điểm tối đa</TableHead>
                  <TableHead className="w-[90px]">Trọng số</TableHead>
                  <TableHead className="w-[90px]">Bắt buộc</TableHead>
                  <TableHead className="w-[100px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Chưa có tiêu chí nào. Hãy thêm hoặc import từ Excel.</TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-500">{item.displayOrder}</TableCell>
                    <TableCell className="font-mono font-semibold text-slate-900">{item.code}</TableCell>
                    <TableCell>{item.criteriaName}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">{item.description || '—'}</TableCell>
                    <TableCell className="font-mono text-slate-700">{item.maxScore}</TableCell>
                    <TableCell className="font-mono text-slate-700">{item.weight === '' ? '—' : item.weight}</TableCell>
                    <TableCell>
                      <Badge className={item.isRequired
                        ? 'rounded-none bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'rounded-none bg-slate-100 text-slate-600 hover:bg-slate-100'}>
                        {item.isRequired ? 'Có' : 'Không'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon-sm" title="Sửa tiêu chí" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Xóa tiêu chí" onClick={() => handleDeleteItem(item)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ItemDialog
        isOpen={itemDialogOpen}
        onOpenChange={(open) => { setItemDialogOpen(open); if (!open) { setEditItemId(null); setItemForm(emptyItem) } }}
        form={itemForm}
        onFormChange={setItemForm}
        onSubmit={handleSubmitItem}
        submitting={itemSubmitting}
        title={editItemId ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí'}
        submitLabel={editItemId ? 'Lưu thay đổi' : 'Thêm tiêu chí'}
      />

      <ImportItemsDialog
        isOpen={importOpen}
        onOpenChange={closeImport}
        importFile={importFile}
        onFileChange={setImportFile}
        mode={importMode}
        onModeChange={setImportMode}
        onImport={handleImport}
        submitting={importSubmitting}
        onDownloadTemplate={downloadTemplate}
      />
    </div>
  )
}
