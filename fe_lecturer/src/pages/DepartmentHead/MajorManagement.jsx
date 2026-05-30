import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Lock, Pencil, Plus, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import majorService from '@/services/majorService'
import departmentHeadService from '@/services/departmentHeadService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ─────────────────────────────────────────────────────────────────────────────
// Dialog phân công GV vào chuyên ngành — chọn nhiều GV, CN khóa không chọn được
// ─────────────────────────────────────────────────────────────────────────────
function AssignLecturerDialog({ open, onClose, majors, onAssigned }) {
  const [selectedMajorId, setSelectedMajorId] = useState('')
  const [searchText, setSearchText]           = useState('')
  const [lecturers, setLecturers]             = useState([])
  const [lvLoading, setLvLoading]             = useState(false)
  const [selectedIds, setSelectedIds]         = useState(new Set())
  const [assigning, setAssigning]             = useState(false)
  const debounceRef = useRef(null)

  // Chỉ hiển thị chuyên ngành chưa khóa để chọn
  const unlockMajors = majors.filter((m) => !m.isLock)

  const loadLecturers = useCallback(async (keyword = '') => {
    setLvLoading(true)
    try {
      const { rows } = await departmentHeadService.listLecturers({ fullName: keyword, page: 1, pageSize: 100 })
      setLecturers(rows)
    } catch {
      toast.error('Không tải được danh sách giảng viên')
    } finally {
      setLvLoading(false)
    }
  }, [])

  // Debounce tìm kiếm
  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadLecturers(searchText.trim()), 300)
    return () => clearTimeout(debounceRef.current)
  }, [open, searchText, loadLecturers])

  // Reset khi mở/đóng
  useEffect(() => {
    if (!open) {
      setSelectedMajorId('')
      setSearchText('')
      setLecturers([])
      setSelectedIds(new Set())
    } else {
      // Mặc định chọn chuyên ngành đầu tiên chưa khóa
      if (unlockMajors.length > 0) setSelectedMajorId(unlockMajors[0].id)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === lecturers.length && lecturers.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(lecturers.map((l) => l.id)))
    }
  }

  const handleAssign = async () => {
    if (selectedIds.size === 0) { toast.error('Vui lòng chọn ít nhất một giảng viên'); return }
    if (!selectedMajorId) { toast.error('Vui lòng chọn chuyên ngành'); return }

    const selectedMajor = majors.find((m) => m.id === selectedMajorId)

    // Cảnh báo GV đã có chuyên ngành khác
    const withMajor = lecturers.filter((l) => selectedIds.has(l.id) && l.majorId && l.majorId !== selectedMajorId)
    if (withMajor.length > 0) {
      const names = withMajor.map((l) => `${l.lecturerCode} – ${l.fullName} (${l.majorName})`).join('\n')
      if (!window.confirm(
        `${withMajor.length} giảng viên dưới đây đã có chuyên ngành và sẽ bị chuyển sang chuyên ngành mới:\n\n${names}\n\nBạn có chắc chắn muốn tiếp tục?`
      )) return
    }

    setAssigning(true)
    let successCount = 0
    const errors = []

    for (const id of selectedIds) {
      try {
        await majorService.addMyLecturer(selectedMajorId, id)
        successCount++
      } catch (err) {
        const lec = lecturers.find((l) => l.id === id)
        errors.push(`${lec?.lecturerCode} ${lec?.fullName}: ${err?.response?.data?.message || 'Lỗi'}`)
      }
    }

    setAssigning(false)
    if (successCount > 0) toast.success(`Đã phân công ${successCount} giảng viên vào "${selectedMajor?.majorName}"`)
    if (errors.length > 0) toast.error(`${errors.length} thất bại:\n${errors.join('\n')}`)

    onAssigned?.()
    loadLecturers(searchText.trim())
    setSelectedIds(new Set())
  }

  const selectedMajor = majors.find((m) => m.id === selectedMajorId)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="!max-w-[960px] w-[96vw] p-0 gap-0 overflow-hidden rounded-xl">
        <div className="px-6 pt-5 pb-4 border-b border-slate-200">
          <DialogTitle className="text-lg font-bold text-[#08387F]">Phân công giảng viên vào chuyên ngành</DialogTitle>
          <p className="text-sm text-slate-500 mt-0.5">
            Chọn giảng viên ở cột trái → chọn chuyên ngành ở cột phải → nhấn <strong className="text-slate-700">Gán</strong>.
            Chuyên ngành đang khóa <span className="inline-flex items-center gap-0.5 text-red-500"><Lock className="h-3 w-3" /></span> không thể chọn.
          </p>
        </div>

        <div className="flex divide-x divide-slate-200" style={{ height: '62vh', minHeight: 320 }}>

          {/* CỘT TRÁI: danh sách giảng viên */}
          <div className="flex flex-col" style={{ width: '55%' }}>
            <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Danh sách giảng viên</p>
              <div className="flex gap-2">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo họ tên hoặc mã GV..."
                  className="flex-1 min-w-0 h-8 text-sm"
                />
                <Button type="button" size="sm" className="bg-[#08387F] text-white hover:bg-[#072f6a] shrink-0 h-8" onClick={() => loadLecturers(searchText.trim())} disabled={lvLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {lvLoading ? (
                <p className="py-10 text-center text-sm text-slate-400">Đang tải...</p>
              ) : lecturers.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Không có giảng viên phù hợp.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 text-slate-600 text-xs">
                      <th className="w-9 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === lecturers.length}
                          onChange={toggleAll}
                          className="rounded border-slate-300 accent-[#08387F]"
                        />
                      </th>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Mã GV</th>
                      <th className="px-3 py-2 text-left font-semibold">Họ tên</th>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Khoa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturers.map((lec) => {
                      const selected = selectedIds.has(lec.id)
                      return (
                        <tr
                          key={lec.id}
                          onClick={() => toggleSelect(lec.id)}
                          className={`border-b border-slate-100 cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelect(lec.id)}
                              className="rounded border-slate-300 accent-[#08387F]"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">{lec.lecturerCode}</td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800 block">{lec.fullName}</span>
                            {lec.majorName && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" /> {lec.majorName}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500 max-w-[120px]">
                            <span className="line-clamp-2">{lec.facultyName || '—'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500">
                Đã chọn <strong className="text-[#08387F]">{selectedIds.size}</strong> / {lecturers.length} giảng viên
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: chuyên ngành */}
          <div className="flex flex-col" style={{ width: '45%' }}>
            <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chuyên ngành mục tiêu</p>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {majors.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Không có chuyên ngành.</p>
              ) : (
                <ul>
                  {majors.map((m) => {
                    const active   = selectedMajorId === m.id
                    const locked   = m.isLock
                    return (
                      <li
                        key={m.id}
                        onClick={() => !locked && setSelectedMajorId(m.id)}
                        className={[
                          'px-4 py-3 border-b border-slate-100 flex items-center gap-3 transition-colors',
                          locked  ? 'opacity-50 cursor-not-allowed bg-slate-50' :
                          active  ? 'bg-[#08387F] cursor-pointer' :
                                    'hover:bg-slate-50 cursor-pointer',
                        ].join(' ')}
                      >
                        {locked ? (
                          <Lock className="shrink-0 h-4 w-4 text-red-400" />
                        ) : (
                          <span className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-white' : 'border-slate-300'}`}>
                            {active && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${active && !locked ? 'text-white' : 'text-slate-800'}`}>{m.majorName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {locked && (
                              <span className="text-xs text-red-500 font-medium">Đã khóa</span>
                            )}
                            <p className={`text-xs truncate ${active && !locked ? 'text-blue-200' : 'text-slate-400'}`}>{m.facultyName}</p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 shrink-0">
              {selectedMajor ? (
                <p className="text-xs">
                  <span className="text-slate-500">Đang chọn: </span>
                  <strong className="text-[#08387F]">{selectedMajor.majorName}</strong>
                </p>
              ) : (
                <p className="text-xs text-slate-400">Chưa chọn chuyên ngành</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white shrink-0">
          <p className="text-sm truncate mr-4">
            {selectedIds.size > 0 && selectedMajorId
              ? <span className="text-slate-600">Gán <strong className="text-slate-800">{selectedIds.size} GV</strong> → <strong className="text-[#08387F]">{selectedMajor?.majorName}</strong></span>
              : <span className="text-slate-400">Chọn giảng viên và chuyên ngành để bắt đầu</span>
            }
          </p>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
            <Button
              type="button"
              className="bg-[#08387F] text-white hover:bg-[#072f6a]"
              onClick={handleAssign}
              disabled={assigning || selectedIds.size === 0 || !selectedMajorId}
            >
              <Users className="mr-2 h-4 w-4" />
              {assigning ? 'Đang gán...' : `Gán${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Trang chính: Quản lý chuyên ngành — Trưởng khoa
// ─────────────────────────────────────────────────────────────────────────────
export default function DepartmentHeadMajorManagement() {
  const navigate = useNavigate()
  const [majors, setMajors]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [facultyName, setFacultyName] = useState('')

  // Dialog tạo
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newMajorName, setNewMajorName] = useState('')

  // Dialog sửa
  const [isEditOpen, setIsEditOpen]       = useState(false)
  const [editTarget, setEditTarget]       = useState(null)
  const [editMajorName, setEditMajorName] = useState('')

  // Dialog phân công (1 nút chung)
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  const fetchMajors = async () => {
    setLoading(true)
    try {
      const data = await majorService.listMine()
      setMajors(data)
      if (data[0]?.facultyName && !facultyName) setFacultyName(data[0].facultyName)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách chuyên ngành')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMajors() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newMajorName.trim()) { toast.error('Vui lòng nhập tên chuyên ngành'); return }
    setSubmitting(true)
    try {
      await majorService.createMine({ majorName: newMajorName.trim() })
      toast.success('Tạo chuyên ngành thành công')
      setIsCreateOpen(false)
      setNewMajorName('')
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo chuyên ngành thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (m) => {
    setEditTarget(m)
    setEditMajorName(m.majorName)
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editMajorName.trim()) { toast.error('Vui lòng nhập tên chuyên ngành'); return }
    setSubmitting(true)
    try {
      await majorService.updateMine(editTarget.id, { majorName: editMajorName.trim() })
      toast.success('Cập nhật chuyên ngành thành công')
      setIsEditOpen(false)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">
            Quản lý chuyên ngành
            {facultyName && <span className="ml-2 text-base font-semibold text-slate-500">— {facultyName}</span>}
          </CardTitle>
          <CardDescription>Tạo chuyên ngành và phân công giảng viên trong khoa bạn quản lý.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tạo chuyên ngành
            </Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setIsAssignOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Phân công giảng viên
            </Button>
          </div>
          <Separator />
        </CardContent>
      </Card>

      {/* Bảng chuyên ngành */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách chuyên ngành</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">STT</TableHead>
                  <TableHead>Tên chuyên ngành</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Số GV</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : majors.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Chưa có chuyên ngành nào trong khoa.</TableCell></TableRow>
                ) : majors.map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{m.majorName}</span>
                        {m.isLock && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                            <Lock className="h-3 w-3" /> Đã khóa
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 min-w-[2rem]">
                        {m.lecturerCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 whitespace-nowrap text-sm">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button" variant="outline" size="sm"
                          className="border-[#08387F] text-[#08387F] hover:bg-slate-50"
                          title="Xem danh sách giảng viên"
                          onClick={() => navigate(`/dashboard/department-head/majors/${m.id}`)}
                        >
                          <ChevronRight className="mr-1.5 h-3.5 w-3.5" /> Xem GV
                        </Button>
                        <Button
                          type="button" variant="outline" size="sm"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => openEdit(m)}
                          disabled={m.isLock}
                          title={m.isLock ? 'Chuyên ngành đang bị khóa' : 'Chỉnh sửa'}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
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

      {/* Dialog phân công giảng viên */}
      <AssignLecturerDialog
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        majors={majors}
        onAssigned={fetchMajors}
      />

      {/* Dialog sửa */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa chuyên ngành</DialogTitle>
            <DialogDescription>Cập nhật tên chuyên ngành trong khoa bạn quản lý.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-semibold">Tên chuyên ngành</label>
            <Input
              value={editMajorName}
              onChange={(e) => setEditMajorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              placeholder="VD: Kỹ thuật phần mềm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-amber-600 text-white hover:bg-amber-700" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tạo */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setNewMajorName('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo chuyên ngành mới</DialogTitle>
            <DialogDescription>Chuyên ngành sẽ được tạo trong khoa bạn đang quản lý.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-semibold">Tên chuyên ngành</label>
            <Input
              value={newMajorName}
              onChange={(e) => setNewMajorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="VD: Kỹ thuật phần mềm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo chuyên ngành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
