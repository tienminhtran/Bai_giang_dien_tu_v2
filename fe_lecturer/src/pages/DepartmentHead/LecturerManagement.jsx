import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import departmentHeadService from '@/services/departmentHeadService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function DepartmentHeadLecturerManagement() {
  const [rows, setRows]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(PAGE_SIZE_OPTIONS[0])
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [facultyName, setFacultyName] = useState('')

  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  const safePage   = Math.min(page, totalPages)

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (safePage > 3) pages.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
    if (safePage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const fetchRows = async (p = 1, ps = pageSize, code = searchCode, name = searchName) => {
    setLoading(true)
    try {
      const { rows: data, total: count } = await departmentHeadService.listLecturers({
        lecturerCode: code, fullName: name, page: p, pageSize: ps,
      })
      setRows(data)
      setTotal(count)
      setPage(p)
      if (data[0]?.facultyName && !facultyName) setFacultyName(data[0].facultyName)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách giảng viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  const handleSearch = () => fetchRows(1, pageSize, searchCode, searchName)

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">
            Quản lý Giảng viên Khoa
            {facultyName && <span className="ml-2 text-base font-semibold text-slate-500">— {facultyName}</span>}
          </CardTitle>
          <CardDescription>Danh sách giảng viên thuộc khoa bạn đang quản lý.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mã giảng viên</label>
              <Input value={searchCode} onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Nhập mã giảng viên" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Họ tên</label>
              <Input value={searchName} onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Nhập họ tên" />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" /> Tìm
              </Button>
            </div>
          </div>
          <Separator />
          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {total} giảng viên
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách giảng viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Mã GV</TableHead>
                  <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                  <TableHead className="whitespace-nowrap">Học vị</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Số điện thoại</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Không có giảng viên nào trong khoa.</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap font-semibold text-slate-900">{r.lecturerCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.fullName}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.academicDegree || '—'}</TableCell>
                    <TableCell>{r.email || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className={r.isActive
                        ? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                        {r.isActive ? 'Đang hoạt động' : 'Đã khóa'}
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
              <select value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); fetchRows(1, Number(e.target.value)) }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]">
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>/ trang — {total} giảng viên</span>
            </div>
            <Pagination className="w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (safePage > 1) fetchRows(safePage - 1) }}
                    className={safePage === 1 ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
                {getPageNumbers().map((p, idx) => p === '...' ? (
                  <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={p === safePage}
                      onClick={(e) => { e.preventDefault(); fetchRows(p) }}>{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (safePage < totalPages) fetchRows(safePage + 1) }}
                    className={safePage === totalPages ? 'pointer-events-none opacity-40' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
