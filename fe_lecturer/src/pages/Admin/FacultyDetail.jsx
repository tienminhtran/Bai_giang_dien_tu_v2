import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, BookOpen, GraduationCap, LayoutGrid, Lock, Search, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import facultyService from '@/services/facultyService'
import majorService from '@/services/majorService'
import lectureService from '@/services/lectureService'
import courseService from '@/services/courseService'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE = 20

const formatDate = (val) => {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

const TABS = [
  { key: 'info',      label: 'Thông tin khoa',          icon: GraduationCap },
  { key: 'lecturers', label: 'Giảng viên',               icon: Users },
  { key: 'courses',   label: 'Môn học chủ quản',         icon: BookOpen },
]

function SimplePager({ page, totalPages, onPrev, onNext, total, unit }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{total} {unit}</span>
      {totalPages > 1 && (
        <Pagination className="w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#"
                onClick={(e) => { e.preventDefault(); if (page > 1) onPrev() }}
                className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('...'); acc.push(p); return acc }, [])
              .map((p, i) =>
                p === '...' ? (
                  <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={p === page}
                      onClick={(e) => { e.preventDefault(); if (p !== page) onNext(p) }}>{p}</PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages) onNext(page + 1) }}
                className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default function FacultyDetail() {
  const { facultyId } = useParams()
  const navigate      = useNavigate()
  const { state }     = useLocation()

  const [activeTab, setActiveTab] = useState('info')

  // ── Thông tin khoa ────────────────────────────────────────────────────────
  const [facultyInfo, setFacultyInfo]       = useState(state?.faculty || null)
  const [facultyLoading, setFacultyLoading] = useState(!state?.faculty)

  // ── Tab 1 — Chuyên ngành ──────────────────────────────────────────────────
  const [majors, setMajors]           = useState([])
  const [majorsLoading, setMajorsLoading] = useState(false)

  // ── Tab 2 — Giảng viên ────────────────────────────────────────────────────
  const [lecturers, setLecturers]             = useState([])
  const [lecturerTotal, setLecturerTotal]     = useState(0)
  const [lecturerPage, setLecturerPage]       = useState(1)
  const [lecturersLoading, setLecturersLoading] = useState(false)
  // draft (chưa apply) / applied (đang dùng để fetch)
  const [lecDraft, setLecDraft]   = useState({ code: '', name: '', majorId: '' })
  const [lecFilter, setLecFilter] = useState({ code: '', name: '', majorId: '' })

  // ── Tab 3 — Môn học ───────────────────────────────────────────────────────
  const [courses, setCourses]             = useState([])
  const [courseTotal, setCourseTotal]     = useState(0)
  const [coursePage, setCoursePage]       = useState(1)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [couDraft, setCouDraft]   = useState({ code: '', name: '' })
  const [couFilter, setCouFilter] = useState({ code: '', name: '' })

  // tải thông tin khoa nếu không có trong state
  useEffect(() => {
    if (facultyInfo) { setFacultyLoading(false); return }
    facultyService.list()
      .then((list) => {
        const found = list.find((f) => f.id === facultyId)
        if (found) setFacultyInfo(found)
      })
      .catch(() => toast.error('Không tải được thông tin khoa'))
      .finally(() => setFacultyLoading(false))
  }, [facultyId]) // eslint-disable-line

  // tải chuyên ngành theo khoa (kèm chủ nhiệm ngành)
  useEffect(() => {
    setMajorsLoading(true)
    majorService.listByFaculty(facultyId)
      .then(setMajors)
      .catch(() => toast.error('Không tải được danh sách chuyên ngành'))
      .finally(() => setMajorsLoading(false))
  }, [facultyId])

  // tải giảng viên khi trang hoặc filter thay đổi
  useEffect(() => {
    setLecturersLoading(true)
    lectureService.list({
      facultyId,
      lecturerCode: lecFilter.code,
      fullName:     lecFilter.name,
      majorId:      lecFilter.majorId,
      page:         lecturerPage,
      pageSize:     PAGE_SIZE,
    })
      .then(({ rows, total }) => { setLecturers(rows); setLecturerTotal(total) })
      .catch(() => toast.error('Không tải được danh sách giảng viên'))
      .finally(() => setLecturersLoading(false))
  }, [facultyId, lecturerPage, lecFilter])

  // tải môn học khi trang hoặc filter thay đổi
  useEffect(() => {
    setCoursesLoading(true)
    courseService.listByFaculty(facultyId, {
      courseCode: couFilter.code,
      courseName: couFilter.name,
      page:       coursePage,
      pageSize:   PAGE_SIZE,
    })
      .then(({ rows, total }) => { setCourses(rows); setCourseTotal(total) })
      .catch(() => toast.error('Không tải được danh sách môn học'))
      .finally(() => setCoursesLoading(false))
  }, [facultyId, coursePage, couFilter])

  const lecturerTotalPages = Math.max(1, Math.ceil(lecturerTotal / PAGE_SIZE))
  const courseTotalPages   = Math.max(1, Math.ceil(courseTotal   / PAGE_SIZE))

  // ── Handlers tìm kiếm ────────────────────────────────────────────────────
  const applyLecFilter = () => { setLecFilter({ ...lecDraft }); setLecturerPage(1) }
  const resetLecFilter = () => {
    const empty = { code: '', name: '', majorId: '' }
    setLecDraft(empty); setLecFilter(empty); setLecturerPage(1)
  }

  const applyCouFilter = () => { setCouFilter({ ...couDraft }); setCoursePage(1) }
  const resetCouFilter = () => {
    const empty = { code: '', name: '' }
    setCouDraft(empty); setCouFilter(empty); setCoursePage(1)
  }

  const lecFilterActive = lecFilter.code || lecFilter.name || lecFilter.majorId
  const couFilterActive = couFilter.code || couFilter.name

  return (
    <div className="space-y-0">

      {/* ── Breadcrumb ── */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button type="button" className="transition-colors hover:text-[#08387F]" onClick={() => navigate(-1)}>
          Quản lý Khoa/Viện
        </button>
        <span>/</span>
        <span className="font-medium text-slate-800">Chi tiết khoa</span>
      </div>

      {/* ── Header card ── */}
      <Card className="border-slate-200 shadow-sm rounded-b-none border-b-0">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Khoa / Viện</p>
              <CardTitle className="text-xl font-black text-[#08387F] leading-tight">
                {facultyLoading ? '...' : (facultyInfo?.facultyName || 'Khoa')}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {facultyInfo?.createdAt && (
                  <span>Ngày tạo: <strong className="text-slate-700">{formatDate(facultyInfo.createdAt)}</strong></span>
                )}
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <strong className="text-slate-700">{majors.length}</strong> chuyên ngành
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <strong className="text-slate-700">{lecturerTotal}</strong> giảng viên
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <strong className="text-slate-700">{courseTotal}</strong> môn học
                </span>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm"
              className="shrink-0 gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#08387F]"
              onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </div>

          {/* Tabs — select trên mobile, nút ngang trên desktop */}
          <div className="-mx-6 px-6 border-t border-slate-200">
            {/* Mobile: dropdown */}
            <div className="block sm:hidden py-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
              >
                {TABS.map((tab) => {
                  const count = tab.key === 'lecturers' ? lecturerTotal : tab.key === 'courses' ? courseTotal : majors.length
                  return (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}{count > 0 ? ` (${count})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Desktop: nút ngang */}
            <div className="hidden sm:flex">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const count = tab.key === 'lecturers' ? lecturerTotal : tab.key === 'courses' ? courseTotal : majors.length
                return (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'border-[#08387F] text-[#08387F]'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}>
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {count > 0 && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 1 — Thông tin khoa + Danh sách chuyên ngành
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'info' && (
        <Card className="border-slate-200 shadow-sm rounded-t-none">
          <CardContent className="pt-6 space-y-8">
            {/* Thông tin cơ bản */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tên khoa/viện</p>
                <p className="font-semibold text-slate-900">{facultyInfo?.facultyName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ngày tạo</p>
                <p className="text-slate-800">{formatDate(facultyInfo?.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Số chuyên ngành</p>
                <p className="text-slate-800">{majors.length}</p>
              </div>
            </div>

            {/* Danh sách chuyên ngành */}
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                Danh sách chuyên ngành
                <span className="ml-2 text-sm font-normal text-slate-500">({majors.length})</span>
              </h3>
              <div className="rounded-none border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">STT</TableHead>
                      <TableHead>Tên chuyên ngành</TableHead>
                      <TableHead className="whitespace-nowrap">Chủ nhiệm ngành</TableHead>
                      <TableHead className="whitespace-nowrap">Số GV</TableHead>
                      <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {majorsLoading ? (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : majors.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Chưa có chuyên ngành nào.</TableCell></TableRow>
                    ) : majors.map((m, idx) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-slate-900">{m.majorName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {m.majorHead ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">{m.majorHead.fullName}</p>
                              <p className="text-xs text-slate-400">{m.majorHead.lecturerCode}{m.majorHead.academicDegree ? ` · ${m.majorHead.academicDegree}` : ''}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa phân công</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">{m.lecturerCount}</TableCell>
                        <TableCell>
                          <Badge className={m.isLock
                            ? 'rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100'
                            : 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          }>
                            {m.isLock ? <><Lock className="mr-1 inline h-3 w-3" />Đã khóa</> : 'Đang mở'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 2 — Danh sách giảng viên
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'lecturers' && (
        <Card className="border-slate-200 shadow-sm rounded-t-none">
          <CardHeader className="pb-3 space-y-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Danh sách giảng viên</CardTitle>
              <CardDescription>
                Giảng viên thuộc khoa <strong>{facultyInfo?.facultyName || facultyId}</strong>.
              </CardDescription>
            </div>

            {/* ── Search bar giảng viên ── */}
            <div className="flex flex-wrap gap-2">
              <div className="relative w-36">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={lecDraft.code}
                  onChange={(e) => setLecDraft((p) => ({ ...p, code: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyLecFilter()}
                  placeholder="Mã GV"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={lecDraft.name}
                  onChange={(e) => setLecDraft((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyLecFilter()}
                  placeholder="Tên giảng viên"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <select
                value={lecDraft.majorId}
                onChange={(e) => setLecDraft((p) => ({ ...p, majorId: e.target.value }))}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
              >
                <option value="">Tất cả chuyên ngành</option>
                {majors.map((m) => <option key={m.id} value={m.id}>{m.majorName}</option>)}
              </select>
              <Button type="button" size="sm" className="h-8 bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={applyLecFilter}>
                <Search className="mr-1.5 h-3.5 w-3.5" /> Tìm
              </Button>
              {lecFilterActive && (
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={resetLecFilter}>
                  <X className="mr-1.5 h-3.5 w-3.5" /> Xóa lọc
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-none border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead className="whitespace-nowrap">Mã GV</TableHead>
                    <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                    <TableHead className="whitespace-nowrap">Học vị</TableHead>
                    <TableHead className="whitespace-nowrap">Bộ môn</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Điện thoại</TableHead>
                    <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturersLoading ? (
                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                  ) : lecturers.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Chưa có giảng viên nào.</TableCell></TableRow>
                  ) : lecturers.map((l, idx) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-slate-500">{(lecturerPage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-slate-900">{l.lecturerCode}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-slate-900">{l.fullName}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">{l.academicDegree || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">{l.majorName || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{l.email || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">{l.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge className={l.isActive
                          ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100'
                        }>
                          {l.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <SimplePager
              page={lecturerPage} totalPages={lecturerTotalPages} total={lecturerTotal} unit="giảng viên"
              onPrev={() => setLecturerPage((p) => p - 1)}
              onNext={(p) => setLecturerPage(p)}
            />
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 3 — Danh sách môn học chủ quản
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'courses' && (
        <Card className="border-slate-200 shadow-sm rounded-t-none">
          <CardHeader className="pb-3 space-y-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Danh sách môn học chủ quản</CardTitle>
              <CardDescription>
                Môn học thuộc khoa <strong>{facultyInfo?.facultyName || facultyId}</strong>.
              </CardDescription>
            </div>

            {/* ── Search bar môn học ── */}
            <div className="flex flex-wrap gap-2">
              <div className="relative w-36">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={couDraft.code}
                  onChange={(e) => setCouDraft((p) => ({ ...p, code: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyCouFilter()}
                  placeholder="Mã môn học"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={couDraft.name}
                  onChange={(e) => setCouDraft((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyCouFilter()}
                  placeholder="Tên môn học"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button type="button" size="sm" className="h-8 bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={applyCouFilter}>
                <Search className="mr-1.5 h-3.5 w-3.5" /> Tìm
              </Button>
              {couFilterActive && (
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={resetCouFilter}>
                  <X className="mr-1.5 h-3.5 w-3.5" /> Xóa lọc
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-none border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead className="whitespace-nowrap">Mã môn học</TableHead>
                    <TableHead>Tên môn học</TableHead>
                    <TableHead className="whitespace-nowrap">Số TC</TableHead>
                    <TableHead className="whitespace-nowrap">Manager tối đa</TableHead>
                    <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                    <TableHead className="w-px" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesLoading ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">Chưa có môn học nào.</TableCell></TableRow>
                  ) : courses.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-slate-500">{(coursePage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-slate-900">{c.courseCode}</TableCell>
                      <TableCell className="font-medium text-slate-900">{c.courseName}</TableCell>
                      <TableCell className="text-slate-600">{c.credits || '—'}</TableCell>
                      <TableCell className="text-slate-600">{c.countManager ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={c.isActive
                          ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
                        }>
                          {c.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết môn học"
                          onClick={() => navigate(`/dashboard/admin/courses/${c.courseCode}/detail`, { state: { course: c } })}>
                          <LayoutGrid className="h-4 w-4 text-blue-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <SimplePager
              page={coursePage} totalPages={courseTotalPages} total={courseTotal} unit="môn học"
              onPrev={() => setCoursePage((p) => p - 1)}
              onNext={(p) => setCoursePage(p)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
