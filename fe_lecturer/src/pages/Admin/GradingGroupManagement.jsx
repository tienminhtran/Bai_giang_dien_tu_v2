import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeAlert, Building2, Eye, LayoutGrid, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import assessmentSessionService from '@/services/assessmentSessionService'
import gradingRoundService from '@/services/gradingRoundService'
import gradingGroupService from '@/services/gradingGroupService'
import gradingTeamService from '@/services/gradingTeamService'
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
const ROLE_VALUES = MEMBER_ROLES.map((r) => r.value) // ['chair','secretary','member']
// Mỗi hội đồng phải đủ 3 vai trò; Chủ tịch & Thư ký 1 người, Ủy viên không giới hạn
const ROLE_CAP = { chair: 1, secretary: 1, member: Infinity }

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

  // Hội đồng cần đủ 3 vai trò; Chủ tịch & Thư ký mỗi nhóm 1 người, Ủy viên không giới hạn
  const takenRoles = new Set((group?.members || []).map((m) => m.memberRole))
  const openRoles = MEMBER_ROLES.filter((r) => r.value === 'member' || !takenRoles.has(r.value))
  const missingRoles = ROLE_VALUES.filter((v) => !takenRoles.has(v))

  // Đảm bảo vai trò đang chọn luôn nằm trong các vai trò còn nhận thêm
  useEffect(() => {
    if (openRoles.length > 0 && !openRoles.some((r) => r.value === memberRole)) setMemberRole(openRoles[0].value)
  }, [group?.id, group?.members?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!group) return null
  const st = GROUP_STATUS[group.status] || { label: group.status, badge: 'bg-slate-100 text-slate-700' }
  const memberLecturerIds = new Set(group.members.map((m) => m.lecturerId))
  const availableLecturers = lecturers.filter((l) => !memberLecturerIds.has(l.id))

  // Chỉ cho xóa khi vai trò đó vẫn còn người khác → luôn giữ đủ 3 vai trò (phải ≥ 4 thành viên mới xóa được)
  const roleHolderCounts = group.members.reduce((acc, m) => { acc[m.memberRole] = (acc[m.memberRole] || 0) + 1; return acc }, {})
  const canRemoveMember = (m) => (roleHolderCounts[m.memberRole] || 0) > 1

  const handleAdd = () => {
    if (!lecturerId) { toast.error('Vui lòng chọn giảng viên'); return }
    onAddMember({ lecturerId, memberRole, positionTitle })
    setLecturerId(''); setPositionTitle(''); setMemberRole(openRoles[0]?.value || 'member')
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
        <div className="space-y-2">
          {missingRoles.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
              Hội đồng còn thiếu vai trò: {missingRoles.map((v) => ROLE_LABEL[v]).join(', ')}
            </div>
          )}
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.6fr_1fr_1.2fr_auto]">
            <select value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} className={SELECT_CLS}>
              <option value="">-- Chọn giảng viên --</option>
              {availableLecturers.map((l) => (
                <option key={l.id} value={l.id}>{l.lecturerCode} — {l.fullName}{l.facultyName ? ` (${l.facultyName})` : ''}</option>
              ))}
            </select>
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className={SELECT_CLS}>
              {openRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} placeholder="Chức danh (tùy chọn)" />
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleAdd} disabled={busy}>
              <UserPlus className="mr-2 h-4 w-4" /> Thêm
            </Button>
          </div>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title={canRemoveMember(m) ? 'Xóa thành viên' : 'Mỗi vai trò phải còn ít nhất 1 người — cần ≥ 4 thành viên mới xóa được'}
                      onClick={() => onRemoveMember(m.id)}
                      disabled={busy || !canRemoveMember(m)}
                    >
                      <Trash2 className={`h-4 w-4 ${canRemoveMember(m) ? 'text-red-500' : 'text-slate-300'}`} />
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

// ── Modal TẠO NHÓM CHẤM (bộ GV đủ 3 vai trò, chưa gắn hội đồng) ──────────────────
function CreateTeamModal({
  isOpen,
  onOpenChange,
  round,
  faculties,
  lecturers,
  roleOptions,
  lecturerRoleMap,
  occupiedLecturerIds,
  onSubmit,
  submitting,
}) {
  const [teamName, setTeamName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  // selectedMembers: { [lecturerId]: { memberRole, positionTitle } }
  const [selectedMembers, setSelectedMembers] = useState({})

  useEffect(() => {
    if (!isOpen) {
      setTeamName('')
      setKeyword('')
      setFacultyFilter('')
      setUserRoleFilter('')
      setSelectedMembers({})
    }
  }, [isOpen])

  const facultyOptions = useMemo(() => {
    return faculties
      .map((f) => ({ id: f.id, name: f.facultyName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [faculties])

  const availableLecturers = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return lecturers.filter((l) => {
      // GV đã thuộc nhóm/hội đồng khác trong vòng thì không cho chọn
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

  const rolesTaken = useMemo(() => {
    const taken = new Set()
    Object.values(selectedMembers).forEach((info) => { if (info.memberRole) taken.add(info.memberRole) })
    return taken
  }, [selectedMembers])

  const roleCountsExcept = (exceptLecturerId) => {
    const counts = { chair: 0, secretary: 0, member: 0 }
    Object.entries(selectedMembers).forEach(([lid, info]) => {
      if (lid === exceptLecturerId || !info.memberRole) return
      counts[info.memberRole] = (counts[info.memberRole] || 0) + 1
    })
    return counts
  }

  const toggleLecturer = (lecturer) => {
    setSelectedMembers((prev) => {
      if (prev[lecturer.id]) {
        const next = { ...prev }
        delete next[lecturer.id]
        return next
      }
      const counts = roleCountsExcept(lecturer.id)
      const memberRole = ROLE_VALUES.find((v) => counts[v] === 0) || 'member'
      return { ...prev, [lecturer.id]: { memberRole, positionTitle: '' } }
    })
  }

  const updateMemberField = (lecturerId, field, value) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [lecturerId]: { ...(prev[lecturerId] || { memberRole: 'member', positionTitle: '' }), [field]: value },
    }))
  }

  const handleSave = () => {
    if (!teamName.trim()) { toast.error('Vui lòng nhập tên nhóm chấm'); return }
    if (selectedCount === 0) { toast.error('Vui lòng chọn ít nhất 1 giảng viên'); return }

    const counts = roleCountsExcept(null)
    if (counts.chair !== 1)     { toast.error('Nhóm phải có đúng 1 Chủ tịch'); return }
    if (counts.secretary !== 1) { toast.error('Nhóm phải có đúng 1 Thư ký'); return }
    if (counts.member < 1)      { toast.error('Nhóm phải có ít nhất 1 Ủy viên'); return }

    const members = Object.entries(selectedMembers).map(([lecturerId, info]) => ({
      lecturerId,
      memberRole: info.memberRole || 'member',
      positionTitle: info.positionTitle || '',
    }))

    onSubmit({ teamName: teamName.trim(), members })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Tạo nhóm chấm — {round?.roundName || '—'}</DialogTitle>
          <DialogDescription>
            Tạo sẵn một bộ giảng viên đủ 3 vai trò (1 Chủ tịch, 1 Thư ký, ít nhất 1 Ủy viên). Nhóm chưa gắn hội đồng — sẽ phân công bằng kéo-thả sau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên nhóm chấm</label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="VD: Nhóm chấm số 1" />
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Vòng chấm:</span> {round?.roundName || '—'}</p>
              <p><span className="font-semibold text-slate-800">Giảng viên đã chọn:</span> {selectedCount} <span className="text-slate-400">(tối thiểu 3)</span></p>
            </div>

            <div className="space-y-1.5 rounded-md border border-slate-200 bg-white p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò trong nhóm</p>
              <div className="flex flex-wrap gap-1.5">
                {MEMBER_ROLES.map((r) => (
                  <Badge key={r.value} className={`rounded-none ${rolesTaken.has(r.value) ? ROLE_BADGE[r.value] : 'bg-slate-100 text-slate-400'}`}>
                    {rolesTaken.has(r.value) ? '✓ ' : '○ '}{r.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-500">
              Cần đủ 3 vai trò: 1 Chủ tịch, 1 Thư ký và ít nhất 1 Ủy viên (có thể thêm nhiều Ủy viên).
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
                const info = selectedMembers[l.id]
                const checked = Boolean(info)
                const role = info?.memberRole || 'member'
                const title = info?.positionTitle || ''
                const roleNames = lecturerRoleMap[l.id] || []
                const counts = checked ? roleCountsExcept(l.id) : { chair: 0, secretary: 0, member: 0 }
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
                          {MEMBER_ROLES.map((r) => {
                            const full = counts[r.value] >= ROLE_CAP[r.value]
                            return (
                              <option key={r.value} value={r.value} disabled={full}>
                                {r.label}{full ? ' (đã có)' : ''}
                              </option>
                            )
                          })}
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
            {submitting ? 'Đang lưu...' : `Tạo nhóm (${selectedCount} GV)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Modal PHÂN CÔNG (kéo nhóm chấm thả vào hội đồng) ─────────────────────────────
function AssignBoardModal({ isOpen, onOpenChange, round, groups, teams, onAssign, onDeleteTeam, busy }) {
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [dragGroupIds, setDragGroupIds] = useState([])
  const [overTeamId, setOverTeamId] = useState(null)

  // Hội đồng cần chấm = chưa có thành viên
  const emptyGroups = useMemo(() => groups.filter((g) => (g.members?.length || 0) === 0), [groups])

  // Bỏ chọn các hội đồng đã rời danh sách (sau khi gán) + reset khi đóng
  useEffect(() => {
    if (!isOpen) { setSelectedGroupIds([]); setDragGroupIds([]); setOverTeamId(null); return }
    const ids = new Set(emptyGroups.map((g) => g.id))
    setSelectedGroupIds((prev) => prev.filter((id) => ids.has(id)))
  }, [isOpen, emptyGroups])

  const toggleGroup = (id) => setSelectedGroupIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleDragStart = (group) => {
    // Kéo 1 hội đồng đã chọn → kéo cả nhóm đã chọn; ngược lại chỉ kéo hội đồng đó
    setDragGroupIds(selectedGroupIds.includes(group.id) ? selectedGroupIds : [group.id])
  }

  const dropOnTeam = (teamId) => {
    setOverTeamId(null)
    const ids = dragGroupIds
    setDragGroupIds([])
    if (teamId && ids.length) onAssign(teamId, ids)
  }

  const assignSelected = (teamId) => {
    if (selectedGroupIds.length === 0) { toast.error('Hãy chọn ít nhất 1 hội đồng cần chấm'); return }
    onAssign(teamId, selectedGroupIds)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Phân công chấm — {round?.roundName || '—'}</DialogTitle>
          <DialogDescription>
            Tick chọn 1 hoặc nhiều hội đồng cần chấm (bên trái) rồi kéo thả vào 1 nhóm chấm (bên phải) — hoặc bấm “Gán”. Một nhóm có thể chấm nhiều hội đồng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          {/* Cột trái — hội đồng cần chấm (draggable, multi-select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Hội đồng cần chấm ({emptyGroups.length})</label>
              {emptyGroups.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-[#08387F] hover:underline"
                  onClick={() => setSelectedGroupIds(selectedGroupIds.length === emptyGroups.length ? [] : emptyGroups.map((g) => g.id))}
                >
                  {selectedGroupIds.length === emptyGroups.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>
            <div className="max-h-[420px] space-y-2 overflow-auto rounded-xl border border-slate-200 p-2">
              {emptyGroups.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  {groups.length === 0 ? 'Chưa có hội đồng nào.' : 'Tất cả hội đồng đã được phân công.'}
                </p>
              ) : emptyGroups.map((g) => {
                const checked = selectedGroupIds.includes(g.id)
                return (
                  <div
                    key={g.id}
                    draggable={!busy}
                    onDragStart={() => handleDragStart(g)}
                    onDragEnd={() => setDragGroupIds([])}
                    className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 ${checked ? 'border-[#08387F]/50 bg-[#08387F]/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.id)} className="h-4 w-4 accent-[#08387F]" />
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="flex-1 truncate text-sm font-medium text-slate-900">{g.groupName}</span>
                    {g.facultyName && <span className="shrink-0 text-xs text-slate-500">{g.facultyName}</span>}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-400">Đã chọn {selectedGroupIds.length} hội đồng.</p>
          </div>

          {/* Cột phải — nhóm chấm (drop target) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nhóm chấm ({teams.length})</label>
            <div className="max-h-[420px] space-y-2 overflow-auto rounded-xl border border-slate-200 p-2">
              {teams.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Chưa có nhóm chấm. Hãy bấm “Tạo nhóm chấm”.</p>
              ) : teams.map((t) => (
                <div
                  key={t.id}
                  onDragOver={(e) => { e.preventDefault(); setOverTeamId(t.id) }}
                  onDragLeave={() => setOverTeamId((cur) => (cur === t.id ? null : cur))}
                  onDrop={(e) => { e.preventDefault(); dropOnTeam(t.id) }}
                  className={`rounded-lg border-2 border-dashed p-2 transition-colors ${overTeamId === t.id ? 'border-[#08387F] bg-[#08387F]/10' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm font-semibold text-slate-900">{t.teamName}</span>
                    {t.assignedCount > 0 && (
                      <Badge variant="secondary" className="rounded-none bg-emerald-50 text-emerald-700 hover:bg-emerald-50">đã chấm {t.assignedCount} HĐ</Badge>
                    )}
                    <Button type="button" size="sm" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => assignSelected(t.id)} disabled={busy || selectedGroupIds.length === 0}>
                      Gán {selectedGroupIds.length || ''}
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" title="Xóa nhóm" onClick={() => onDeleteTeam(t.id)} disabled={busy}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.members.map((m) => (
                      <Badge key={m.id} className={`rounded-none ${ROLE_BADGE[m.memberRole] || 'bg-slate-100 text-slate-700'}`}>
                        {ROLE_LABEL[m.memberRole] || m.memberRole}: {m.lecturerName || m.lecturerCode}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Thả hội đồng vào đây để phân công cho nhóm này</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
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
  const [setup, setSetup] = useState({ round: null, groups: [], faculties: [], lecturers: [], teams: [] })
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Create council (hội đồng theo khoa)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ groupName: '', status: 'forming', note: '' })
  const [selectedFaculties, setSelectedFaculties] = useState([])
  const [creating, setCreating] = useState(false)

  // Detail dialog
  const [detailGroupId, setDetailGroupId] = useState(null)
  const [memberBusy, setMemberBusy] = useState(false)

  // Nhóm chấm (team) + phân công kéo-thả
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [assignBoardOpen, setAssignBoardOpen] = useState(false)
  const [teamBusy, setTeamBusy] = useState(false)
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
    if (!createTeamOpen) return
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
  }, [createTeamOpen])

  // Tải danh sách vòng chấm theo đợt kiểm định đang chọn
  useEffect(() => {
    if (!sessionId) {
      setRounds([])
      setSelectedRoundId('')
      setSetup({ round: null, groups: [], faculties: [], lecturers: [], teams: [] })
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
    if (!selectedRoundId) { setSetup({ round: null, groups: [], faculties: [], lecturers: [], teams: [] }); return }
    setLoading(true)
    gradingGroupService.getRoundSetup(selectedRoundId)
      .then(setSetup)
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được dữ liệu nhóm chấm'))
      .finally(() => setLoading(false))
  }, [selectedRoundId, refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const facultyHasGroup = useMemo(() => new Set(setup.groups.map((g) => g.facultyId)), [setup.groups])
  const detailGroup = useMemo(() => setup.groups.find((g) => g.id === detailGroupId) || null, [setup.groups, detailGroupId])
  // GV đã thuộc 1 hội đồng (đã gán) hoặc 1 nhóm chấm chưa gán trong vòng này
  const occupiedLecturerIds = useMemo(() => new Set([
    ...setup.groups.flatMap((g) => g.members.map((m) => m.lecturerId)),
    ...(setup.teams || []).flatMap((t) => t.members.map((m) => m.lecturerId)),
  ]), [setup.groups, setup.teams])

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

  // Tạo nhóm chấm (bộ GV chưa gắn hội đồng)
  const handleCreateTeam = async ({ teamName, members }) => {
    if (!selectedRoundId) { toast.error('Chưa chọn vòng chấm'); return }
    try {
      setCreatingTeam(true)
      const res = await gradingTeamService.createTeam({ roundId: selectedRoundId, teamName, members })
      toast.success(res.message || 'Tạo nhóm chấm thành công')
      setCreateTeamOpen(false)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo nhóm chấm thất bại')
    } finally {
      setCreatingTeam(false)
    }
  }

  // Gán 1 nhóm chấm cho 1 hoặc nhiều hội đồng
  const handleAssignTeam = async (teamId, groupIds) => {
    const ids = Array.isArray(groupIds) ? groupIds : [groupIds]
    if (ids.length === 0) return
    try {
      setTeamBusy(true)
      let ok = 0, fail = 0
      for (const gid of ids) {
        try { await gradingTeamService.assignTeam(teamId, gid); ok += 1 }
        catch (err) { fail += 1; toast.error(err?.response?.data?.message || 'Phân công thất bại') }
      }
      if (ok > 0) toast.success(`Đã phân công ${ok} hội đồng${fail ? `, lỗi ${fail}` : ''}`)
      reload()
    } finally {
      setTeamBusy(false)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Xóa nhóm chấm này?')) return
    try {
      setTeamBusy(true)
      await gradingTeamService.delete(teamId)
      toast.success('Đã xóa nhóm chấm')
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa nhóm chấm thất bại')
    } finally {
      setTeamBusy(false)
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
              {/* <div className="flex items-end">
                <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={openCreate} disabled={!selectedRoundId}>
                  <Plus className="mr-2 h-4 w-4" /> Tạo nhóm
                </Button>
              </div> */}
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
                {setup.teams?.length > 0 && (
                  <Badge variant="secondary" className="rounded-none bg-violet-50 text-violet-700 hover:bg-violet-50">Nhóm chấm: {setup.teams.length}</Badge>
                )}
                <Button type="button" variant="outline" title="Chức năng này tạo hội đồng trên các Khoa/Viện để chấm bài giảng"className="ml-auto text-green-500 hover:text-green-600 bg-green-100 hover:bg-green-200" onClick={openCreate} disabled={!selectedRoundId}>
                  <Plus className="mr-2 h-4 w-4" /> Thành lập hội dồng
                </Button>

                {/* Tạo nhóm chấm (bộ GV chưa gắn hội đồng) */}
                <Button
                  type="button"
                  variant="outline"
                  className="text-violet-500 hover:text-violet-600 bg-violet-100 hover:bg-violet-200"
                  onClick={() => setCreateTeamOpen(true)}
                  disabled={!selectedRoundId}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Tạo nhóm Kiểm định viên
                </Button>

                {/* Phân công bằng kéo-thả */}
                <Button
                  type="button"
                  variant="outline"
                  className="text-blue-500 hover:text-blue-600 bg-blue-100 hover:bg-blue-200"
                  onClick={() => setAssignBoardOpen(true)}
                  disabled={!selectedRoundId}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Phân công Kiêm định viên vào hội đồng
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
                      <TableHead className="w-[140px]">Thành viên chấm</TableHead>
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
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {/* Vai trò và tên giảng viên */}
                              {g.members.map((m) => (
                                <Badge key={m.id} className={`rounded-none ${ROLE_BADGE[m.memberRole] || 'bg-slate-100 text-slate-700'}`}>
                                  {ROLE_LABEL[m.memberRole] || m.memberRole}: {m.lecturerName || m.lecturerCode}
                                </Badge>
                              ))}
                
                            </div>
                          </TableCell>
                          <TableCell><Badge className={`rounded-none ${st.badge}`}>{st.label}</Badge></TableCell>
                          <TableCell>
                            {/* Xem chi tiết */}
                            <Button type="button" variant="outline" size="sm" onClick={() => setDetailGroupId(g.id)}>
                              <LayoutGrid className="mr-1 h-4 w-4" />
                              Xem chi tiết
                            </Button>

                            <Button type="button" variant="ghost" size="icon-sm" title="Chức năng phân công riêng lẻ" onClick={() => setDetailGroupId(g.id)}>
                              <BadgeAlert className="h-4 w-4 text-blue-500" />
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

          <CreateTeamModal
            isOpen={createTeamOpen}
            onOpenChange={setCreateTeamOpen}
            round={selectedRound}
            faculties={setup.faculties}
            lecturers={setup.lecturers}
            roleOptions={roleOptions}
            lecturerRoleMap={lecturerRoleMap}
            occupiedLecturerIds={occupiedLecturerIds}
            onSubmit={handleCreateTeam}
            submitting={creatingTeam}
          />

          <AssignBoardModal
            isOpen={assignBoardOpen}
            onOpenChange={setAssignBoardOpen}
            round={selectedRound}
            groups={setup.groups}
            teams={setup.teams || []}
            onAssign={handleAssignTeam}
            onDeleteTeam={handleDeleteTeam}
            busy={teamBusy}
          />
        </>
      )}
    </div>
  )
}
