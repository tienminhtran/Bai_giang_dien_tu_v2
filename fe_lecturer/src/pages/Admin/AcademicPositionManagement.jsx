import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import academicDegreeService from '@/services/academicDegreeService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AcademicPositionManagement() {
  const [degrees, setDegrees]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [degreeName, setDegreeName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchDegrees = async () => {
    setLoading(true)
    try {
      setDegrees(await academicDegreeService.list())
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách học vị')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDegrees() }, [])

  const handleAdd = async () => {
    if (!degreeName.trim()) { toast.error('Vui lòng nhập tên học vị'); return }
    setSubmitting(true)
    try {
      await academicDegreeService.create({ degreeName })
      toast.success('Thêm học vị thành công')
      setDialogOpen(false)
      setDegreeName('')
      fetchDegrees()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thêm học vị thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await academicDegreeService.remove(deleteTarget.id)
      toast.success('Đã xóa học vị')
      setDeleteTarget(null)
      fetchDegrees()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa học vị thất bại')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý Học vị</CardTitle>
          <CardDescription>Danh sách học vị dùng để phân loại giảng viên.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50"
              onClick={() => { setDegreeName(''); setDialogOpen(true) }}
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm học vị
            </Button>
          </div>

          <Separator />

          <Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
            Tổng: {degrees.length} học vị
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900">Danh sách học vị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full rounded-none border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Tên học vị</TableHead>
                  <TableHead className="w-px">Xóa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : degrees.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-500">Chưa có học vị nào.</TableCell></TableRow>
                ) : degrees.map((d, idx) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-slate-900">{d.degreeName}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon-sm" title="Xóa" onClick={() => setDeleteTarget(d)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog thêm học vị */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setDegreeName('') }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#08387F]">Thêm học vị</DialogTitle>
            <DialogDescription>Nhập tên học vị mới.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="text-sm font-semibold text-slate-700">Tên học vị <span className="text-rose-500">*</span></label>
            <Input
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              placeholder="VD: Tiến sĩ Khoa học"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleAdd} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa học vị</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa học vị <strong>{deleteTarget?.degreeName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
