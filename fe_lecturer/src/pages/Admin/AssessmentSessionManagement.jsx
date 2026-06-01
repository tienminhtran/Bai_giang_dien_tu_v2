import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, LayoutGrid, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import assessmentSessionService from '@/services/assessmentSessionService'
import academicTermService from '@/services/academicTermService'
import gradingTemplateService from '@/services/gradingTemplateService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

export const SESSION_STATUS = {
  draft:  { label: 'Nháp',     badge: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  active: { label: 'Đang mở',  badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  closed: { label: 'Đã đóng',  badge: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
}

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

const emptyForm = {
  sessionName: '',
  description: '',
  academicTermId: '',
  criteriaTemplateId: '',
  startDate: '',
  endDate: '',
  status: 'draft',
}

// Dialog thêm / sửa đợt kiểm định
function SessionDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, terms, templates, title, description, submitLabel }) {
  const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Tên đợt kiểm định</label>
            <Input value={form.sessionName} onChange={(e) => set('sessionName', e.target.value)} placeholder="VD: Kiểm định bài giảng HK1 2025-2026" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Học kỳ <span className="text-rose-500">*</span></label>
            <select value={form.academicTermId} onChange={(e) => set('academicTermId', e.target.value)} className={SELECT_CLS}>
              <option value="">-- Chọn học kỳ --</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.academicYear} - HK{t.semester}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400">Chỉ hiển thị học kỳ đang hoạt động.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bộ tiêu chí <span className="text-rose-500">*</span></label>
            <select value={form.criteriaTemplateId} onChange={(e) => set('criteriaTemplateId', e.target.value)} className={SELECT_CLS}>
              <option value="">-- Chọn bộ tiêu chí --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.templateName}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400">Chỉ hiển thị bộ tiêu chí đang áp dụng.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Ngày bắt đầu</label>
            <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Ngày kết thúc</label>
            <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Mô tả</label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả ngắn về đợt kiểm định" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Trạng thái</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={SELECT_CLS}>
              {Object.entries(SESSION_STATUS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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

export default function AssessmentSessionManagement() {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [terms, setTerms] = useState([])
  const [templates, setTemplates] = useState([])

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Học kỳ đang hoạt động + bộ tiêu chí đang áp dụng (cho dropdown)
  useEffect(() => {
    academicTermService.list({ isActive: true, pageSize: 100 })
      .then(({ rows: r }) => setTerms(r.filter((t) => t.isActive)))
      .catch(() => {})
    gradingTemplateService.list({ activeOnly: true })
      .then((r) => setTemplates(r.filter((t) => t.isActive)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    assessmentSessionService.list({ pageSize: 200 })
      .then(({ rows: r }) => setRows(r))
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách đợt kiểm định'))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return rows.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false
      if (kw && !s.sessionName.toLowerCase().includes(kw)) return false
      return true
    })
  }, [rows, keyword, statusFilter])

  // Add
  const handleAdd = async () => {
    if (!addForm.sessionName.trim()) { toast.error('Vui lòng nhập tên đợt kiểm định'); return }
    if (!addForm.academicTermId) { toast.error('Vui lòng chọn học kỳ'); return }
    if (!addForm.criteriaTemplateId) { toast.error('Vui lòng chọn bộ tiêu chí'); return }
    if (!addForm.startDate || !addForm.endDate) { toast.error('Vui lòng chọn ngày bắt đầu và kết thúc'); return }
    try {
      setAddSubmitting(true)
      await assessmentSessionService.create(addForm)
      toast.success('Tạo đợt kiểm định thành công')
      setAddOpen(false)
      setAddForm(emptyForm)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo đợt kiểm định thất bại')
    } finally {
      setAddSubmitting(false)
    }
  }

  // Edit
  const openEdit = (s) => {
    setEditId(s.id)
    setEditForm({
      sessionName: s.sessionName,
      description: s.description,
      academicTermId: s.academicTermId,
      criteriaTemplateId: s.criteriaTemplateId,
      startDate: s.startDate ? String(s.startDate).slice(0, 10) : '',
      endDate: s.endDate ? String(s.endDate).slice(0, 10) : '',
      status: s.status,
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.sessionName.trim()) { toast.error('Vui lòng nhập tên đợt kiểm định'); return }
    try {
      setEditSubmitting(true)
      await assessmentSessionService.update(editId, editForm)
      toast.success('Cập nhật đợt kiểm định thành công')
      setEditOpen(false)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete
  const handleDelete = (s) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đợt kiểm định "${s.sessionName}"?`)) return
    assessmentSessionService.delete(s.id)
      .then(() => { toast.success('Xóa đợt kiểm định thành công'); reload() })
      .catch((err) => toast.error(err?.response?.data?.message || 'Xóa thất bại (đợt có thể đã có vòng chấm)'))
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý đợt kiểm định</CardTitle>
          <CardDescription>Tạo và quản lý các đợt kiểm định bài giảng điện tử theo học kỳ và bộ tiêu chí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tìm kiếm</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Nhập tên đợt kiểm định" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLS}>
                <option value="">Tất cả</option>
                {Object.entries(SESSION_STATUS).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]">
                <Search className="mr-2 h-4 w-4" /> Lọc
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => { setAddForm(emptyForm); setAddOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Thêm đợt kiểm định
            </Button>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {filtered.length}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách đợt kiểm định</CardTitle>
          <CardDescription>Nhấn biểu tượng lưới để xem chi tiết và thiết lập vòng chấm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đợt kiểm định</TableHead>
                  <TableHead className="w-[160px]">Học kỳ</TableHead>
                  <TableHead className="w-[200px]">Bộ tiêu chí</TableHead>
                  <TableHead className="w-[200px]">Thời gian</TableHead>
                  <TableHead className="w-[160px]">Người tạo</TableHead>
                  <TableHead className="w-[120px]">Trạng thái</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">Chưa có đợt kiểm định nào.</TableCell></TableRow>
                ) : filtered.map((s) => {
                  const st = SESSION_STATUS[s.status] || { label: s.status, badge: 'bg-slate-100 text-slate-700' }
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-900">{s.sessionName}</TableCell>
                      <TableCell className="text-slate-600">{s.academicTermLabel || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-600">{s.criteriaTemplateName || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(s.startDate)} → {formatDate(s.endDate)}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {s.createdByName ? <>{s.createdByCode ? <span className="font-medium">{s.createdByCode} — </span> : null}{s.createdByName}</> : '—'}
                      </TableCell>
                      <TableCell><Badge className={`rounded-none ${st.badge}`}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết" onClick={() => navigate(`/dashboard/admin/assessment-sessions/${s.id}/detail`, { state: { session: s } })}>
                          <LayoutGrid className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title="Sửa" onClick={() => openEdit(s)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title="Xóa" onClick={() => handleDelete(s)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SessionDialog
        isOpen={addOpen}
        onOpenChange={(open) => { setAddOpen(open); if (!open) setAddForm(emptyForm) }}
        form={addForm}
        onFormChange={setAddForm}
        onSubmit={handleAdd}
        submitting={addSubmitting}
        terms={terms}
        templates={templates}
        title="Thêm đợt kiểm định"
        description="Nhập thông tin đợt kiểm định. Sau khi tạo, vào chi tiết để thiết lập vòng chấm."
        submitLabel="Lưu đợt kiểm định"
      />

      <SessionDialog
        isOpen={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setEditId(null) }}
        form={editForm}
        onFormChange={setEditForm}
        onSubmit={handleEdit}
        submitting={editSubmitting}
        terms={terms}
        templates={templates}
        title="Chỉnh sửa đợt kiểm định"
        description="Cập nhật thông tin đợt kiểm định."
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
