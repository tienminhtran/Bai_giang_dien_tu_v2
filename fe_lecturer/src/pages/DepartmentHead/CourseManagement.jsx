import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import courseService from '@/services/courseService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUrlState } from '@/hooks'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const URL_DEFAULTS = { page: 1, pageSize: PAGE_SIZE_OPTIONS[0] }

export default function DepartmentHeadCourseManagement() {
  const { get, set, resetPage, searchParams } = useUrlState(URL_DEFAULTS)
  const page     = Number(get('page'))     || 1
  const pageSize = Number(get('pageSize')) || PAGE_SIZE_OPTIONS[0]

  const [draftCode, setDraftCode] = useState(() => get('courseCode') || '')
  const [draftName, setDraftName] = useState(() => get('courseName') || '')

  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [faculty, setFaculty] = useState(null)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(Math.ceil(total / pageSize), 1)

  useEffect(() => {
    const courseCode = searchParams.get('courseCode') || ''
    const courseName = searchParams.get('courseName') || ''
    setLoading(true)
    courseService.listMyFaculty({ courseCode, courseName, page, pageSize })
      .then(({ faculty: f, rows: data, total: count }) => {
        if (f) setFaculty(f)
        setRows(data)
        setTotal(count)
      })
      .catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách môn học'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const applySearch = () => resetPage({ courseCode: draftCode.trim(), courseName: draftName.trim() })

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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-black text-[#08387F]">
            Môn học{faculty ? ` — ${faculty.facultyName}` : ''}
          </CardTitle>
          <CardDescription>Danh sách môn học thuộc khoa của bạn. Tìm kiếm theo mã hoặc tên môn học.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mã môn học</label>
              <Input
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                placeholder="Nhập mã môn học"
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tên môn học</label>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Nhập tên môn học"
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={applySearch}>
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
            </div>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {total} môn học
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách môn học</CardTitle>
          <CardDescription>Kết quả lọc theo mã và tên môn học.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Mã môn học</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead className="w-[90px]">Tín chỉ</TableHead>
                  <TableHead className="w-[110px]">Manager tối đa</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-[140px]">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy môn học phù hợp.</TableCell>
                  </TableRow>
                ) : rows.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium text-slate-900 whitespace-nowrap">{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell className="text-center">{course.credits || '—'}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm font-semibold text-slate-700">{course.countManager}</span>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-slate-500">{course.description || '—'}</TableCell>
                    <TableCell>
                      <Badge className={course.isActive
                        ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                        {course.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
              <span>/ trang — {total} môn học</span>
            </div>

            <Pagination className="w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) set({ page: page - 1 }) }}
                    className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
                {pageNumbers.map((item, index) => (
                  <PaginationItem key={`${item}-${index}`}>
                    {item === '...'
                      ? <PaginationEllipsis />
                      : <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); set({ page: item }) }}>{item}</PaginationLink>}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < totalPages) set({ page: page + 1 }) }}
                    className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
