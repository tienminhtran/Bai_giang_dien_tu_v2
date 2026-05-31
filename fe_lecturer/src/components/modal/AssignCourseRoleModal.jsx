import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, GripVertical, Search, UserCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import facultyService from '@/services/facultyService'
import lectureService from '@/services/lectureService'
import courseService from '@/services/courseService'
import courseLecturerService from '@/services/courseLecturerService'

const PAGE_SIZE = 50

const ROLE_OPTIONS = [
  { value: 'member',  label: 'Thành viên (Member)' },
  { value: 'manager', label: 'Quản lý môn (Manager)' },
]

function PanelPager({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-2 shrink-0 text-xs text-slate-500">
      <span>Trang {page} / {totalPages}</span>
      <div className="flex gap-1">
        <button type="button" disabled={page <= 1} onClick={onPrev}
          className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">‹</button>
        <button type="button" disabled={page >= totalPages} onClick={onNext}
          className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100">›</button>
      </div>
    </div>
  )
}

export default function AssignCourseRoleModal({ isOpen, onOpenChange, onSuccess }) {
  // ── Khoa ───────────────────────────────────────────────────────────────────
  const [faculties, setFaculties]                 = useState([])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')

  // ── Bảng giảng viên ────────────────────────────────────────────────────────
  const [lecturers, setLecturers]                 = useState([])
  const [lecturerTotal, setLecturerTotal]         = useState(0)
  const [lecturerPage, setLecturerPage]           = useState(1)
  const [lecturerSearch, setLecturerSearch]       = useState('')
  const [lecturerDraft, setLecturerDraft]         = useState('')
  const [lecturersLoading, setLecturersLoading]   = useState(false)
  // Map<id, obj> — giữ selection khi đổi trang
  const [selLecturers, setSelLecturers]           = useState(new Map())

  // ── Bảng môn học ───────────────────────────────────────────────────────────
  const [courses, setCourses]                     = useState([])
  const [courseTotal, setCourseTotal]             = useState(0)
  const [coursePage, setCoursePage]               = useState(1)
  const [courseSearch, setCourseSearch]           = useState('')
  const [courseDraft, setCourseDraft]             = useState('')
  const [coursesLoading, setCoursesLoading]       = useState(false)
  // Map<id, obj>
  const [selCourses, setSelCourses]               = useState(new Map())

  // ── Quyền + submit ─────────────────────────────────────────────────────────
  const [roleName, setRoleName]                   = useState('member')
  const [submitting, setSubmitting]               = useState(false)

  // ── Drag-to-select (mouse trong bảng GV) ──────────────────────────────────
  const isSelDragging = useRef(false)   // đang kéo chọn
  const dragStart     = useRef(-1)
  const dragMode      = useRef('add')   // 'add' | 'remove'
  const hasMoved      = useRef(false)
  const dragBase      = useRef(new Map())

  // ── Drag-to-assign (kéo GV → thả vào môn học) ────────────────────────────
  const draggedLecturer                   = useRef(null)
  const [dragOverCourseId, setDragOverCourseId] = useState(null)
  const [dropPending, setDropPending]     = useState(false) // loading khi drop

  // kết thúc mouse-drag-select dù chuột rời khỏi component
  useEffect(() => {
    const end = () => { isSelDragging.current = false }
    window.addEventListener('mouseup', end)
    return () => window.removeEventListener('mouseup', end)
  }, [])

  // tải khoa một lần khi mở
  useEffect(() => {
    if (!isOpen) return
    facultyService.list().then(setFaculties).catch(() => {})
  }, [isOpen])

  // reset toàn bộ khi đóng
  useEffect(() => {
    if (isOpen) return
    setSelectedFacultyId('')
    setLecturers([]); setLecturerTotal(0); setLecturerPage(1)
    setLecturerSearch(''); setLecturerDraft(''); setSelLecturers(new Map())
    setCourses([]); setCourseTotal(0); setCoursePage(1)
    setCourseSearch(''); setCourseDraft(''); setSelCourses(new Map())
    setRoleName('member')
    draggedLecturer.current = null; setDragOverCourseId(null)
  }, [isOpen])

  // tải giảng viên
  useEffect(() => {
    if (!isOpen || !selectedFacultyId) { setLecturers([]); setLecturerTotal(0); return }
    setLecturersLoading(true)
    lectureService
      .list({ facultyId: selectedFacultyId, fullName: lecturerSearch, page: lecturerPage, pageSize: PAGE_SIZE })
      .then(({ rows, total }) => { setLecturers(rows); setLecturerTotal(total) })
      .catch(() => toast.error('Không tải được danh sách giảng viên'))
      .finally(() => setLecturersLoading(false))
  }, [isOpen, selectedFacultyId, lecturerSearch, lecturerPage])

  // tải môn học
  useEffect(() => {
    if (!isOpen || !selectedFacultyId) { setCourses([]); setCourseTotal(0); return }
    setCoursesLoading(true)
    courseService
      .listByFaculty(selectedFacultyId, { courseName: courseSearch, page: coursePage, pageSize: PAGE_SIZE })
      .then(({ rows, total }) => { setCourses(rows); setCourseTotal(total) })
      .catch(() => toast.error('Không tải được danh sách môn học'))
      .finally(() => setCoursesLoading(false))
  }, [isOpen, selectedFacultyId, courseSearch, coursePage])

  // ── Đổi khoa ───────────────────────────────────────────────────────────────
  const changeFaculty = (e) => {
    setSelectedFacultyId(e.target.value)
    setLecturerPage(1); setLecturerSearch(''); setLecturerDraft('')
    setCoursePage(1);   setCourseSearch('');   setCourseDraft('')
    setSelLecturers(new Map()); setSelCourses(new Map())
  }

  // ── Selection: giảng viên ──────────────────────────────────────────────────
  const toggleLecturer = (l) =>
    setSelLecturers((p) => { const n = new Map(p); n.has(l.id) ? n.delete(l.id) : n.set(l.id, l); return n })

  const toggleAllLecturers = () =>
    setSelLecturers((p) => {
      const allSel = lecturers.every((l) => p.has(l.id))
      const n = new Map(p)
      if (allSel) lecturers.forEach((l) => n.delete(l.id))
      else        lecturers.forEach((l) => n.set(l.id, l))
      return n
    })

  // ── Selection: môn học ─────────────────────────────────────────────────────
  const toggleCourse = (c) =>
    setSelCourses((p) => { const n = new Map(p); n.has(c.id) ? n.delete(c.id) : n.set(c.id, c); return n })

  const toggleAllCourses = () =>
    setSelCourses((p) => {
      const allSel = courses.every((c) => p.has(c.id))
      const n = new Map(p)
      if (allSel) courses.forEach((c) => n.delete(c.id))
      else        courses.forEach((c) => n.set(c.id, c))
      return n
    })

  // ── Mouse drag-to-select (trong bảng GV) ──────────────────────────────────
  const onRowMouseDown = (e, idx, l) => {
    if (e.button !== 0) return
    e.preventDefault()
    isSelDragging.current = true
    dragStart.current     = idx
    hasMoved.current      = false
    dragBase.current      = new Map(selLecturers)
    dragMode.current      = selLecturers.has(l.id) ? 'remove' : 'add'
  }

  const onRowMouseEnter = (idx) => {
    if (!isSelDragging.current) return
    hasMoved.current = true
    const from  = Math.min(dragStart.current, idx)
    const to    = Math.max(dragStart.current, idx)
    const range = lecturers.slice(from, to + 1)
    setSelLecturers(() => {
      const n = new Map(dragBase.current)
      if (dragMode.current === 'add') range.forEach((l) => n.set(l.id, l))
      else                            range.forEach((l) => n.delete(l.id))
      return n
    })
  }

  const onRowClick = (l) => {
    if (hasMoved.current) { hasMoved.current = false; return }
    toggleLecturer(l)
  }

  // ── HTML5 Drag-to-assign: kéo GV → thả vào môn học ───────────────────────
  const onGripDragStart = (e, l) => {
    draggedLecturer.current = l
    e.dataTransfer.effectAllowed = 'copy'
    // text phụ giúp browser hiện drag ghost mặc định
    e.dataTransfer.setData('text/plain', l.fullName)
    // dừng mouse-select để không conflict
    isSelDragging.current = false
  }

  const onGripDragEnd = () => {
    draggedLecturer.current = null
    setDragOverCourseId(null)
  }

  const onCourseDragOver = (e, courseId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverCourseId(courseId)
  }

  const onCourseDragLeave = (e) => {
    // chỉ clear khi rời hẳn row, không phải vào child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCourseId(null)
    }
  }

  const onCourseDrop = async (e, course) => {
    e.preventDefault()
    setDragOverCourseId(null)
    const dragged = draggedLecturer.current
    draggedLecturer.current = null
    if (!dragged) return

    // nếu GV kéo nằm trong selection → assign toàn bộ selected GV vào môn đó
    const targets = (selLecturers.has(dragged.id) && selLecturers.size > 1)
      ? [...selLecturers.values()]
      : [dragged]

    try {
      setDropPending(true)
      if (targets.length === 1) {
        await courseLecturerService.assign({
          courseCode:   course.courseCode,
          lecturerCode: targets[0].lecturerCode,
          roleName,
        })
        toast.success(`Đã phân công ${targets[0].fullName} → ${course.courseName}`)
      } else {
        const rows = targets.map((l) => ({
          courseCode:   course.courseCode,
          lecturerCode: l.lecturerCode,
          roleName,
        }))
        const apiRes = await courseLecturerService.bulkAssign(rows)
        const result = apiRes.data
        if (result.errorCount === 0) {
          toast.success(`Đã phân công ${result.successCount} giảng viên → ${course.courseName}`)
        } else {
          toast.warning(`${result.successCount}/${result.total} thành công — ${result.errorCount} lỗi`)
        }
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Phân công thất bại')
    } finally {
      setDropPending(false)
    }
  }

  // ── Submit hàng loạt (checkbox selection) ─────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFacultyId)      { toast.error('Vui lòng chọn khoa'); return }
    if (selLecturers.size === 0) { toast.error('Vui lòng chọn ít nhất 1 giảng viên'); return }
    if (selCourses.size === 0)   { toast.error('Vui lòng chọn ít nhất 1 môn học'); return }

    const assignments = []
    for (const l of selLecturers.values())
      for (const c of selCourses.values())
        assignments.push({ courseCode: c.courseCode, lecturerCode: l.lecturerCode, roleName })

    try {
      setSubmitting(true)
      const apiRes = await courseLecturerService.bulkAssign(assignments)
      const result = apiRes.data
      if (result.errorCount === 0) {
        toast.success(`Đã phân công ${result.successCount} bản ghi thành công`)
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.warning(`${result.successCount}/${result.total} thành công — ${result.errorCount} bản ghi lỗi`)
        onSuccess?.()
      }
    } catch {
      toast.error('Phân công thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const lecturerTotalPages = Math.max(Math.ceil(lecturerTotal / PAGE_SIZE), 1)
  const courseTotalPages   = Math.max(Math.ceil(courseTotal   / PAGE_SIZE), 1)
  const allLecSel          = lecturers.length > 0 && lecturers.every((l) => selLecturers.has(l.id))
  const allCouSel          = courses.length > 0   && courses.every((c) => selCourses.has(c.id))
  const assignCount        = selLecturers.size * selCourses.size
  const isDraggingToAssign = dragOverCourseId !== null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-[#08387F]">Gán quyền môn học</DialogTitle>
        </DialogHeader>

        {/* ── Thanh chọn Khoa + Quyền ── */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex-1 min-w-[180px] space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Khoa <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedFacultyId}
              onChange={changeFaculty}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
            >
              <option value="">— Chọn khoa —</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
            </select>
          </div>

          <div className="w-52 space-y-1">
            <label className="text-sm font-semibold text-slate-700">Quyền phân công</label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {assignCount > 0 && (
            <Badge className="rounded-full bg-[#08387F]/10 px-3 py-1 text-sm font-semibold text-[#08387F] hover:bg-[#08387F]/10">
              {selLecturers.size} GV × {selCourses.size} môn = {assignCount} phân công
            </Badge>
          )}
        </div>

        {/* ── Hai bảng ── */}
        <div className="flex gap-3 overflow-hidden" style={{ height: '52vh' }}>

          {/* ═══ Bảng giảng viên — 70% ═══ */}
          <div className="flex w-[70%] flex-col min-h-0">
            <div className="flex gap-2 mb-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={lecturerDraft}
                  onChange={(e) => setLecturerDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setLecturerSearch(lecturerDraft); setLecturerPage(1) } }}
                  placeholder="Tìm theo họ tên giảng viên..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button type="button" size="sm"
                className="h-8 shrink-0 bg-[#08387F] text-white hover:bg-[#072f6a]"
                onClick={() => { setLecturerSearch(lecturerDraft); setLecturerPage(1) }}>Tìm</Button>
            </div>

            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> Giảng viên ({lecturerTotal})
                <span className="ml-1 text-slate-400 italic">· Kéo <GripVertical className="inline h-3 w-3" /> để gán nhanh</span>
              </span>
              {selLecturers.size > 0 && (
                <span className="font-semibold text-blue-600">Đã chọn: {selLecturers.size}</span>
              )}
            </div>

            <div
              className="flex-1 overflow-auto rounded-lg border border-slate-200 select-none min-h-0"
              onMouseLeave={() => { isSelDragging.current = false }}
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    {/* grip column */}
                    <th className="w-5" />
                    <th className="w-9 px-3 py-2 text-center">
                      <input type="checkbox" checked={allLecSel} onChange={toggleAllLecturers}
                        disabled={lecturers.length === 0}
                        className="h-3.5 w-3.5 cursor-pointer accent-[#08387F]" />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Mã GV</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Họ tên</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">Học vị</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Bộ môn</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturersLoading ? (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">Đang tải...</td></tr>
                  ) : !selectedFacultyId ? (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">Chọn khoa để xem danh sách giảng viên</td></tr>
                  ) : lecturers.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">Không tìm thấy giảng viên</td></tr>
                  ) : lecturers.map((l, idx) => {
                    const checked = selLecturers.has(l.id)
                    return (
                      <tr
                        key={l.id}
                        className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors group ${
                          checked ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                        }`}
                        onMouseDown={(e) => onRowMouseDown(e, idx, l)}
                        onMouseEnter={() => onRowMouseEnter(idx)}
                        onClick={() => onRowClick(l)}
                      >
                        {/* ── Grip handle — chỉ cell này draggable ── */}
                        <td
                          draggable={true}
                          onDragStart={(e) => onGripDragStart(e, l)}
                          onDragEnd={onGripDragEnd}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()} // không kích hoạt select-drag
                          className="w-5 pl-2 py-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                          title="Kéo để phân công vào môn học"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </td>

                        <td className="w-9 px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={checked} onChange={() => toggleLecturer(l)}
                            className="h-3.5 w-3.5 cursor-pointer accent-[#08387F]" />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">{l.lecturerCode}</td>
                        <td className="px-3 py-2 text-slate-800">{l.fullName}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{l.academicDegree || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{l.majorName || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <PanelPager
              page={lecturerPage} totalPages={lecturerTotalPages}
              onPrev={() => setLecturerPage((p) => p - 1)}
              onNext={() => setLecturerPage((p) => p + 1)}
            />
          </div>

          {/* ═══ Bảng môn học — 30% ═══ */}
          <div className="flex w-[30%] flex-col min-h-0">
            <div className="flex gap-2 mb-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={courseDraft}
                  onChange={(e) => setCourseDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setCourseSearch(courseDraft); setCoursePage(1) } }}
                  placeholder="Tìm môn học..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button type="button" size="sm"
                className="h-8 shrink-0 bg-[#08387F] text-white hover:bg-[#072f6a]"
                onClick={() => { setCourseSearch(courseDraft); setCoursePage(1) }}>Tìm</Button>
            </div>

            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Môn học ({courseTotal})
              </span>
              <span className="flex items-center gap-2">
                {dropPending && <span className="text-amber-500 italic">Đang phân công...</span>}
                {selCourses.size > 0 && (
                  <span className="font-semibold text-emerald-600">Đã chọn: {selCourses.size}</span>
                )}
              </span>
            </div>

            {/* drop zone hint khi đang kéo */}
            {isDraggingToAssign && (
              <div className="mb-1 shrink-0 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                Thả vào môn học để phân công{selLecturers.size > 1 && draggedLecturer.current && selLecturers.has(draggedLecturer.current?.id) ? ` ${selLecturers.size} giảng viên` : ''}
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-lg border border-slate-200 select-none min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-8 px-2 py-2 text-center">
                      <input type="checkbox" checked={allCouSel} onChange={toggleAllCourses}
                        disabled={courses.length === 0}
                        className="h-3.5 w-3.5 cursor-pointer accent-[#08387F]" />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Môn học</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesLoading ? (
                    <tr><td colSpan={2} className="py-10 text-center text-sm text-slate-400">Đang tải...</td></tr>
                  ) : !selectedFacultyId ? (
                    <tr><td colSpan={2} className="py-10 text-center text-sm text-slate-400">Chọn khoa để xem môn học</td></tr>
                  ) : courses.length === 0 ? (
                    <tr><td colSpan={2} className="py-10 text-center text-sm text-slate-400">Không tìm thấy môn học</td></tr>
                  ) : courses.map((c) => {
                    const checked   = selCourses.has(c.id)
                    const isDropTarget = dragOverCourseId === c.id
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
                          isDropTarget
                            ? 'bg-emerald-100 outline outline-2 outline-emerald-400'
                            : checked
                              ? 'bg-emerald-50 hover:bg-emerald-100'
                              : 'hover:bg-slate-50'
                        }`}
                        onDragOver={(e) => onCourseDragOver(e, c.id)}
                        onDragLeave={onCourseDragLeave}
                        onDrop={(e) => onCourseDrop(e, c)}
                        onClick={() => toggleCourse(c)}
                      >
                        <td className="w-8 px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCourse(c)}
                            className="h-3.5 w-3.5 cursor-pointer accent-[#08387F]" />
                        </td>
                        <td className="px-2 py-2">
                          <div className="font-mono text-[10px] text-slate-500">{c.courseCode}</div>
                          <div className="text-xs leading-snug text-slate-800">{c.courseName}</div>
                          {c.credits ? <div className="text-[10px] text-slate-400">{c.credits} tín chỉ</div> : null}
                          {isDropTarget && (
                            <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                              ↓ Thả để phân công
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <PanelPager
              page={coursePage} totalPages={courseTotalPages}
              onPrev={() => setCoursePage((p) => p - 1)}
              onNext={() => setCoursePage((p) => p + 1)}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || dropPending}>
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-[#08387F] text-white hover:bg-[#072f6a]"
            onClick={handleSubmit}
            disabled={submitting || dropPending || assignCount === 0}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {submitting
              ? 'Đang phân công...'
              : assignCount > 0
                ? `Phân công (${assignCount})`
                : 'Phân công'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
