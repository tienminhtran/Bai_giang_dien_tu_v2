import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { BadgeInfo, Download, Edit, FileSpreadsheet, LayoutGrid, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import courseService from '@/services/courseService'
import facultyService from '@/services/facultyService'
import majorService from '@/services/majorService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadCourseExcelTemplate } from '@/components/template_excel/courseTemplate'
import { useUrlState } from '@/hooks'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SELECT_CLS = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]'

const emptyForm = {
	courseCode: '',
	courseName: '',
	credits: '',
	description: '',
	facultyId: '',
	majorId: '',
	isActive: true,
}

//  Dialog thêm / sửa môn học
function AddCourseDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, faculties, majors = [], title = 'Thêm môn học', description = 'Nhập thông tin môn học', submitLabel = 'Lưu môn học' }) {
	const set = (field, value) => onFormChange((prev) => ({ ...prev, [field]: value }))
	const filteredMajors = majors.filter((m) => m.facultyId === form.facultyId)

	const handleFacultyChange = (e) => {
		onFormChange((prev) => ({ ...prev, facultyId: e.target.value, majorId: '' }))
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2 sm:grid-cols-2">
					{/* Mã môn học */}
					<div className="space-y-2">
						<label className="text-sm font-semibold">Mã môn học</label>
						<Input value={form.courseCode} onChange={(e) => set('courseCode', e.target.value)} placeholder="VD: CNTT201" />
					</div>

					{/* Tên môn học */}
					<div className="space-y-2">
						<label className="text-sm font-semibold">Tên môn học</label>
						<Input value={form.courseName} onChange={(e) => set('courseName', e.target.value)} placeholder="VD: Lập trình NodeJS" />
					</div>

					{/* Số tín chỉ */}
					<div className="space-y-2">
						<label className="text-sm font-semibold">Số tín chỉ</label>
						<Input type="number" value={form.credits} onChange={(e) => set('credits', e.target.value)} placeholder="VD: 3" />
					</div>

					{/* Khoa chủ quản */}
					<div className="space-y-2">
						<label className="text-sm font-semibold">Khoa chủ quản</label>
						<select value={form.facultyId} onChange={handleFacultyChange} className={SELECT_CLS}>
							<option value="">-- Chọn khoa --</option>
							{faculties.map((f) => (
								<option key={f.id} value={f.id}>{f.facultyName}</option>
							))}
						</select>
					</div>

					{/* Bộ môn (chuyên ngành) */}
					<div className="space-y-2 sm:col-span-2">
						<label className="text-sm font-semibold">Bộ môn / Chuyên ngành</label>
						<select value={form.majorId} onChange={(e) => set('majorId', e.target.value)} className={SELECT_CLS}
							disabled={!form.facultyId || filteredMajors.length === 0}>
							<option value="">-- Chọn bộ môn --</option>
							{filteredMajors.map((m) => (
								<option key={m.id} value={m.id}>{m.majorName}</option>
							))}
						</select>
						{!form.facultyId && (
							<p className="text-xs text-slate-400">Chọn khoa trước để lọc bộ môn.</p>
						)}
					</div>

					{/* Mô tả */}
					<div className="space-y-2 sm:col-span-2">
						<label className="text-sm font-semibold">Mô tả</label>
						<Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="VD: Môn học backend NodeJS Express" />
					</div>

					{/* Trạng thái */}
					<div className="space-y-2">
						<label className="text-sm font-semibold">Trạng thái</label>
						<select
							value={form.isActive ? 'true' : 'false'}
							onChange={(e) => set('isActive', e.target.value === 'true')}
							className={SELECT_CLS}
						>
							<option value="true">Đang hoạt động</option>
							<option value="false">Không hoạt động</option>
						</select>
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
					<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
						{submitting ? 'Đang lưu...' : submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

//  Dialog import Excel 
function ImportCourseDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting, importedRows, faculties, onDownloadTemplate }) {
	const inputRef = useRef(null)

	const handleZoneClick = () => inputRef.current?.click()
	const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
	const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) onFileChange(file) }
	const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file) onFileChange(file); e.target.value = '' }

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Import môn học bằng Excel</DialogTitle>
					<DialogDescription>
						Tải file mẫu (mỗi sheet = 1 khoa), điền dữ liệu rồi upload. Trạng thái mặc định là <strong>Đang hoạt động</strong>.
					</DialogDescription>
				</DialogHeader>

				<div
					role="button"
					tabIndex={0}
					onClick={handleZoneClick}
					onKeyDown={handleZoneKeyDown}
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
					className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#08387F]/30 bg-[#08387F]/5 px-6 py-8 text-center transition-colors hover:border-[#08387F] hover:bg-[#08387F]/10 focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
				>
					<div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-[#08387F]/15">
						<FileSpreadsheet className="h-7 w-7 text-[#08387F]" />
					</div>
					<div className="space-y-1">
						<p className="text-base font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
						<p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls</p>
					</div>
					{importFile
						? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
						: <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>
					}
					<Input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
					<div className="space-y-0.5">
						<p className="text-sm font-medium text-slate-700">File mẫu nhiều sheet (mỗi sheet = 1 khoa)</p>
						<p className="text-xs text-slate-500">Cột: Mã môn học, Tên môn học, Số tín chỉ, Mô tả, Tên chuyên ngành</p>
					</div>
					<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={onDownloadTemplate}>
						<Download className="mr-2 h-4 w-4" />
						Tải file Excel mẫu
					</Button>
				</div>

				{importResult && (
					<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap gap-2 text-sm font-medium">
							<span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Tổng: {importResult.total ?? (importResult.successCount + importResult.errorCount)}</span>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Thành công: {importResult.successCount}</span>
							{importResult.errorCount > 0 && (
								<span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Lỗi: {importResult.errorCount}</span>
							)}
						</div>

						{importResult.errors.length > 0 && (
							<>
								<div className="max-h-56 overflow-auto rounded-lg border border-rose-200 bg-white">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-rose-100 bg-rose-50">
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Dòng</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Mã môn học</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Sheet (Khoa)</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Loại lỗi</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
											</tr>
										</thead>
										<tbody>
											{importResult.errors.map((err, i) => (
												<tr key={i} className="border-b border-slate-100 last:border-0">
													<td className="px-3 py-1.5 text-slate-600">{err.row}</td>
													<td className="px-3 py-1.5 text-slate-800">{err.course_code || '—'}</td>
													<td className="px-3 py-1.5 text-slate-600">{err.sheet || '—'}</td>
													<td className="px-3 py-1.5 text-slate-600">{err.type || '—'}</td>
													<td className="px-3 py-1.5 text-rose-600">{err.message}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<Button type="button" variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={onDownloadErrors}>
									<Download className="mr-2 h-3.5 w-3.5" />
									Tải file lỗi về
								</Button>
							</>
						)}
						{importResult.errors.length === 0 && (
							<p className="text-sm text-slate-600">Tất cả {importResult.successCount} môn học đã được nhập thành công.</p>
						)}
					</div>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
					<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onImport} disabled={submitting}>
						{submitting ? 'Đang nhập...' : 'Nhập môn học'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

//  Main page
const URL_DEFAULTS = { page: 1, pageSize: PAGE_SIZE_OPTIONS[0] }

export default function CourseManagement() {
	const navigate = useNavigate()
	//  URL state (page, pageSize, filter đã apply)
	const { get, set, resetPage, searchParams } = useUrlState(URL_DEFAULTS)
	const page     = Number(get('page'))     || 1
	const pageSize = Number(get('pageSize')) || PAGE_SIZE_OPTIONS[0]

	//  Draft filter (người dùng đang gõ, chưa apply) 
	const [draftCode, setDraftCode] = useState(() => get('courseCode'))
	const [draftName, setDraftName] = useState(() => get('courseName'))

	// refreshKey: tăng sau mỗi mutation để force re-fetch khi page đã là 1
	const [refreshKey, setRefreshKey] = useState(0)

	//  Data state 
	const [rows, setRows] = useState([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(false)
	const [faculties, setFaculties] = useState([])
	const [majors, setMajors] = useState([])

	//  Dialog state
	const [addOpen, setAddOpen] = useState(false)
	const [addSubmitting, setAddSubmitting] = useState(false)
	const [addForm, setAddForm] = useState(emptyForm)

	const [editOpen, setEditOpen] = useState(false)
	const [editSubmitting, setEditSubmitting] = useState(false)
	const [editForm, setEditForm] = useState(emptyForm)
	const [editId, setEditId] = useState(null)

	const [importOpen, setImportOpen] = useState(false)
	const [importFile, setImportFile] = useState(null)
	const [importSubmitting, setImportSubmitting] = useState(false)
	const [importResult, setImportResult] = useState(null)
	const [importedRows, setImportedRows] = useState([])

	const [countManagerOpen, setCountManagerOpen] = useState(false)
	const [countManagerCourse, setCountManagerCourse] = useState(null)
	const [countManagerValue, setCountManagerValue] = useState(1)
	const [countManagerSubmitting, setCountManagerSubmitting] = useState(false)

	const totalPages = Math.max(Math.ceil(total / pageSize), 1)

	//  Load faculties + majors 1 lần
	useEffect(() => {
		facultyService.list().then(setFaculties).catch(() => {})
		majorService.listAll().then(setMajors).catch(() => {})
	}, [])

	//  Fetch courses — chạy mỗi khi URL hoặc refreshKey đổi 
	useEffect(() => {
		const courseCode = searchParams.get('courseCode') || ''
		const courseName = searchParams.get('courseName') || ''
		setLoading(true)
		courseService.list({ courseCode, courseName, page, pageSize })
			.then(({ rows: data, total: count }) => { setRows(data); setTotal(count) })
			.catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách môn học'))
			.finally(() => setLoading(false))
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, refreshKey])

	// Sau thêm/xóa/import: về trang 1 (item mới ở trang 1, hoặc trang hiện tại có thể trống sau xóa)
	const afterMutation = useCallback(() => {
		resetPage()
		setRefreshKey((k) => k + 1)
	}, [resetPage])

	// Sau khi sửa 1 dòng có sẵn: giữ nguyên trang đang xem, chỉ re-fetch
	const refreshKeepPage = useCallback(() => {
		setRefreshKey((k) => k + 1)
	}, [])

	//  Search 
	const applySearch = () => resetPage({ courseCode: draftCode.trim(), courseName: draftName.trim() })

	//  Add 
	const handleAddCourse = async () => {
		if (!addForm.courseCode.trim() || !addForm.courseName.trim()) {
			toast.error('Vui lòng nhập mã môn học và tên môn học')
			return
		}
		try {
			setAddSubmitting(true)
			await courseService.create(addForm)
			toast.success('Tạo môn học thành công')
			setAddOpen(false)
			setAddForm(emptyForm)
			afterMutation()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Tạo môn học thất bại')
		} finally {
			setAddSubmitting(false)
		}
	}

	//  Edit 
	const openEdit = (course) => {
		setEditId(course.id)
		setEditForm({
			courseCode: course.courseCode,
			courseName: course.courseName,
			credits: course.credits ?? '',
			description: course.description || '',
			facultyId: course.facultyId || '',
			majorId: course.majorId || '',
			isActive: course.isActive,
		})
		setEditOpen(true)
	}

	const handleEditCourse = async () => {
		if (!editForm.courseCode.trim() || !editForm.courseName.trim()) {
			toast.error('Vui lòng nhập mã môn học và tên môn học')
			return
		}
		try {
			setEditSubmitting(true)
			await courseService.update(editId, editForm)
			toast.success('Cập nhật môn học thành công')
			setEditOpen(false)
			refreshKeepPage()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Cập nhật môn học thất bại')
		} finally {
			setEditSubmitting(false)
		}
	}

	//  Delete 
	const handleDelete = (course) => {
		if (!window.confirm(`Bạn có chắc muốn xóa môn học "${course.courseName}"?`)) return
		courseService.delete(course.id)
			.then(() => { toast.success('Xóa môn học thành công'); afterMutation() })
			.catch((err) => toast.error(err?.response?.data?.message || 'Xóa môn học thất bại'))
	}

	//  Count Manager 
	const openCountManagerEdit = (course) => {
		setCountManagerCourse(course)
		setCountManagerValue(course.countManager ?? 1)
		setCountManagerOpen(true)
	}

	const handleUpdateCountManager = async () => {
		const val = Number(countManagerValue)
		if (!Number.isInteger(val) || val < 1) {
			toast.error('Giá trị phải là số nguyên >= 1')
			return
		}
		try {
			setCountManagerSubmitting(true)
			await courseService.updateCountManager(countManagerCourse.id, val)
			toast.success('Cập nhật giới hạn manager thành công')
			setCountManagerOpen(false)
			refreshKeepPage()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
		} finally {
			setCountManagerSubmitting(false)
		}
	}

	//  Import 
	const handleImport = async () => {
		if (!importFile) {
			toast.error('Vui lòng chọn file Excel trước khi nhập')
			return
		}
		try {
			setImportSubmitting(true)
			setImportResult(null)

			const data = await importFile.arrayBuffer()
			const wb = XLSX.read(data, { type: 'array' })

			const facultyMap = {}
			faculties.forEach((f) => { facultyMap[f.facultyName.trim().toLowerCase()] = f.id })

			const allCourses = []
			const sheetErrors = []

			for (const sheetName of wb.SheetNames) {
				const facultyId = facultyMap[sheetName.trim().toLowerCase()]
				if (!facultyId) {
					sheetErrors.push({ row: '—', course_code: '—', sheet: sheetName, type: 'Không tìm thấy khoa', message: `Sheet "${sheetName}" không khớp với tên khoa nào trong hệ thống` })
					continue
				}
				const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })
				for (const row of sheetRows) {
					allCourses.push({
						courseCode: String(row['Mã môn học'] ?? '').trim(),
						courseName: String(row['Tên môn học'] ?? '').trim(),
						credits: row['Số tín chỉ'],
						description: String(row['Mô tả'] ?? '').trim(),
						majorName: String(row['Tên chuyên ngành'] ?? row['Bộ môn'] ?? '').trim(),
						facultyId,
						isActive: true,
						_sheet: sheetName,
					})
				}
			}

			if (allCourses.length === 0 && sheetErrors.length === 0) {
				toast.error('File Excel không có dữ liệu hợp lệ')
				return
			}

			setImportedRows(allCourses)
			const result = await courseService.importCourses(allCourses)

			const enrichedErrors = [
				...sheetErrors,
				...result.errors.map((e) => ({ ...e, sheet: allCourses[e.row - 1]?._sheet || '—' })),
			]
			const finalResult = {
				total: (result.total ?? result.successCount + result.errorCount) + sheetErrors.length,
				successCount: result.successCount,
				errorCount: result.errorCount + sheetErrors.length,
				errors: enrichedErrors,
			}
			setImportResult(finalResult)

			if (result.successCount > 0) afterMutation()
			if (finalResult.errorCount === 0) {
				toast.success(`Đã nhập ${result.successCount} môn học thành công`)
				setImportOpen(false)
				setImportFile(null)
			} else {
				toast.warning(`Nhập ${result.successCount}/${finalResult.total} thành công — ${finalResult.errorCount} lỗi`)
			}
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không đọc được file Excel hoặc lỗi kết nối')
		} finally {
			setImportSubmitting(false)
		}
	}

	const handleImportOpenChange = (open) => {
		setImportOpen(open)
		if (!open) { setImportFile(null); setImportResult(null); setImportedRows([]) }
	}

	const downloadErrors = () => {
		if (!importResult?.errors?.length) return
		const rowsForExport = importResult.errors.map((err) => {
			const orig = importedRows[err.row - 1] || {}
			return {
				'Dòng': err.row,
				'Mã môn học': err.course_code || orig.courseCode || '',
				'Tên môn học': orig.courseName || '',
				'Số tín chỉ': orig.credits || '',
				'Mô tả': orig.description || '',
				'Sheet (Khoa)': err.sheet || '',
				'Loại lỗi': err.type || '',
				'Lỗi': err.message,
			}
		})
		const ws = XLSX.utils.json_to_sheet(rowsForExport)
		const wbOut = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wbOut, ws, 'Loi')
		XLSX.writeFile(wbOut, 'loi_import_mon_hoc.xlsx')
	}

	//  Pagination helpers 
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
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-black text-[#08387F]">Quản lý môn học</CardTitle>
					<CardDescription>Tra cứu, thêm mới và import/export Excel danh sách môn học.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Mã môn học</label>
							<Input value={draftCode} onChange={(e) => setDraftCode(e.target.value)} placeholder="Nhập mã môn học" onKeyDown={(e) => e.key === 'Enter' && applySearch()} />
						</div>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Tên môn học</label>
							<Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Nhập tên môn học" onKeyDown={(e) => e.key === 'Enter' && applySearch()} />
						</div>
						<div className="flex items-end">
							<Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={applySearch}>
								<Search className="mr-2 h-4 w-4" /> Tìm
							</Button>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => setAddOpen(true)}>
							<Plus className="mr-2 h-4 w-4" /> Thêm môn học
						</Button>
						<Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={() => { setImportOpen(true); setImportFile(null); setImportResult(null); setImportedRows([]) }}>
							<FileSpreadsheet className="mr-2 h-4 w-4" /> Thêm bằng Excel
						</Button>
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => downloadCourseExcelTemplate(faculties)}>
							<Download className="mr-2 h-4 w-4" /> Tải file mẫu
						</Button>
					</div>

					<Separator />

					<Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
						Tổng: {total}
					</Badge>
				</CardContent>
			</Card>

			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-bold text-slate-900">Danh sách môn học</CardTitle>
					<CardDescription>Kết quả lọc theo mã môn học và tên môn học.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="w-full rounded-none border border-slate-200">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[140px]">Mã môn học</TableHead>
									<TableHead>Tên môn học</TableHead>
									<TableHead className="w-[100px]">Số tín chỉ</TableHead>
									<TableHead className="w-[180px]">Khoa chủ quản</TableHead>
									<TableHead className="w-[180px]">Bộ môn</TableHead>
									{/* <TableHead>Mô tả</TableHead> */}
									<TableHead className="w-[120px]">Manager tối đa</TableHead>
									<TableHead className="w-[140px]">Trạng thái</TableHead>
									<TableHead className="w-[80px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell></TableRow>
								) : rows.length === 0 ? (
									<TableRow><TableCell colSpan={8} className="py-8 text-center text-slate-500">Không tìm thấy môn học phù hợp.</TableCell></TableRow>
								) : rows.map((course) => (
									<TableRow key={course.id}>
										<TableCell className="font-medium text-slate-900">{course.courseCode}</TableCell>
										<TableCell>{course.courseName}</TableCell>
										<TableCell>{course.credits || '—'}</TableCell>
										<TableCell className="max-w-[180px] truncate text-slate-600">{course.facultyName || '—'}</TableCell>
										<TableCell className="max-w-[180px] truncate text-slate-600">{course.majorName || '—'}</TableCell>
										{/* <TableCell className="max-w-[300px] truncate">{course.description || '—'}</TableCell> */}
										<TableCell>
											<div className="flex items-center gap-1">
												<span className="font-mono text-sm font-semibold text-slate-700">Số GV: {course.countManager}</span>
												<Button type="button" variant="ghost" size="icon-sm" title="Cập nhật giới hạn manager" onClick={() => openCountManagerEdit(course)}>
													<BadgeInfo className="h-5 w-5 text-blue-600 hover:text-[#08387F]" />
												</Button>
											</div>
										</TableCell>
										<TableCell>
											<Badge className={course.isActive
												? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
												: 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'}>
												{course.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
											</Badge>
										</TableCell>
										<TableCell>
											<Button type="button" variant="ghost" size="icon-sm" title="Xem chi tiết" onClick={() => navigate(`/dashboard/admin/courses/${course.courseCode}/detail`, { state: { course } })}>
												<LayoutGrid className="h-4 w-4 text-blue-500" />
											</Button>
											<Button type="button" variant="ghost" size="icon-sm" title="Sửa thông tin" onClick={() => openEdit(course)}>
												<Edit className="h-4 w-4 text-blue-500" />
											</Button>
											<Button type="button" variant="ghost" size="icon-sm" title="Xóa môn học" onClick={() => handleDelete(course)}>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
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
									<PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) set({ page: page - 1 }) }} className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
								</PaginationItem>
								{pageNumbers.map((item, index) => (
									<PaginationItem key={`${item}-${index}`}>
										{item === '...'
											? <PaginationEllipsis />
											: <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); set({ page: item }) }}>{item}</PaginationLink>}
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) set({ page: page + 1 }) }} className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				</CardContent>
			</Card>

			<AddCourseDialog
				isOpen={addOpen}
				onOpenChange={(open) => { setAddOpen(open); if (!open) setAddForm(emptyForm) }}
				form={addForm}
				onFormChange={setAddForm}
				onSubmit={handleAddCourse}
				submitting={addSubmitting}
				faculties={faculties}
				majors={majors}
			/>

			<AddCourseDialog
				isOpen={editOpen}
				onOpenChange={(open) => { setEditOpen(open); if (!open) setEditId(null) }}
				form={editForm}
				onFormChange={setEditForm}
				onSubmit={handleEditCourse}
				submitting={editSubmitting}
				faculties={faculties}
				majors={majors}
				title="Chỉnh sửa môn học"
				description="Cập nhật thông tin môn học"
				submitLabel="Lưu thay đổi"
			/>

			<ImportCourseDialog
				isOpen={importOpen}
				onOpenChange={handleImportOpenChange}
				importFile={importFile}
				onFileChange={setImportFile}
				importResult={importResult}
				onImport={handleImport}
				onDownloadErrors={downloadErrors}
				submitting={importSubmitting}
				importedRows={importedRows}
				faculties={faculties}
				onDownloadTemplate={() => downloadCourseExcelTemplate(faculties)}
			/>

			{/* Dialog cập nhật giới hạn manager */}
			<Dialog open={countManagerOpen} onOpenChange={(open) => { setCountManagerOpen(open); if (!open) setCountManagerCourse(null) }}>
				<DialogContent className="sm:max-w-xs">
					<DialogHeader>
						<DialogTitle>Giới hạn Manager</DialogTitle>
						<DialogDescription>
							{countManagerCourse?.courseName} ({countManagerCourse?.courseCode})
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<label className="text-sm font-semibold">Số manager tối đa</label>
						<Input
							type="number"
							min={1}
							value={countManagerValue}
							onChange={(e) => setCountManagerValue(Number(e.target.value))}
							onKeyDown={(e) => e.key === 'Enter' && handleUpdateCountManager()}
						/>
						<p className="text-xs text-slate-500">Tối thiểu 1. Hệ thống sẽ từ chối phân công manager thứ {countManagerValue + 1} trở lên.</p>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setCountManagerOpen(false)}>Hủy</Button>
						<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleUpdateCountManager} disabled={countManagerSubmitting}>
							{countManagerSubmitting ? 'Đang lưu...' : 'Lưu'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
