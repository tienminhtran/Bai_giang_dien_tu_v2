import { useCallback, useEffect, useState } from 'react'
import { useUrlState } from '@/hooks'
import { Edit, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import gradingRoundService from '@/services/gradingRoundService'
import courseService from '@/services/courseService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30'

const COUNCIL_TYPE_OPTIONS = [
  { value: 'evaluator', label: 'Hội đồng đánh giá' },
  { value: 'secretary', label: 'Thư ký' },
]
const COUNCIL_TYPE_LABELS = Object.fromEntries(COUNCIL_TYPE_OPTIONS.map((o) => [o.value, o.label]))

const STATUS_OPTIONS = [
  { value: 'forming',    label: 'Đang thành lập' },
  { value: 'active',     label: 'Đang chấm' },
  { value: 'finalizing', label: 'Đang tổng hợp' },
  { value: 'closed',     label: 'Đã đóng' },
]
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))
const STATUS_BADGE = {
  forming:    'bg-slate-100 text-slate-700 hover:bg-slate-100',
  active:     'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  finalizing: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  closed:     'bg-rose-100 text-rose-700 hover:bg-rose-100',
}

const emptyForm = {
  roundName: '', courseId: '', councilType: 'evaluator',
  criteriaTemplateId: '', status: 'forming', parentRoundId: '', note: '',
}

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

//  Dialog thêm / sửa
function RoundDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, isEdit, courses, templates, parentOptions }) {
  const set = (field) => (e) => onFormChange((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa đợt kiểm định' : 'Thêm đợt kiểm định'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Cập nhật thông tin đợt kiểm định.' : 'Nhập thông tin để tạo đợt kiểm định mới.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {/* Tên đợt */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Tên đợt kiểm định <span className="text-rose-500">*</span></label>
            <Input value={form.roundName} onChange={set('roundName')} placeholder="VD: Đợt kiểm định HK1 2025-2026" />
          </div>

          {/* Môn học */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Môn học <span className="text-rose-500">*</span></label>
            <select value={form.courseId} onChange={set('courseId')} className={SELECT_CLS}>
              <option value="">-- Chọn môn học --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
              ))}
            </select>
          </div>

          {/* Loại hội đồng */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Loại hội đồng <span className="text-rose-500">*</span></label>
            <select value={form.councilType} onChange={set('councilType')} className={SELECT_CLS}>
              {COUNCIL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Mẫu tiêu chí */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mẫu tiêu chí <span className="text-rose-500">*</span></label>
            <select value={form.criteriaTemplateId} onChange={set('criteriaTemplateId')} className={SELECT_CLS}>
              <option value="">-- Chọn mẫu tiêu chí --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.templateName}{t.isActive ? '' : ' (đã ẩn)'}</option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
            <select value={form.status} onChange={set('status')} className={SELECT_CLS}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Đợt cha (phúc khảo) */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Đợt cha (nếu là phúc khảo)</label>
            <select value={form.parentRoundId} onChange={set('parentRoundId')} className={SELECT_CLS}>
              <option value="">-- Không có --</option>
              {parentOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.roundName}</option>
              ))}
            </select>
          </div>

          {/* Ghi chú */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Ghi chú</label>
            <textarea
              value={form.note}
              onChange={set('note')}
              rows={2}
              placeholder="Ghi chú thêm (không bắt buộc)"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo đợt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const URL_DEFAULTS_GR = { page: 1, pageSize: PAGE_SIZE_OPTIONS[0] }

//  Trang chính
export default function GradingRoundManagement() {
  const { get, set, resetPage, searchParams } = useUrlState(URL_DEFAULTS_GR)
  const page     = Number(get('page'))     || 1
  const pageSize = Number(get('pageSize')) || PAGE_SIZE_OPTIONS[0]

  const [draftName,    setDraftName]    = useState(() => get('roundName'))
  const [draftCouncil, setDraftCouncil] = useState(() => get('councilType'))
  const [draftStatus,  setDraftStatus]  = useState(() => get('status'))
  const [refreshKey, setRefreshKey]     = useState(0)

  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)

  // dữ liệu cho dropdown
  const [courses, setCourses]     = useState([])
  const [templates, setTemplates] = useState([])
  const [allRounds, setAllRounds] = useState([])

  const [dialogOpen, setDialogOpen]             = useState(false)
  const [dialogForm, setDialogForm]             = useState(emptyForm)
  const [dialogSubmitting, setDialogSubmitting] = useState(false)
  const [editTarget, setEditTarget]             = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const totalPages = Math.max(Math.ceil(total / pageSize), 1)

  // Load dropdown data 1 lần
  useEffect(() => {
    courseService.list({ page: 1, pageSize: 1000 }).then(({ rows: r }) => setCourses(r)).catch(() => {})
    gradingRoundService.listTemplates().then(setTemplates).catch(() => {})
    gradingRoundService.list({ page: 1, pageSize: 1000 }).then(({ rows: r }) => setAllRounds(r)).catch(() => {})
  }, [refreshKey])

  // Fetch list
  useEffect(() => {
    const roundName   = searchParams.get('roundName')   || ''
    const councilType = searchParams.get('councilType') || ''
    const status      = searchParams.get('status')      || ''
    setLoading(true)
    gradingRoundService.list({ roundName, councilType, status, page, pageSize })
      .then(({ rows: data, total: count }) => { setRows(data); setTotal(count) })
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách đợt kiểm định'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, refreshKey])

  const afterMutation = useCallback(() => {
    resetPage()
    setRefreshKey((k) => k + 1)
  }, [resetPage])

  const refreshKeepPage = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleSearch = () => resetPage({ roundName: draftName.trim(), councilType: draftCouncil, status: draftStatus })
  const handleReset  = () => {
    setDraftName(''); setDraftCouncil(''); setDraftStatus('')
    resetPage({ roundName: '', councilType: '', status: '' })
  }

  const openAddDialog = () => { setEditTarget(null); setDialogForm(emptyForm); setDialogOpen(true) }

  const openEditDialog = (round) => {
    setEditTarget(round)
    setDialogForm({
      roundName:          round.roundName,
      courseId:           round.courseId,
      councilType:        round.councilType,
      criteriaTemplateId: round.criteriaTemplateId,
      status:             round.status,
      parentRoundId:      round.parentRoundId || '',
      note:               round.note || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!dialogForm.roundName.trim())      { toast.error('Vui lòng nhập tên đợt kiểm định'); return }
    if (!dialogForm.courseId)              { toast.error('Vui lòng chọn môn học'); return }
    if (!dialogForm.criteriaTemplateId)    { toast.error('Vui lòng chọn mẫu tiêu chí'); return }
    try {
      setDialogSubmitting(true)
      const isEdit = Boolean(editTarget)
      if (isEdit) {
        await gradingRoundService.update(editTarget.id, dialogForm)
        toast.success('Cập nhật đợt kiểm định thành công')
      } else {
        await gradingRoundService.create(dialogForm)
        toast.success('Tạo đợt kiểm định thành công')
      }
      setDialogOpen(false)
      isEdit ? refreshKeepPage() : afterMutation()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu đợt kiểm định thất bại')
    } finally {
      setDialogSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await gradingRoundService.remove(deleteTarget.id)
      toast.success('Đã xóa đợt kiểm định')
      setDeleteTarget(null)
      refreshKeepPage()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa đợt kiểm định thất bại')
      setDeleteTarget(null)
    }
  }

  // đợt cha hợp lệ: loại trừ chính nó khi sửa
  const parentOptions = allRounds.filter((r) => r.id !== editTarget?.id)

  //  Phân trang
  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  })()

  return (
    <div className="space-y-6">
      {/* Filter card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý đợt kiểm định</CardTitle>
          <CardDescription>Tra cứu, tạo mới, chỉnh sửa và xóa các đợt kiểm định (hội đồng chấm).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tên đợt</label>
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Nhập tên đợt" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Loại hội đồng</label>
              <select value={draftCouncil} onChange={(e) => setDraftCouncil(e.target.value)} className={SELECT_CLS}>
                <option value="">Tất cả</option>
                {COUNCIL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
              <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} className={SELECT_CLS}>
                <option value="">Tất cả</option>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" className="flex-1 bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} title="Xóa bộ lọc">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Thêm đợt kiểm định
            </Button>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {total} đợt
          </Badge>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách đợt kiểm định</CardTitle>
          <CardDescription>Kết quả lọc theo điều kiện tìm kiếm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Tên đợt</TableHead>
                  <TableHead className="whitespace-nowrap">Môn học</TableHead>
                  <TableHead className="whitespace-nowrap">Loại hội đồng</TableHead>
                  <TableHead className="whitespace-nowrap">Mẫu tiêu chí</TableHead>
                  <TableHead className="whitespace-nowrap">Đợt cha</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
                  <TableHead className="w-px whitespace-nowrap">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Không tìm thấy đợt kiểm định phù hợp.</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-slate-900">{r.roundName}</TableCell>
                    <TableCell className="text-slate-600">
                      {r.courseCode ? <><span className="font-mono text-xs">{r.courseCode}</span> — {r.courseName}</> : '—'}
                    </TableCell>
                    <TableCell className="text-slate-600">{COUNCIL_TYPE_LABELS[r.councilType] || r.councilType}</TableCell>
                    <TableCell className="text-slate-600">{r.criteriaTemplateName || '—'}</TableCell>
                    <TableCell className="text-slate-500">{r.parentRoundName || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`rounded-none ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-700'}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" title="Chỉnh sửa" onClick={() => openEditDialog(r)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" title="Xóa" onClick={() => setDeleteTarget(r)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
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
                onChange={(e) => resetPage({ pageSize: Number(e.target.value) })}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>/ trang — {total} đợt</span>
            </div>

            <Pagination className="w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) set({ page: page - 1 }) }} className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
                {pageNumbers.map((item, idx) => (
                  <PaginationItem key={`${item}-${idx}`}>
                    {item === '...'
                      ? <PaginationEllipsis />
                      : <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); set({ page: item }) }}>{item}</PaginationLink>}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) set({ page: page + 1 }) }} className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Dialog thêm / sửa */}
      <RoundDialog
        isOpen={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditTarget(null) }}
        form={dialogForm}
        onFormChange={setDialogForm}
        onSubmit={handleSubmit}
        submitting={dialogSubmitting}
        isEdit={!!editTarget}
        courses={courses}
        templates={templates}
        parentOptions={parentOptions}
      />

      {/* Dialog xác nhận xóa */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đợt kiểm định</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa đợt <strong>{deleteTarget?.roundName}</strong>?
              Không thể xóa nếu đợt đã có thành viên hội đồng hoặc đợt con (phúc khảo).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
              Xóa đợt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
