import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, LayoutGrid, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import gradingTemplateService from '@/services/gradingTemplateService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

const emptyForm = {
  templateName: '',
  description: '',
  totalMaxScore: 100,
  passScore: 70,
  isActive: true,
}

// Dialog thêm / sửa mẫu tiêu chí
function TemplateDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, title, description, submitLabel }) {
  const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Tên mẫu tiêu chí</label>
            <Input value={form.templateName} onChange={(e) => set('templateName', e.target.value)} placeholder="VD: Tiêu chí chấm bài giảng điện tử 2025" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Mô tả</label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả ngắn về mẫu tiêu chí" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Điểm tối đa</label>
            <Input type="number" min={1} value={form.totalMaxScore} onChange={(e) => set('totalMaxScore', e.target.value)} placeholder="VD: 100" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Điểm đạt</label>
            <Input type="number" min={0} value={form.passScore} onChange={(e) => set('passScore', e.target.value)} placeholder="VD: 70" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Trạng thái</label>
            <select value={form.isActive ? 'true' : 'false'} onChange={(e) => set('isActive', e.target.value === 'true')} className={SELECT_CLS}>
              <option value="true">Đang áp dụng</option>
              <option value="false">Ngừng áp dụng</option>
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

export default function CriteriaManagement() {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    gradingTemplateService.list()
      .then(setRows)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách mẫu tiêu chí'))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return rows
    return rows.filter((t) => t.templateName.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw))
  }, [rows, keyword])

  // Add
  const handleAdd = async () => {
    if (!addForm.templateName.trim()) { toast.error('Vui lòng nhập tên mẫu tiêu chí'); return }
    try {
      setAddSubmitting(true)
      await gradingTemplateService.create(addForm)
      toast.success('Tạo mẫu tiêu chí thành công')
      setAddOpen(false)
      setAddForm(emptyForm)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo mẫu tiêu chí thất bại')
    } finally {
      setAddSubmitting(false)
    }
  }

  // Edit
  const openEdit = (tpl) => {
    setEditId(tpl.id)
    setEditForm({
      templateName: tpl.templateName,
      description: tpl.description,
      totalMaxScore: tpl.totalMaxScore,
      passScore: tpl.passScore,
      isActive: tpl.isActive,
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.templateName.trim()) { toast.error('Vui lòng nhập tên mẫu tiêu chí'); return }
    try {
      setEditSubmitting(true)
      await gradingTemplateService.update(editId, editForm)
      toast.success('Cập nhật mẫu tiêu chí thành công')
      setEditOpen(false)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete
  const handleDelete = (tpl) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mẫu tiêu chí "${tpl.templateName}"?`)) return
    gradingTemplateService.delete(tpl.id)
      .then(() => { toast.success('Xóa mẫu tiêu chí thành công'); reload() })
      .catch((err) => toast.error(err?.response?.data?.message || 'Xóa thất bại'))
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý tiêu chí chấm</CardTitle>
          <CardDescription>Tạo và quản lý các mẫu tiêu chí (bộ tiêu chí) dùng để chấm bài giảng điện tử.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[2fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tìm kiếm</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Nhập tên mẫu tiêu chí" />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]">
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => { setAddForm(emptyForm); setAddOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Thêm mẫu tiêu chí
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
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách mẫu tiêu chí</CardTitle>
          <CardDescription>Nhấn biểu tượng lưới để xem chi tiết và quản lý các tiêu chí con.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên mẫu tiêu chí</TableHead>
                  <TableHead className="w-[260px]">Mô tả</TableHead>
                  <TableHead className="w-[110px]">Điểm tối đa</TableHead>
                  <TableHead className="w-[100px]">Điểm đạt</TableHead>
                  <TableHead className="w-[180px]">Người tạo</TableHead>
                  <TableHead className="w-[120px]">Ngày tạo</TableHead>
                  <TableHead className="w-[140px]">Trạng thái</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Chưa có mẫu tiêu chí nào.</TableCell></TableRow>
                ) : filtered.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium text-slate-900">{tpl.templateName}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-slate-600">{tpl.description || '—'}</TableCell>
                    <TableCell className="font-mono text-slate-700">{tpl.totalMaxScore}</TableCell>
                    <TableCell className="font-mono text-slate-700">{tpl.passScore}</TableCell>
                    <TableCell className="text-slate-600">
                      {tpl.createdByName
                        ? <span className="text-sm">{tpl.createdByCode ? <span className="font-medium">{tpl.createdByCode} — </span> : null}{tpl.createdByName}</span>
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(tpl.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={tpl.isActive
                        ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                        {tpl.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết tiêu chí" onClick={() => navigate(`/dashboard/admin/criteria/${tpl.id}/detail`, { state: { template: tpl } })}>
                        <LayoutGrid className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Sửa thông tin" onClick={() => openEdit(tpl)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Xóa mẫu" onClick={() => handleDelete(tpl)}>
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

      <TemplateDialog
        isOpen={addOpen}
        onOpenChange={(open) => { setAddOpen(open); if (!open) setAddForm(emptyForm) }}
        form={addForm}
        onFormChange={setAddForm}
        onSubmit={handleAdd}
        submitting={addSubmitting}
        title="Thêm mẫu tiêu chí"
        description="Nhập thông tin mẫu tiêu chí. Sau khi tạo, bạn có thể thêm các tiêu chí con trong trang chi tiết."
        submitLabel="Lưu mẫu tiêu chí"
      />

      <TemplateDialog
        isOpen={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setEditId(null) }}
        form={editForm}
        onFormChange={setEditForm}
        onSubmit={handleEdit}
        submitting={editSubmitting}
        title="Chỉnh sửa mẫu tiêu chí"
        description="Cập nhật thông tin mẫu tiêu chí."
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
