import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import assessmentSessionService from '@/services/assessmentSessionService'
import gradingTemplateService from '@/services/gradingTemplateService'
import gradingRoundService from '@/services/gradingRoundService'
import facultyService from '@/services/facultyService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

const SESSION_STATUS = {
  draft:  { label: 'Nháp',    badge: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  active: { label: 'Đang mở', badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  closed: { label: 'Đã đóng', badge: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
}

const ROUND_STATUS = {
  forming:    { label: 'Đang lập',     badge: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  active:     { label: 'Đang chấm',    badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  finalizing: { label: 'Đang tổng hợp', badge: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  closed:     { label: 'Đã đóng',      badge: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
}

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

const TABS = [
  { key: 'info',     label: 'Thông tin đợt kiểm định' },
  { key: 'criteria', label: 'Bộ tiêu chí & câu hỏi' },
  { key: 'rounds',   label: 'Thiết lập vòng chấm' },
]

const emptyRound = {
  roundName: '',
  roundNumber: 1,
  facultyScopeId: '',
  status: 'forming',
  parentRoundId: '',
  note: '',
}

// ── Dialog thêm / sửa vòng chấm ───────────────────────────────────────────────
function RoundDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, faculties, rounds, editId, title, submitLabel }) {
  const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))
  const parentOptions = rounds.filter((r) => r.id !== editId)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Cấu hình vòng chấm trong đợt kiểm định này.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Tên vòng chấm</label>
            <Input value={form.roundName} onChange={(e) => set('roundName', e.target.value)} placeholder="VD: Vòng chấm sơ khảo" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Số thứ tự vòng</label>
            <Input type="number" min={1} value={form.roundNumber} onChange={(e) => set('roundNumber', e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Phạm vi khoa</label>
            <select value={form.facultyScopeId} onChange={(e) => set('facultyScopeId', e.target.value)} className={SELECT_CLS}>
              <option value="">Toàn trường</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Trạng thái</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={SELECT_CLS}>
              {Object.entries(ROUND_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Vòng cha (phúc khảo)</label>
            <select value={form.parentRoundId} onChange={(e) => set('parentRoundId', e.target.value)} className={SELECT_CLS}>
              <option value="">Không</option>
              {parentOptions.map((r) => <option key={r.id} value={r.id}>{r.roundName}</option>)}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold">Ghi chú</label>
            <Input value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Ghi chú (tùy chọn)" />
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

export default function AssessmentSessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [activeTab, setActiveTab] = useState('info')
  const [session, setSession] = useState(state?.session || null)
  const [loading, setLoading] = useState(true)

  // Tab 2
  const [template, setTemplate] = useState(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  // Tab 3
  const [rounds, setRounds] = useState([])
  const [roundsLoading, setRoundsLoading] = useState(false)
  const [faculties, setFaculties] = useState([])
  const [roundsRefresh, setRoundsRefresh] = useState(0)

  const [roundDialogOpen, setRoundDialogOpen] = useState(false)
  const [roundForm, setRoundForm] = useState(emptyRound)
  const [editRoundId, setEditRoundId] = useState(null)
  const [roundSubmitting, setRoundSubmitting] = useState(false)

  // Load session
  useEffect(() => {
    setLoading(true)
    assessmentSessionService.getOne(id)
      .then(setSession)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được đợt kiểm định'))
      .finally(() => setLoading(false))
  }, [id])

  // Tab 2: load criteria template (lazy)
  useEffect(() => {
    if (activeTab !== 'criteria' || !session?.criteriaTemplateId || template) return
    setTemplateLoading(true)
    gradingTemplateService.getOne(session.criteriaTemplateId)
      .then(setTemplate)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được bộ tiêu chí'))
      .finally(() => setTemplateLoading(false))
  }, [activeTab, session, template])

  // Tab 3: load faculties once
  useEffect(() => { facultyService.list().then(setFaculties).catch(() => {}) }, [])

  // Tab 3: load rounds
  useEffect(() => {
    if (activeTab !== 'rounds') return
    setRoundsLoading(true)
    gradingRoundService.list({ sessionId: id, pageSize: 200 })
      .then(({ rows }) => setRounds(rows))
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được vòng chấm'))
      .finally(() => setRoundsLoading(false))
  }, [activeTab, id, roundsRefresh])

  const reloadRounds = () => setRoundsRefresh((k) => k + 1)

  // Round CRUD
  const openAddRound = () => {
    setEditRoundId(null)
    setRoundForm({ ...emptyRound, roundNumber: rounds.length + 1 })
    setRoundDialogOpen(true)
  }

  const openEditRound = (r) => {
    setEditRoundId(r.id)
    setRoundForm({
      roundName: r.roundName,
      roundNumber: r.roundNumber,
      facultyScopeId: r.facultyScopeId,
      status: r.status,
      parentRoundId: r.parentRoundId,
      note: r.note,
    })
    setRoundDialogOpen(true)
  }

  const handleSubmitRound = async () => {
    if (!roundForm.roundName.trim()) { toast.error('Vui lòng nhập tên vòng chấm'); return }
    try {
      setRoundSubmitting(true)
      const payload = { ...roundForm, sessionId: id }
      if (editRoundId) {
        await gradingRoundService.update(editRoundId, payload)
        toast.success('Cập nhật vòng chấm thành công')
      } else {
        await gradingRoundService.create(payload)
        toast.success('Thêm vòng chấm thành công')
      }
      setRoundDialogOpen(false)
      reloadRounds()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu vòng chấm thất bại')
    } finally {
      setRoundSubmitting(false)
    }
  }

  const handleDeleteRound = (r) => {
    if (!window.confirm(`Xóa vòng chấm "${r.roundName}"?`)) return
    gradingRoundService.delete(r.id)
      .then(() => { toast.success('Xóa vòng chấm thành công'); reloadRounds() })
      .catch((err) => toast.error(err?.response?.data?.message || 'Xóa thất bại (vòng có thể đã có nhóm chấm)'))
  }

  const st = SESSION_STATUS[session?.status] || { label: session?.status, badge: 'bg-slate-100 text-slate-700' }

  const InfoRow = ({ label, value }) => (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-slate-800">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button type="button" className="transition-colors hover:text-[#08387F]" onClick={() => navigate('/dashboard/admin/assessment-sessions')}>
          Quản lý đợt kiểm định
        </button>
        <span>/</span>
        <span className="font-medium text-slate-800">Chi tiết đợt kiểm định</span>
      </div>

      {/* Header */}
      <Card className="rounded-b-none border-b-0 border-slate-200 shadow-sm">
        <CardHeader className="pb-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl font-black leading-tight text-[#08387F]">
                {loading && !session ? '...' : (session?.sessionName || 'Đợt kiểm định')}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {session?.academicTermLabel && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{session.academicTermLabel}</span>}
                <Badge className={`rounded-full ${st.badge}`}>{st.label}</Badge>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#08387F]" onClick={() => navigate('/dashboard/admin/assessment-sessions')}>
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </div>

          {/* Tabs */}
          <div className="-mx-6 border-t border-slate-200 px-6">
            <div className="block py-2 sm:hidden">
              <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08387F]/30">
                {TABS.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
              </select>
            </div>
            <div className="hidden sm:flex">
              {TABS.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === tab.key ? 'border-[#08387F] text-[#08387F]' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}>
                  {tab.label}
                  {tab.key === 'rounds' && rounds.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{rounds.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab 1 — Thông tin đợt kiểm định */}
      {activeTab === 'info' && (
        <Card className="rounded-t-none border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                className="bg-[#08387F] text-white hover:bg-[#072f6a]"
                onClick={() => navigate(`/dashboard/admin/grading-round-members?session_id=${id}`)}
              >
                Lập nhóm hội đồng
              </Button>
            </div>

            {loading && !session ? (
              <p className="py-10 text-center text-sm text-slate-400">Đang tải...</p>
            ) : !session ? (
              <p className="py-10 text-center text-sm text-slate-400">Không tìm thấy đợt kiểm định.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1 lg:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tên đợt kiểm định</p>
                  <p className="font-semibold text-slate-900">{session.sessionName}</p>
                </div>
                <InfoRow label="Trạng thái" value={st.label} />
                <InfoRow label="Học kỳ" value={session.academicTermLabel} />
                <InfoRow label="Bộ tiêu chí" value={session.criteriaTemplateName} />
                <InfoRow label="Người tạo" value={session.createdByName ? `${session.createdByCode ? session.createdByCode + ' — ' : ''}${session.createdByName}` : '—'} />
                <InfoRow label="Ngày bắt đầu" value={formatDate(session.startDate)} />
                <InfoRow label="Ngày kết thúc" value={formatDate(session.endDate)} />
                <InfoRow label="Ngày tạo" value={formatDate(session.createdAt)} />
                {session.description && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mô tả</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{session.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2 — Bộ tiêu chí & câu hỏi */}
      {activeTab === 'criteria' && (
        <Card className="rounded-t-none border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            {!session?.criteriaTemplateId ? (
              <p className="py-10 text-center text-sm text-slate-400">Đợt kiểm định chưa gắn bộ tiêu chí.</p>
            ) : templateLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">Đang tải bộ tiêu chí...</p>
            ) : !template ? (
              <p className="py-10 text-center text-sm text-slate-400">Không tải được bộ tiêu chí.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{template.templateName}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Điểm tối đa: {template.totalMaxScore}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Điểm đạt: {template.passScore}</span>
                </div>
                {template.description && <p className="text-sm text-slate-600">{template.description}</p>}

                <div className="w-full overflow-x-auto rounded-none border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">TT</TableHead>
                        <TableHead className="w-[100px]">Mã</TableHead>
                        <TableHead>Tên tiêu chí</TableHead>
                        <TableHead className="w-[260px]">Mô tả</TableHead>
                        <TableHead className="w-[100px]">Điểm tối đa</TableHead>
                        <TableHead className="w-[90px]">Trọng số</TableHead>
                        <TableHead className="w-[90px]">Bắt buộc</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {template.items.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">Bộ tiêu chí chưa có câu hỏi.</TableCell></TableRow>
                      ) : template.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="text-slate-500">{it.displayOrder}</TableCell>
                          <TableCell className="font-mono font-semibold text-slate-900">{it.code}</TableCell>
                          <TableCell>{it.criteriaName}</TableCell>
                          <TableCell className="max-w-[260px] truncate text-slate-600">{it.description || '—'}</TableCell>
                          <TableCell className="font-mono text-slate-700">{it.maxScore}</TableCell>
                          <TableCell className="font-mono text-slate-700">{it.weight === '' ? '—' : it.weight}</TableCell>
                          <TableCell>
                            <Badge className={it.isRequired ? 'rounded-none bg-blue-100 text-blue-700 hover:bg-blue-100' : 'rounded-none bg-slate-100 text-slate-600 hover:bg-slate-100'}>
                              {it.isRequired ? 'Có' : 'Không'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-slate-400">Bộ tiêu chí chỉ xem ở đây. Để chỉnh sửa, vào trang Quản lý tiêu chí chấm.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3 — Thiết lập vòng chấm */}
      {activeTab === 'rounds' && (
        <Card className="rounded-t-none border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Vòng chấm</CardTitle>
                <CardDescription>Thiết lập các vòng chấm cho đợt kiểm định này.</CardDescription>
              </div>
              <Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={openAddRound}>
                <Plus className="mr-2 h-4 w-4" /> Thêm vòng chấm
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-none border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Vòng</TableHead>
                    <TableHead>Tên vòng chấm</TableHead>
                    <TableHead className="w-[180px]">Phạm vi khoa</TableHead>
                    <TableHead className="w-[160px]">Vòng cha</TableHead>
                    <TableHead className="w-[130px]">Trạng thái</TableHead>
                    <TableHead className="w-[100px]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roundsLoading ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                  ) : rounds.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Chưa có vòng chấm nào.</TableCell></TableRow>
                  ) : rounds.map((r) => {
                    const rst = ROUND_STATUS[r.status] || { label: r.status, badge: 'bg-slate-100 text-slate-700' }
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-slate-500">{r.roundNumber}</TableCell>
                        <TableCell className="font-medium text-slate-900">{r.roundName}</TableCell>
                        <TableCell className="text-slate-600">{r.facultyScopeName || 'Toàn trường'}</TableCell>
                        <TableCell className="text-slate-600">{r.parentRoundName || '—'}</TableCell>
                        <TableCell><Badge className={`rounded-none ${rst.badge}`}>{rst.label}</Badge></TableCell>
                        <TableCell>
                          {/* Phân công */}
                          <Button type="button" variant="ghost" size="icon-sm" title="Sửa vòng chấm" onClick={() => openEditRound(r)}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" title="Xóa vòng chấm" onClick={() => handleDeleteRound(r)}>
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
      )}

      <RoundDialog
        isOpen={roundDialogOpen}
        onOpenChange={(open) => { setRoundDialogOpen(open); if (!open) { setEditRoundId(null); setRoundForm(emptyRound) } }}
        form={roundForm}
        onFormChange={setRoundForm}
        onSubmit={handleSubmitRound}
        submitting={roundSubmitting}
        faculties={faculties}
        rounds={rounds}
        editId={editRoundId}
        title={editRoundId ? 'Chỉnh sửa vòng chấm' : 'Thêm vòng chấm'}
        submitLabel={editRoundId ? 'Lưu thay đổi' : 'Thêm vòng chấm'}
      />
    </div>
  )
}
