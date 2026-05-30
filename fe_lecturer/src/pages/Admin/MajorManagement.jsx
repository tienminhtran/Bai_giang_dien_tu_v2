import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Edit, FileUp, Lock, Pencil, Plus, Trash2, Unlock, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import majorService from '@/services/majorService'
import lectureService from '@/services/lectureService'
import facultyService from '@/services/facultyService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// 
// Component phụ: Dialog phân công giảng viên vào chuyên ngành (2 cột)
// 
function AssignLecturerDialog({ open, onClose, faculties, majors, onAssigned }) {
  //  Bên trái: bộ lọc giảng viên 
  const [leftFacultyId, setLeftFacultyId]   = useState('')
  const [searchText, setSearchText]         = useState('')
  const [onlyNoMajor, setOnlyNoMajor]       = useState(true)
  const [lecturers, setLecturers]           = useState([])
  const [lvLoading, setLvLoading]           = useState(false)
  const [selectedIds, setSelectedIds]       = useState(new Set()) // id GV được chọn

  //  Bên phải: bộ lọc chuyên ngành 
  const [rightFacultyId, setRightFacultyId] = useState('')
  const [targetMajorId, setTargetMajorId]   = useState('')

  //  Đang gán 
  const [assigning, setAssigning] = useState(false)

  // Lọc danh sách chuyên ngành theo khoa bên phải
  const filteredMajors = rightFacultyId
    ? majors.filter((m) => m.facultyId === rightFacultyId)
    : majors

  // Tải danh sách giảng viên khi filter thay đổi
  const loadLecturers = useCallback(async () => {
    setLvLoading(true)
    try {
      const { rows } = await lectureService.list({
        facultyId: leftFacultyId,
        fullName: searchText,
        noMajor: onlyNoMajor,
        pageSize: 100,
      })
      setLecturers(rows)
    } catch {
      toast.error('Không tải được danh sách giảng viên')
    } finally {
      setLvLoading(false)
    }
  }, [leftFacultyId, searchText, onlyNoMajor])

  // Tải lại khi filter thay đổi (debounce nhẹ cho text)
  const debounceRef = useRef(null)
  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(loadLecturers, 300)
    return () => clearTimeout(debounceRef.current)
  }, [open, loadLecturers])

  // Reset khi đóng dialog
  useEffect(() => {
    if (!open) {
      setLeftFacultyId('')
      setSearchText('')
      setOnlyNoMajor(true)
      setLecturers([])
      setSelectedIds(new Set())
      setRightFacultyId('')
      setTargetMajorId('')
    }
  }, [open])

  // Toggle chọn 1 giảng viên
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Chọn tất cả / bỏ chọn tất cả
  const toggleAll = () => {
    if (selectedIds.size === lecturers.length && lecturers.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(lecturers.map((l) => l.id)))
    }
  }

  // Gán các GV đã chọn vào chuyên ngành đã chọn
  const handleAssign = async () => {
    if (selectedIds.size === 0) { toast.error('Vui lòng chọn ít nhất một giảng viên'); return }
    if (!targetMajorId) { toast.error('Vui lòng chọn chuyên ngành mục tiêu'); return }

    // Cảnh báo các GV đã có chuyên ngành
    const withMajor = lecturers.filter((l) => selectedIds.has(l.id) && l.majorId)
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
        await majorService.addLecturer(targetMajorId, id)
        successCount++
      } catch (err) {
        const lec = lecturers.find((l) => l.id === id)
        errors.push(`${lec?.lecturerCode} ${lec?.fullName}: ${err?.response?.data?.message || 'Lỗi'}`)
      }
    }

    setAssigning(false)

    if (successCount > 0) toast.success(`Đã gán ${successCount} giảng viên thành công`)
    if (errors.length > 0) toast.error(`${errors.length} thất bại:\n${errors.join('\n')}`)

    onAssigned()
    loadLecturers() // làm mới danh sách GV
    setSelectedIds(new Set())
  }

  const targetMajor = majors.find((m) => m.id === targetMajorId)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {/* !important override shadcn default sm:max-w-lg */}
      <DialogContent
        className="!max-w-[960px] w-[96vw] p-0 gap-0 overflow-hidden rounded-xl"
      >
        {/*  Tiêu đề  */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200">
          <DialogTitle className="text-lg font-bold text-[#08387F]">Phân công giảng viên vào chuyên ngành</DialogTitle>
          <p className="text-sm text-slate-500 mt-0.5">
            Chọn giảng viên ở cột trái → chọn chuyên ngành ở cột phải → nhấn <strong className="text-slate-700">Gán</strong>.
          </p>
        </div>

        {/*  Thân: 2 cột  */}
        <div className="flex divide-x divide-slate-200" style={{ height: '62vh', minHeight: 320 }}>

          {/* CỘT TRÁI: giảng viên */}
          <div className="flex flex-col" style={{ width: '55%' }}>

            {/* Bộ lọc */}
            <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Danh sách giảng viên</p>
              <div className="flex gap-2">
                <select
                  value={leftFacultyId}
                  onChange={(e) => { setLeftFacultyId(e.target.value); setSelectedIds(new Set()) }}
                  className="flex-1 min-w-0 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
                >
                  <option value="">Tất cả khoa</option>
                  {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
                </select>
                <Input
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setSelectedIds(new Set()) }}
                  placeholder="Tên / mã GV..."
                  className="flex-1 min-w-0 h-8 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyNoMajor}
                  onChange={(e) => { setOnlyNoMajor(e.target.checked); setSelectedIds(new Set()) }}
                  className="rounded border-slate-300 accent-[#08387F]"
                />
                Chỉ hiển thị GV chưa có chuyên ngành
              </label>
            </div>

            {/* Danh sách */}
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
                      <th className="px-3 py-2 text-left font-semibold">Họ tên GV</th>
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
                            {/* Hiện chuyên ngành hiện tại nếu có */}
                            {lec.majorName && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                {lec.majorName}
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

            {/* Trạng thái chọn */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500">
                Đã chọn <strong className="text-[#08387F]">{selectedIds.size}</strong> / {lecturers.length} giảng viên
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: chuyên ngành */}
          <div className="flex flex-col" style={{ width: '45%' }}>

            {/* Bộ lọc */}
            <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chuyên ngành mục tiêu</p>
              <select
                value={rightFacultyId}
                onChange={(e) => { setRightFacultyId(e.target.value); setTargetMajorId('') }}
                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                <option value="">Tất cả khoa</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
              </select>
            </div>

            {/* Danh sách chuyên ngành */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {filteredMajors.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Không có chuyên ngành.</p>
              ) : (
                <ul>
                  {filteredMajors.map((m) => {
                    const active = targetMajorId === m.id
                    return (
                      <li
                        key={m.id}
                        onClick={() => setTargetMajorId(m.id)}
                        className={`px-4 py-3 cursor-pointer border-b border-slate-100 flex items-center gap-3 transition-colors ${active ? 'bg-[#08387F]' : 'hover:bg-slate-50'}`}
                      >
                        {/* Radio giả */}
                        <span className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-white' : 'border-slate-300'}`}>
                          {active && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-slate-800'}`}>{m.majorName}</p>
                          <p className={`text-xs mt-0.5 truncate ${active ? 'text-blue-200' : 'text-slate-400'}`}>{m.facultyName}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Chuyên ngành đang chọn */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 shrink-0">
              {targetMajor ? (
                <p className="text-xs">
                  <span className="text-slate-500">Đang chọn: </span>
                  <strong className="text-[#08387F]">{targetMajor.majorName}</strong>
                  <span className="text-slate-400"> — {targetMajor.facultyName}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">Chưa chọn chuyên ngành</p>
              )}
            </div>
          </div>
        </div>

        {/*  Footer: nút hành động  */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white shrink-0">
          <p className="text-sm text-slate-500 truncate mr-4">
            {selectedIds.size > 0 && targetMajorId
              ? <span>Gán <strong className="text-slate-800">{selectedIds.size} GV</strong> → <strong className="text-[#08387F]">{targetMajor?.majorName}</strong></span>
              : <span className="text-slate-400">Chọn giảng viên và chuyên ngành để bắt đầu</span>
            }
          </p>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
            <Button
              type="button"
              className="bg-[#08387F] text-white hover:bg-[#072f6a]"
              onClick={handleAssign}
              disabled={assigning || selectedIds.size === 0 || !targetMajorId}
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

// 
// Trang chính: Quản lý chuyên ngành (Admin)
// 
export default function AdminMajorManagement() {
  const [majors, setMajors]           = useState([])
  const [faculties, setFaculties]     = useState([])
  const [loading, setLoading]         = useState(false)
  const [submitting, setSubmitting]   = useState(false)

  // Dialog tạo
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm]   = useState({ majorName: '', facultyId: '' })

  // Dialog sửa
  const [isEditOpen, setIsEditOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [editForm, setEditForm]       = useState({ majorName: '', facultyId: '' })

  // Dialog xóa
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Dialog phân công giảng viên (2 cột)
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  // Import Excel
  const importInputRef = useRef(null)
  const [importing, setImporting]     = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [isImportResultOpen, setIsImportResultOpen] = useState(false)

  const fetchMajors = async () => {
    setLoading(true)
    try {
      const data = await majorService.listAll()
      setMajors(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được danh sách chuyên ngành')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMajors()
    facultyService.list().then(setFaculties).catch(() => {})
  }, [])

  //  Tạo 
  const handleCreate = async () => {
    if (!createForm.majorName.trim() || !createForm.facultyId) {
      toast.error('Vui lòng nhập tên chuyên ngành và chọn khoa')
      return
    }
    setSubmitting(true)
    try {
      await majorService.create({ majorName: createForm.majorName.trim(), facultyId: createForm.facultyId })
      toast.success('Tạo chuyên ngành thành công')
      setIsCreateOpen(false)
      setCreateForm({ majorName: '', facultyId: '' })
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo chuyên ngành thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  //  Sửa 
  const openEdit = (m) => {
    setEditTarget(m)
    setEditForm({ majorName: m.majorName, facultyId: m.facultyId })
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editForm.majorName.trim() || !editForm.facultyId) {
      toast.error('Vui lòng nhập tên chuyên ngành và chọn khoa')
      return
    }
    setSubmitting(true)
    try {
      await majorService.update(editTarget.id, { majorName: editForm.majorName.trim(), facultyId: editForm.facultyId })
      toast.success('Cập nhật chuyên ngành thành công')
      setIsEditOpen(false)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  //  Xóa 
  const openDelete = (m) => {
    setDeleteTarget(m)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await majorService.remove(deleteTarget.id)
      toast.success(`Đã xóa chuyên ngành "${deleteTarget.majorName}"`)
      setIsDeleteOpen(false)
      setDeleteTarget(null)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  //  Khóa / Mở khóa 
  const handleToggleLock = async (m) => {
    const action = m.isLock ? 'mở khóa' : 'khóa'
    if (!window.confirm(`Bạn có chắc muốn ${action} chuyên ngành "${m.majorName}"?`)) return
    try {
      await majorService.toggleLock(m.id, !m.isLock)
      toast.success(`Đã ${action} chuyên ngành "${m.majorName}"`)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} thất bại`)
    }
  }

  //  Khóa / Mở khóa tất cả 
  const handleLockAll = async (isLock) => {
    const action = isLock ? 'khóa tất cả' : 'mở khóa tất cả'
    if (!window.confirm(`Bạn có chắc muốn ${action} chuyên ngành?`)) return
    try {
      const res = await majorService.lockAll(isLock)
      toast.success(res.message)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} thất bại`)
    }
  }

  //  Import Excel
  const handleDownloadTemplate = async () => {
    try {
      await majorService.downloadTemplate()
    } catch {
      toast.error('Tải template thất bại')
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const res = await majorService.importExcel(file)
      setImportResult(res.data)
      setIsImportResultOpen(true)
      fetchMajors()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import thất bại')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Thanh công cụ */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-black text-[#08387F]">Quản lý chuyên ngành</CardTitle>
          <CardDescription>Tạo, sửa, xóa chuyên ngành và phân công giảng viên.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tạo chuyên ngành
            </Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setIsAssignOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Phân công giảng viên
            </Button>
            <Button type="button" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => handleLockAll(true)}>
              <Lock className="mr-2 h-4 w-4" /> Khóa tất cả
            </Button>
            <Button type="button" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => handleLockAll(false)}>
              <Unlock className="mr-2 h-4 w-4" /> Mở khóa tất cả
            </Button>
            <Button type="button" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Tải template Excel
            </Button>
            <Button type="button" variant="outline" className="border-indigo-600 text-indigo-700 hover:bg-indigo-50" onClick={() => importInputRef.current?.click()} disabled={importing}>
              <FileUp className="mr-2 h-4 w-4" /> {importing ? 'Đang import...' : 'Import Excel'}
            </Button>
            <input ref={importInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
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
                  <TableHead>Khoa</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Số GV</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
                ) : majors.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Chưa có chuyên ngành nào.</TableCell></TableRow>
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
                    <TableCell>{m.facultyName || '—'}</TableCell>
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

                        <Button type="button" variant="ghost" size="icon-sm" title="Sửa thông tin" className="text-amber-600 hover:bg-amber-50" onClick={() => openEdit(m)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>

                        {m.isLock ? (
                          <Button type="button" variant="ghost" size="sm" title="Mở khóa" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleToggleLock(m)}>
                            <Unlock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" variant="ghost" size="sm" title="Khóa chuyên ngành" className="text-slate-500 hover:bg-slate-50" onClick={() => handleToggleLock(m)}>
                            <Lock className="h-4 w-4"/> 
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="icon-sm" title="Xóa chuyên ngành" className="text-rose-500 hover:bg-rose-50" onClick={() => openDelete(m)}>
                          <Trash2 className="h-4 w-4" /> 
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

      {/* Dialog phân công giảng viên (2 cột) */}
      <AssignLecturerDialog
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        faculties={faculties}
        majors={majors}
        onAssigned={fetchMajors}
      />

      {/* Dialog tạo chuyên ngành */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setCreateForm({ majorName: '', facultyId: '' }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo chuyên ngành mới</DialogTitle>
            <DialogDescription>Nhập tên chuyên ngành và chọn khoa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên chuyên ngành</label>
              <Input
                value={createForm.majorName}
                onChange={(e) => setCreateForm((c) => ({ ...c, majorName: e.target.value }))}
                placeholder="VD: Kỹ thuật phần mềm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Khoa</label>
              <select
                value={createForm.facultyId}
                onChange={(e) => setCreateForm((c) => ({ ...c, facultyId: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                <option value="">-- Chọn khoa --</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo chuyên ngành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog sửa chuyên ngành */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa chuyên ngành</DialogTitle>
            <DialogDescription>Cập nhật thông tin chuyên ngành.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tên chuyên ngành</label>
              <Input
                value={editForm.majorName}
                onChange={(e) => setEditForm((c) => ({ ...c, majorName: e.target.value }))}
                placeholder="VD: Kỹ thuật phần mềm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Khoa</label>
              <select
                value={editForm.facultyId}
                onChange={(e) => setEditForm((c) => ({ ...c, facultyId: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
              >
                <option value="">-- Chọn khoa --</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-amber-600 text-white hover:bg-amber-700" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa chuyên ngành <strong>"{deleteTarget?.majorName}"</strong>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog kết quả import */}
      <Dialog open={isImportResultOpen} onOpenChange={setIsImportResultOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kết quả import</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-3 max-h-[60vh] overflow-auto text-sm">
              {importResult.created.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-700 mb-1">
                    <CheckCircle2 className="h-4 w-4" /> Tạo thành công ({importResult.created.length})
                  </p>
                  <ul className="ml-6 list-disc space-y-0.5 text-slate-700">
                    {importResult.created.map((r, i) => (
                      <li key={i}>{r.majorName} <span className="text-slate-400">— {r.facultyName}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {importResult.skipped.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-amber-600 mb-1">
                    <XCircle className="h-4 w-4" /> Bỏ qua ({importResult.skipped.length})
                  </p>
                  <ul className="ml-6 list-disc space-y-0.5 text-slate-500">
                    {importResult.skipped.map((r, i) => (
                      <li key={i}>{r.majorName} <span className="text-slate-400">— {r.reason}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-red-600 mb-1">
                    <XCircle className="h-4 w-4" /> Lỗi ({importResult.errors.length})
                  </p>
                  <ul className="ml-6 list-disc space-y-0.5 text-slate-500">
                    {importResult.errors.map((r, i) => (
                      <li key={i}>{r.majorName || r.sheet} <span className="text-slate-400">— {r.reason}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => setIsImportResultOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
