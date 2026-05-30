import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, Search } from 'lucide-react'
import { toast } from 'sonner'
import departmentHeadService from '@/services/departmentHeadService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 20

export default function MajorManagementDetail() {
  const { majorId } = useParams()
  const navigate    = useNavigate()

  const [majorName, setMajorName] = useState('')
  const [isLock, setIsLock]       = useState(false)
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchLecturers = async (currentPage = 1, keyword = '') => {
    setLoading(true)
    try {
      const res = await departmentHeadService.listLecturersByMajor(majorId, {
        fullName: keyword,
        page:     currentPage,
        pageSize: PAGE_SIZE,
      })
      setRows(res.rows)
      setTotal(res.total)
      setMajorName(res.majorName || '')
      setIsLock(res.isLock)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách giảng viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLecturers(1, '')
  }, [majorId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1)
    fetchLecturers(1, search.trim())
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchLecturers(newPage, search.trim())
  }

  return (
    <div className="space-y-6">
      {/* Header + tìm kiếm */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          {/* Back button */}
          <Button
            type="button" variant="ghost" size="sm"
            className="-ml-2 w-fit gap-1.5 text-slate-500 hover:text-[#08387F] hover:bg-blue-50"
            onClick={() => navigate('/dashboard/department-head/majors')}
          >
            <ArrowLeft className="h-4 w-4" />
            Quản lý chuyên ngành
          </Button>

          {/* Title block */}
          <div className="border-l-4 border-[#08387F] pl-4">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <CardTitle className="text-2xl font-black text-[#08387F] leading-tight">
                {majorName || '…'}
              </CardTitle>
              {isLock && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                  <Lock className="h-3 w-3" /> Đã khóa
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Danh sách giảng viên thuộc chuyên ngành này.</p>
          </div>

          {/* Search */}
          <div className="flex gap-2 max-w-sm">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm theo họ tên hoặc mã GV..."
              className="h-9 text-sm"
            />
            <Button
              type="button"
              className="bg-[#08387F] text-white hover:bg-[#072f6a] shrink-0 h-9"
              onClick={handleSearch} disabled={loading}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Bảng giảng viên */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">
            Danh sách giảng viên
            {!loading && <span className="ml-2 text-sm font-normal text-slate-500">({total} người)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">STT</TableHead>
                  <TableHead className="whitespace-nowrap">Mã GV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Học vị</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="whitespace-nowrap">Điện thoại</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-500">Chưa có giảng viên nào trong chuyên ngành này.</TableCell></TableRow>
                ) : rows.map((lec, idx) => (
                  <TableRow key={lec.id}>
                    <TableCell className="text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">{lec.lecturerCode}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{lec.fullName}</TableCell>
                    <TableCell className="text-slate-600">{lec.academicDegree || '—'}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{lec.email || '—'}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{lec.phone || '—'}</TableCell>
                    <TableCell>
                      {lec.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Hoạt động</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">Bị khóa</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Trang {page} / {totalPages} — {total} giảng viên</span>
              <div className="flex gap-1 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}>Trước</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`e${i}`} className="px-2 py-1">…</span>
                    ) : (
                      <Button
                        key={p} variant={p === page ? 'default' : 'outline'} size="sm"
                        className={p === page ? 'bg-[#08387F] text-white hover:bg-[#072f6a]' : ''}
                        onClick={() => handlePageChange(p)} disabled={loading}
                      >{p}</Button>
                    )
                  )
                }
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages || loading}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
