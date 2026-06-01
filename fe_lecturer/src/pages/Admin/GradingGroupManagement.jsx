import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Eye, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import assessmentSessionService from '@/services/assessmentSessionService'
import gradingRoundService from '@/services/gradingRoundService'
import gradingGroupService from '@/services/gradingGroupService'
import userRoleService from '@/services/userRoleService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

const GROUP_STATUS = {
  forming: { label: 'Đang lập',      badge: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  active:  { label: 'Đang hoạt động', badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  closed:  { label: 'Đã đóng',       badge: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
}

const ROUND_STATUS_LABEL = { forming: 'Đang lập', active: 'Đang chấm', finalizing: 'Đang tổng hợp', closed: 'Đã đóng' }

const MEMBER_ROLES = [
  { value: 'chair',     label: 'Chủ tịch' },
  { value: 'secretary', label: 'Thư ký' },
  { value: 'member',    label: 'Ủy viên' },
]
const ROLE_LABEL = { chair: 'Chủ tịch', secretary: 'Thư ký', member: 'Ủy viên' }
const ROLE_BADGE = { chair: 'bg-violet-100 text-violet-700', secretary: 'bg-amber-100 text-amber-700', member: 'bg-sky-100 text-sky-700' }

//  Modal tạo nhóm theo nhiều khoa 
function CreateGroupDialog({ isOpen, onOpenChange, faculties, facultyHasGroup, form, onFormChange, selected, onToggle, onAdd, onRemove, onSubmit, submitting }) {
  const [search, setSearch] = useState('')
  const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))

  const available = faculties.filter((f) => f.facultyName.toLowerCase().includes(search.trim().toLowerCase()))
  const selectedFaculties = faculties.filter((f) => selected.includes(f.id))

  const handleDrop = (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id && !facultyHasGroup.has(id)) onAdd(id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tạo nhóm chấm theo khoa</DialogTitle>
          <DialogDescription>Nhập thông tin nhóm, chọn (tick hoặc kéo) các khoa cần lập nhóm. Mỗi khoa tạo 1 nhóm.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          {/* Cột trái — thông tin nhóm + khoa đã chọn */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên nhóm (tiền tố)</label>
              <Input value={form.groupName} onChange={(e) => set('groupName', e.target.value)} placeholder="VD: Hội đồng chấm sơ khảo" />
              <p className="text-xs text-slate-400">Tên cuối = “tiền tố - tên khoa”. Để trống sẽ dùng “Hội đồng chấm - tên khoa”.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Trạng thái</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={SELECT_CLS}>
                {Object.entries(GROUP_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Ghi chú</label>
              <Input value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Ghi chú (tùy chọn)" />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="min-h-[160px] rounded-xl border-2 border-dashed border-[#08387F]/30 bg-[#08387F]/5 p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#08387F]">Khoa đã chọn ({selectedFaculties.length})</p>
              {selectedFaculties.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-slate-400">Kéo khoa vào đây hoặc tick chọn ở cột bên phải.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedFaculties.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-[#08387F]/20">
                      {f.facultyName}
                      <button type="button" onClick={() => onRemove(f.id)} className="rounded-full text-slate-400 hover:text-rose-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cột phải — danh sách khoa */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Danh sách khoa</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khoa..." />
            <div className="max-h-[320px] space-y-1 overflow-auto rounded-xl border border-slate-200 p-2">
              {available.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Không có khoa phù hợp.</p>
              ) : available.map((f) => {
                const hasGroup = facultyHasGroup.has(f.id)
                const checked = selected.includes(f.id)
                return (
                  <div
                    key={f.id}
                    draggable={!hasGroup}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', f.id)}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                      hasGroup ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                        : checked ? 'cursor-grab border-[#08387F]/40 bg-[#08387F]/5' : 'cursor-grab border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <label className="flex flex-1 items-center gap-2.5">
                      <input type="checkbox" checked={checked} disabled={hasGroup} onChange={() => onToggle(f.id)} className="h-4 w-4 accent-[#08387F]" />
                      <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{f.facultyName}</span>
                    </label>
                    {hasGroup
                      ? <span className="shrink-0 text-xs text-slate-400">đã có nhóm</span>
                      : !checked && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang tạo...' : `Tạo nhóm (${selected.length} khoa)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

//  Dialog chi tiết nhóm + thành viên 
function GroupDetailDialog({ isOpen, onOpenChange, group, lecturers, onAddMember, onRemoveMember, busy }) {
  const [lecturerId, setLecturerId] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [positionTitle, setPositionTitle] = useState('')

  useEffect(() => { if (!isOpen) { setLecturerId(''); setMemberRole('member'); setPositionTitle('') } }, [isOpen])

  if (!group) return null
  const st = GROUP_STATUS[group.status] || { label: group.status, badge: 'bg-slate-100 text-slate-700' }
  const memberLecturerIds = new Set(group.members.map((m) => m.lecturerId))
  const availableLecturers = lecturers.filter((l) => !memberLecturerIds.has(l.id))

  const handleAdd = () => {
    if (!lecturerId) { toast.error('Vui lòng chọn giảng viên'); return }
    onAddMember({ lecturerId, memberRole, positionTitle })
    setLecturerId(''); setPositionTitle(''); setMemberRole('member')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {group.groupName}
            <Badge className={`rounded-none ${st.badge}`}>{st.label}</Badge>
          </DialogTitle>
          <DialogDescription>Khoa: {group.facultyName || '—'} {group.note ? `• ${group.note}` : ''}</DialogDescription>
        </DialogHeader>

        {/* Thêm thành viên */}
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.6fr_1fr_1.2fr_auto]">
          <select value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} className={SELECT_CLS}>
            <option value="">-- Chọn giảng viên --</option>
            {availableLecturers.map((l) => (
              <option key={l.id} value={l.id}>{l.lecturerCode} — {l.fullName}{l.facultyName ? ` (${l.facultyName})` : ''}</option>
            ))}
          </select>
          <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className={SELECT_CLS}>
            {MEMBER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} placeholder="Chức danh (tùy chọn)" />
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleAdd} disabled={busy}>
            <UserPlus className="mr-2 h-4 w-4" /> Thêm
          </Button>
        </div>

        <div className="w-full overflow-x-auto rounded-none border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">STT</TableHead>
                <TableHead className="w-[120px]">Mã GV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead className="w-[120px]">Vai trò</TableHead>
                <TableHead className="w-[160px]">Chức danh</TableHead>
                <TableHead className="w-[70px]">Xóa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.members.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-6 text-center text-slate-500">Chưa có thành viên. Hãy thêm ở trên.</TableCell></TableRow>
              ) : group.members.map((m, idx) => (
                <TableRow key={m.id}>
                  <TableCell className="text-slate-500">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{m.lecturerCode}</TableCell>
                  <TableCell>{m.lecturerName}</TableCell>
                  <TableCell><Badge className={`rounded-none ${ROLE_BADGE[m.memberRole] || 'bg-slate-100 text-slate-700'}`}>{ROLE_LABEL[m.memberRole] || m.memberRole}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600">{m.positionTitle || '—'}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" title="Xóa thành viên" onClick={() => onRemoveMember(m.id)} disabled={busy}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignMembersModal({
  isOpen,
  onOpenChange,
  round,
  groups,
  faculties,
  lecturers,
  roleOptions,
  lecturerRoleMap,
  occupiedLecturerIds,
  onSubmit,
  submitting,
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [keyword, setKeyword] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [selectedMembers, setSelectedMembers] = useState({})

  useEffect(() => {
    if (!isOpen) {
      setSelectedGroupIds([])
      setKeyword('')
      setFacultyFilter('')
      setUserRoleFilter('')
      setSelectedMembers({})
      return
    }
  }, [isOpen, groups])

  useEffect(() => {
    if (selectedGroupIds.length === 0) {
      setSelectedMembers({})
    }
  }, [selectedGroupIds])

  const facultyOptions = useMemo(() => {
    return faculties
      .map((f) => ({ id: f.id, name: f.facultyName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [faculties])

  const availableLecturers = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return lecturers.filter((l) => {
      if (occupiedLecturerIds.has(l.id) && !selectedMembers[l.id]) return false
      if (facultyFilter && l.facultyId !== facultyFilter) return false
      const roleNames = lecturerRoleMap[l.id] || []
      if (userRoleFilter && !roleNames.includes(userRoleFilter)) return false
      if (kw) {
        const haystack = `${l.lecturerCode || ''} ${l.fullName || ''} ${l.email || ''}`.toLowerCase()
        if (!haystack.includes(kw)) return false
      }
      return true
    })
  }, [lecturers, occupiedLecturerIds, selectedMembers, keyword, facultyFilter, userRoleFilter, lecturerRoleMap])

  const selectedCount = Object.keys(selectedMembers).length

  const toggleGroup = (groupId) => {
    setSelectedGroupIds((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId])
  }

  const toggleLecturer = (lecturer) => {
    if (selectedGroupIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 nhóm chấm trước')
      return
    }
    setSelectedMembers((prev) => {
      if (prev[lecturer.id]) {
        const next = { ...prev }
        delete next[lecturer.id]
        return next
      }
      return {
        ...prev,
        [lecturer.id]: { memberRole: 'member', positionTitle: '' },
      }
    })
  }

  const updateMemberField = (lecturerId, field, value) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [lecturerId]: {
        ...(prev[lecturerId] || { memberRole: 'member', positionTitle: '' }),
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    if (selectedGroupIds.length === 0) { toast.error('Vui lòng chọn ít nhất 1 nhóm chấm'); return }
    if (selectedCount === 0) { toast.error('Vui lòng chọn ít nhất 1 giảng viên'); return }

    const members = selectedGroupIds.flatMap((groupId) =>
      Object.entries(selectedMembers).map(([lecturerId, info]) => ({
        groupId,
        lecturerId,
        memberRole: info.memberRole || 'member',
        positionTitle: info.positionTitle || '',
      })),
    )

    onSubmit({ members })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Phân công chấm {round?.roundName || '—'}</DialogTitle>
          <DialogDescription>Chọn nhóm chấm và thêm danh sách giảng viên với vai trò/chức danh tương ứng.</DialogDescription>
          {/* đợt chấm  và vòng chấm*/}
          <DialogDescription className="mt-2 between:mx-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">Đợt kiểm định:</span> {round?.sessionName || '—'}
            <span className="mx-2"> </span>
            <span className="font-semibold text-slate-800">Vòng chấm:</span> {round?.roundName || '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nhóm chấm</label>
              <div className="max-h-[220px] space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                {groups.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">Chưa có nhóm chấm.</p>
                ) : groups.map((g) => {
                  const checked = selectedGroupIds.includes(g.id)
                  return (
                    <label key={g.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${checked ? 'bg-[#08387F]/10 text-[#08387F]' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.id)} className="h-4 w-4 accent-[#08387F]" />
                      <span className="truncate">{g.groupName} {g.facultyName ? `(${g.facultyName})` : ''}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Vòng chấm:</span> {round?.roundName || '—'}</p>
              <p><span className="font-semibold text-slate-800">Số nhóm hiện có:</span> {groups.length}</p>
              <p><span className="font-semibold text-slate-800">Nhóm đã chọn:</span> {selectedGroupIds.length}</p>
              <p><span className="font-semibold text-slate-800">Giảng viên đã chọn:</span> {selectedCount}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-500">
              Mỗi giảng viên được chọn cần có vai trò thành viên. Bạn có thể nhập chức danh riêng cho từng người ở cột phải.
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tên/mã giảng viên" />
              <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className={SELECT_CLS}>
                <option value="">Khoa/Viện</option>
                {facultyOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className={SELECT_CLS}>
                <option value="">Vai trò userrole</option>
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-auto rounded-xl border border-slate-200 p-2">
              {availableLecturers.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Không có giảng viên phù hợp.</p>
              ) : availableLecturers.map((l) => {
                const checked = Boolean(selectedMembers[l.id])
                const role = selectedMembers[l.id]?.memberRole || 'member'
                const title = selectedMembers[l.id]?.positionTitle || ''
                const roleNames = lecturerRoleMap[l.id] || []
                return (
                  <div key={l.id} className={`rounded-lg border p-2 ${checked ? 'border-[#08387F]/40 bg-[#08387F]/5' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={checked} onChange={() => toggleLecturer(l)} className="h-4 w-4 accent-[#08387F]" />
                      <span className="font-medium text-slate-900">{l.lecturerCode} - {l.fullName}</span>
                      <span className="text-slate-500">{l.facultyName ? `(${l.facultyName})` : ''}</span>
                    </label>

                    {roleNames.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">Userrole: {roleNames.join(', ')}</p>
                    )}

                    {checked && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.2fr]">
                        <select value={role} onChange={(e) => updateMemberField(l.id, 'memberRole', e.target.value)} className={SELECT_CLS}>
                          {MEMBER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <Input value={title} onChange={(e) => updateMemberField(l.id, 'positionTitle', e.target.value)} placeholder="position_title (tùy chọn)" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Đang lưu...' : `Lưu phân công (${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

//  Trang chính 
export default function GradingGroupManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') || ''
  const [sessions, setSessions] = useState([])
  const [rounds, setRounds] = useState([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [setup, setSetup] = useState({ round: null, groups: [], faculties: [], lecturers: [] })
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ groupName: '', status: 'forming', note: '' })
  const [selectedFaculties, setSelectedFaculties] = useState([])
  const [creating, setCreating] = useState(false)

  // Detail dialog
  const [detailGroupId, setDetailGroupId] = useState(null)
  const [memberBusy, setMemberBusy] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [roleOptions, setRoleOptions] = useState([])
  const [lecturerRoleMap, setLecturerRoleMap] = useState({})

  // Tải danh sách đợt kiểm định để người dùng chọn trên UI
  useEffect(() => {
    assessmentSessionService.list({ pageSize: 200 })
      .then(({ rows }) => setSessions(rows))
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách đợt kiểm định'))
  }, [])

  useEffect(() => {
    userRoleService.listAllRoles()
      .then((roles) => setRoleOptions((roles || []).map((r) => r.role_name).filter(Boolean)))
      .catch(() => setRoleOptions([]))
  }, [])

  useEffect(() => {
    if (!assignOpen) return
    const loadLecturerRoles = async () => {
      try {
        const { total } = await userRoleService.listLecturerRoles({ page: 1, pageSize: 1 })
        const size = Math.max(Number(total) || 1, 1)
        const { rows } = await userRoleService.listLecturerRoles({ page: 1, pageSize: size })
        const map = {}
        rows.forEach((row) => {
          map[row.id] = (row.roles || []).map((r) => r.role_name).filter(Boolean)
        })
        setLecturerRoleMap(map)
      } catch {
        setLecturerRoleMap({})
      }
    }
    loadLecturerRoles()
  }, [assignOpen])

  // Tải danh sách vòng chấm theo đợt kiểm định đang chọn
  useEffect(() => {
    if (!sessionId) {
      setRounds([])
      setSelectedRoundId('')
      setSetup({ round: null, groups: [], faculties: [], lecturers: [] })
      return
    }
    gradingRoundService.list({ sessionId, pageSize: 200 })
      .then(({ rows }) => {
        setRounds(rows)
        setSelectedRoundId((current) => {
          if (current && rows.some((round) => round.id === current)) return current
          const firstActive = rows.find((round) => round.status === 'active')
          return (firstActive || rows[0])?.id || ''
        })
      })
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách vòng chấm'))
  }, [sessionId])

  // Tải setup theo vòng chấm
  useEffect(() => {
    if (!selectedRoundId) { setSetup({ round: null, groups: [], faculties: [], lecturers: [] }); return }
    setLoading(true)
    gradingGroupService.getRoundSetup(selectedRoundId)
      .then(setSetup)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được dữ liệu nhóm chấm'))
      .finally(() => setLoading(false))
  }, [selectedRoundId, refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const facultyHasGroup = useMemo(() => new Set(setup.groups.map((g) => g.facultyId)), [setup.groups])
  const detailGroup = useMemo(() => setup.groups.find((g) => g.id === detailGroupId) || null, [setup.groups, detailGroupId])
  const occupiedLecturerIds = useMemo(() => new Set(setup.groups.flatMap((g) => g.members.map((m) => m.lecturerId))), [setup.groups])

  // Create modal handlers
  const openCreate = () => { setCreateForm({ groupName: '', status: 'forming', note: '' }); setSelectedFaculties([]); setCreateOpen(true) }
  const toggleFaculty = (id) => setSelectedFaculties((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const addFaculty = (id) => setSelectedFaculties((prev) => prev.includes(id) ? prev : [...prev, id])
  const removeFaculty = (id) => setSelectedFaculties((prev) => prev.filter((x) => x !== id))

  const handleCreate = async () => {
    if (!selectedRoundId) { toast.error('Chưa chọn vòng chấm'); return }
    if (selectedFaculties.length === 0) { toast.error('Vui lòng chọn ít nhất 1 khoa'); return }
    try {
      setCreating(true)
      const res = await gradingGroupService.bulkCreate({
        roundId: selectedRoundId,
        facultyIds: selectedFaculties,
        groupName: createForm.groupName,
        status: createForm.status,
        note: createForm.note,
      })
      toast.success(res.message || 'Tạo nhóm thành công')
      setCreateOpen(false)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo nhóm thất bại')
    } finally {
      setCreating(false)
    }
  }

  // Delete group
  const handleDeleteGroup = (g) => {
    if (!window.confirm(`Xóa nhóm "${g.groupName}"?`)) return
    gradingGroupService.delete(g.id)
      .then(() => { toast.success('Xóa nhóm thành công'); reload() })
      .catch((err) => toast.error(err?.response?.data?.message || 'Xóa thất bại'))
  }

  // Members
  const handleAddMember = async (payload) => {
    try {
      setMemberBusy(true)
      await gradingGroupService.addMember(detailGroupId, payload)
      toast.success('Thêm thành viên thành công')
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thêm thành viên thất bại')
    } finally {
      setMemberBusy(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      setMemberBusy(true)
      await gradingGroupService.removeMember(detailGroupId, memberId)
      toast.success('Đã xóa thành viên')
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thành viên thất bại')
    } finally {
      setMemberBusy(false)
    }
  }

  const handleAssignMembers = async ({ members }) => {
    try {
      setAssigning(true)
      let successCount = 0
      let failCount = 0
      let lastSuccessGroupId = ''
      for (const member of members) {
        try {
          const { groupId, ...payload } = member
          if (!groupId) {
            failCount += 1
            toast.error('Thiếu nhóm chấm cho một giảng viên được chọn')
            continue
          }
          await gradingGroupService.addMember(groupId, payload)
          successCount += 1
          lastSuccessGroupId = groupId
        } catch (err) {
          failCount += 1
          const msg = err?.response?.data?.message || `Không thêm được giảng viên ${member.lecturerId}`
          toast.error(msg)
        }
      }

      if (successCount > 0) {
        toast.success(`Đã phân công ${successCount} giảng viên${failCount ? `, lỗi ${failCount}` : ''}`)
        setAssignOpen(false)
        if (lastSuccessGroupId) setDetailGroupId(lastSuccessGroupId)
        reload()
      } else {
        toast.error('Không thể lưu phân công')
      }
    } finally {
      setAssigning(false)
    }
  }

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || null,
    [rounds, selectedRoundId],
  )

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === sessionId) || null,
    [sessions, sessionId],
  )

  const handleSessionChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('session_id', value)
      else next.delete('session_id')
      return next
    })
    setSelectedRoundId('')
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Lập Nhóm Hội đồng</CardTitle>
          <CardDescription>
            {sessionId
              ? 'Chọn vòng chấm thuộc đợt kiểm định hiện tại, tạo các nhóm hội đồng theo khoa và phân công thành viên.'
              : 'Chọn đợt kiểm định, rồi chọn vòng chấm để tạo các nhóm hội đồng theo khoa và phân công thành viên.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[2fr_2fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Đợt kiểm định</label>
              <select value={sessionId} onChange={(e) => handleSessionChange(e.target.value)} className={SELECT_CLS}>
                <option value="">-- Chọn đợt kiểm định --</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName} {session.academicTermLabel ? `(${session.academicTermLabel})` : ''}
                  </option>
                ))}
              </select>
            </div>
          <div className="grid gap-4 xl:grid-cols-[2fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Vòng chấm</label>
                <select value={selectedRoundId} onChange={(e) => setSelectedRoundId(e.target.value)} className={SELECT_CLS} disabled={!sessionId}>
                  <option value="">-- Chọn vòng chấm --</option>
                  {rounds.length === 0 && <option value="">-- Chưa có vòng chấm --</option>}
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      Vòng {r.roundNumber}: {r.roundName} [{ROUND_STATUS_LABEL[r.status] || r.status}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={openCreate} disabled={!selectedRoundId}>
                  <Plus className="mr-2 h-4 w-4" /> Tạo nhóm
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">Tổng nhóm: {setup.groups.length}</Badge>
            {setup.round?.facultyScopeName && (
              <Badge variant="secondary" className="rounded-none bg-blue-50 text-blue-700 hover:bg-blue-50">Phạm vi: {setup.round.facultyScopeName}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedRoundId ? (
        <Card className="border-dashed border-slate-300 bg-slate-50 shadow-sm">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="rounded-full bg-white p-3 text-[#08387F] shadow-sm ring-1 ring-slate-200">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">
                {sessionId ? 'Chọn vòng chấm để bắt đầu' : 'Chọn đợt kiểm định để bắt đầu'}
              </p>
              <p className="text-sm text-slate-500">
                {sessionId
                  ? (selectedSession
                      ? `Hệ thống đang lọc theo đợt ${selectedSession.sessionName}.`
                      : 'Hệ thống chỉ hiển thị các vòng chấm thuộc đợt kiểm định đã chọn.')
                  : 'Sau khi chọn đợt, hệ thống mới hiển thị danh sách nhóm và cho phép lập nhóm hội đồng.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">Danh sách nhóm chấm {selectedRound?.roundName || '—'}</CardTitle>
              <CardTitle className="text-sm text-slate-600">{selectedRound ? `ĐỢT KIỂM ĐỊNH ${selectedRound.sessionName}` : 'Đợt kiểm định đang chọn'}</CardTitle>    
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">Tổng nhóm: {setup.groups.length}</Badge>
                {setup.round?.facultyScopeName && (
                  <Badge variant="secondary" className="rounded-none bg-blue-50 text-blue-700 hover:bg-blue-50">Phạm vi: {setup.round.facultyScopeName}</Badge>
                )}
                <Button type="button" variant="outline" className="ml-auto text-green-500 hover:text-green-600 bg-green-100 hover:bg-green-200" onClick={openCreate} disabled={!selectedRoundId}>
                  <Plus className="mr-2 h-4 w-4" /> Nhóm chấm {selectedRound?.roundName || '—'}    
                </Button>

                {/* Tạo nhóm Thành viên chấm cho vòng Này */}
                <Button
                  type="button"
                  variant="outline"
                  className="text-blue-500 hover:text-blue-600 bg-blue-100 hover:bg-blue-200"
                  onClick={() => setAssignOpen(true)}
                  disabled={!selectedRoundId}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Phân công Chấm {selectedRound ? selectedRound.roundName : '—'}
                </Button>

              </div>

              <div className="w-full overflow-x-auto rounded-none border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên nhóm/Nhóm chấm/Khoa</TableHead>
                      <TableHead className="w-[220px]">Vòng chấm</TableHead>
                      <TableHead className="w-[220px]">Khoa kiểm định</TableHead>
                      <TableHead className="w-[110px]">Số Thành viên</TableHead>
                      <TableHead className="w-[140px]">Trạng thái</TableHead>
                      <TableHead className="w-[110px]">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : setup.groups.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Chưa có nhóm nào cho vòng chấm này.</TableCell></TableRow>
                    ) : setup.groups.map((g) => {
                      const st = GROUP_STATUS[g.status] || { label: g.status, badge: 'bg-slate-100 text-slate-700' }
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium text-slate-900">{g.groupName}</TableCell>
                          <TableCell className="text-slate-600">{g.roundName || '—'}</TableCell>
                          <TableCell className="text-slate-600">{g.facultyName || '—'}</TableCell>
                          <TableCell className="font-mono text-slate-700">{g.members.length}</TableCell>
                          <TableCell><Badge className={`rounded-none ${st.badge}`}>{st.label}</Badge></TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết" onClick={() => setDetailGroupId(g.id)}>
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon-sm" title="Xóa nhóm" onClick={() => handleDeleteGroup(g)}>
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

          <CreateGroupDialog
            isOpen={createOpen}
            onOpenChange={setCreateOpen}
            faculties={setup.faculties}
            facultyHasGroup={facultyHasGroup}
            form={createForm}
            onFormChange={setCreateForm}
            selected={selectedFaculties}
            onToggle={toggleFaculty}
            onAdd={addFaculty}
            onRemove={removeFaculty}
            onSubmit={handleCreate}
            submitting={creating}
          />

          <GroupDetailDialog
            isOpen={!!detailGroupId}
            onOpenChange={(open) => { if (!open) setDetailGroupId(null) }}
            group={detailGroup}
            lecturers={setup.lecturers}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            busy={memberBusy}
          />

          <AssignMembersModal
            isOpen={assignOpen}
            onOpenChange={setAssignOpen}
            round={selectedRound}
            groups={setup.groups}
            faculties={setup.faculties}
            lecturers={setup.lecturers}
            roleOptions={roleOptions}
            lecturerRoleMap={lecturerRoleMap}
            occupiedLecturerIds={occupiedLecturerIds}
            onSubmit={handleAssignMembers}
            submitting={assigning}
          />
        </>
      )}
    </div>
  )
}
