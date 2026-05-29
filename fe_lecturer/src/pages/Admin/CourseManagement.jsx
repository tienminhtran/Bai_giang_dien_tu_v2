import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, FileSpreadsheet, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import courseService from '@/services/courseService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadCourseExcelTemplate } from '@/components/template_excel/courseTemplate'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const COURSE_FIELDS = [
	{ key: 'courseCode', label: 'Mã môn học', placeholder: 'VD: CNTT201' },
	{ key: 'courseName', label: 'Tên môn học', placeholder: 'VD: Lập trình NodeJS' },
	{ key: 'credits', label: 'Số tín chỉ', placeholder: 'VD: 3', type: 'number' },
	{ key: 'description', label: 'Mô tả', placeholder: 'VD: Môn học backend NodeJS Express' },
	{ key: 'isActive', label: 'Đang hoạt động (true/false)', placeholder: 'true', type: 'text' },
]

const emptyForm = {
	courseCode: '',
	courseName: '',
	credits: '',
	description: '',
	isActive: true,
}

const parseBoolean = (value) => {
	if (typeof value === 'boolean') return value
	const text = String(value ?? '').trim().toLowerCase()
	return ['true', '1', 'yes', 'y', 'on', 'active', 'đang hoạt động'].includes(text)
}

const getCellValue = (row, keys) => {
	for (const key of keys) {
		if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key]
	}
	return ''
}

const mapRowsToCourses = (rows) => rows.map((row) => ({
	courseCode: String(getCellValue(row, ['Mã môn học', 'course_code', 'courseCode'])).trim(),
	courseName: String(getCellValue(row, ['Tên môn học', 'course_name', 'courseName'])).trim(),
	credits: getCellValue(row, ['Số tín chỉ', 'credits']),
	description: String(getCellValue(row, ['Mô tả', 'description'])).trim(),
	isActive: parseBoolean(getCellValue(row, ['Đang hoạt động', 'is_active', 'isActive'])),
}))

function AddCourseDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, title = 'Thêm môn học', description = 'Nhập thông tin môn học', submitLabel = 'Lưu môn học' }) {
	const update = (field) => (e) => onFormChange((prev) => ({ ...prev, [field]: field === 'isActive' ? parseBoolean(e.target.value) : e.target.value }))

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2 sm:grid-cols-2">
					{COURSE_FIELDS.map(({ key, label, placeholder, type }) => (
						<div key={key} className="space-y-2 sm:col-span-1">
							<label className="text-sm font-semibold">{label}</label>
							<Input type={type || 'text'} value={form[key]} onChange={update(key)} placeholder={placeholder} />
						</div>
					))}
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

function ImportCourseDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting, importedRows }) {
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
					<DialogDescription>Tải file mẫu, chọn file Excel và nhập danh sách môn học từ vùng tải lên bên dưới.</DialogDescription>
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
						<p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls, .csv</p>
					</div>
					{importFile
						? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
						: <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>
					}
					<Input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
					<p className="text-sm text-slate-600">Tải file mẫu để điền đúng định dạng trước khi nhập.</p>
					<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={downloadCourseExcelTemplate}>
						<Download className="mr-2 h-4 w-4" />
						Tải file Excel mẫu
					</Button>
				</div>

				{importResult && (
					<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap gap-2 text-sm font-medium">
							<span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Tổng: {importResult.total}</span>
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
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Loại lỗi</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
											</tr>
										</thead>
										<tbody>
											{importResult.errors.map((err) => (
												<tr key={`${err.row}-${err.course_code}-${err.message}`} className="border-b border-slate-100 last:border-0">
													<td className="px-3 py-1.5 text-slate-600">{err.row}</td>
													<td className="px-3 py-1.5 text-slate-800">{err.course_code || '—'}</td>
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
						{importResult.errors.length === 0 && importedRows.length > 0 && (
							<p className="text-sm text-slate-600">Đã đọc {importedRows.length} dòng từ file Excel.</p>
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

export default function CourseManagement() {
	const [rows, setRows] = useState([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
	const [searchCode, setSearchCode] = useState('')
	const [searchName, setSearchName] = useState('')
	const [addOpen, setAddOpen] = useState(false)
	const [addSubmitting, setAddSubmitting] = useState(false)
	const [addForm, setAddForm] = useState(emptyForm)
	const [importOpen, setImportOpen] = useState(false)
	const [importFile, setImportFile] = useState(null)
	const [importSubmitting, setImportSubmitting] = useState(false)
	const [importResult, setImportResult] = useState(null)
	const [importedRows, setImportedRows] = useState([])

	const totalPages = Math.max(Math.ceil(total / pageSize), 1)

	const fetchRows = async (nextPage = page, nextPageSize = pageSize, courseCode = searchCode, courseName = searchName) => {
		setLoading(true)
		try {
			const { rows: data, total: count } = await courseService.list({ courseCode, courseName, page: nextPage, pageSize: nextPageSize })
			setRows(data)
			setTotal(count)
			setPage(nextPage)
			setPageSize(nextPageSize)
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không tải được danh sách môn học')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchRows()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const refreshRows = () => fetchRows(page, pageSize, searchCode, searchName)

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
			refreshRows()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Tạo môn học thất bại')
		} finally {
			setAddSubmitting(false)
		}
	}

	const openImportDialog = () => {
		setImportOpen(true)
		setImportFile(null)
		setImportResult(null)
		setImportedRows([])
	}

	const handleImportOpenChange = (open) => {
		setImportOpen(open)
		if (!open) {
			setImportFile(null)
			setImportResult(null)
			setImportedRows([])
		}
	}

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
			const ws = wb.Sheets[wb.SheetNames[0]]
			const courses = mapRowsToCourses(XLSX.utils.sheet_to_json(ws, { defval: '' }))

			if (courses.length === 0) {
				toast.error('File Excel không có dữ liệu hợp lệ hoặc thiếu cột Mã môn học / Tên môn học')
				return
			}

			setImportedRows(courses)
			const result = await courseService.importCourses(courses)
			setImportResult(result)

			if (result.successCount > 0) refreshRows()
			if (result.errorCount === 0) {
				toast.success(`Đã nhập ${result.successCount} môn học thành công`)
				setImportOpen(false)
				setImportFile(null)
			} else {
				toast.warning(`Nhập ${result.successCount}/${result.total} thành công — ${result.errorCount} dòng lỗi`)
			}
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không đọc được file Excel hoặc lỗi kết nối')
		} finally {
			setImportSubmitting(false)
		}
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
				'Đang hoạt động': String(orig.isActive),
				'Loại lỗi': err.type || '',
				'Lỗi': err.message,
			}
		})
		const ws = XLSX.utils.json_to_sheet(rowsForExport)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Loi')
		XLSX.writeFile(wb, 'loi_import_mon_hoc.xlsx')
	}

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
							<Input value={searchCode} onChange={(e) => setSearchCode(e.target.value)} placeholder="Nhập mã môn học" onKeyDown={(e) => e.key === 'Enter' && fetchRows(1, pageSize, e.currentTarget.value, searchName)} />
						</div>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Tên môn học</label>
							<Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Nhập tên môn học" onKeyDown={(e) => e.key === 'Enter' && fetchRows(1, pageSize, searchCode, e.currentTarget.value)} />
						</div>
						<div className="flex items-end">
							<Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => fetchRows(1, pageSize)}>
								<Search className="mr-2 h-4 w-4" /> Tìm
							</Button>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={() => setAddOpen(true)}>
							<Plus className="mr-2 h-4 w-4" /> Thêm môn học
						</Button>
						<Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={openImportDialog}>
							<FileSpreadsheet className="mr-2 h-4 w-4" /> Thêm bằng Excel
						</Button>
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={downloadCourseExcelTemplate}>
							<Download className="mr-2 h-4 w-4" /> Tải file mẫu
						</Button>
					</div>

					<Separator />

					<div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
						<Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
							Tổng: {total}
						</Badge>
					</div>
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
									<TableHead className="w-[180px]">Mã môn học</TableHead>
									<TableHead>Tên môn học</TableHead>
									<TableHead className="w-[120px]">Số tín chỉ</TableHead>
									<TableHead>Mô tả</TableHead>
									<TableHead className="w-[140px]">Trạng thái</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={5} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
									</TableRow>
								) : rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="py-8 text-center text-slate-500">Không tìm thấy môn học phù hợp.</TableCell>
									</TableRow>
								) : rows.map((course) => (
									<TableRow key={course.id}>
										<TableCell className="font-medium text-slate-900">{course.courseCode}</TableCell>
										<TableCell>{course.courseName}</TableCell>
										<TableCell>{course.credits || '—'}</TableCell>
										<TableCell className="max-w-[360px] truncate">{course.description || '—'}</TableCell>
										<TableCell>
											<Badge className={course.isActive
											? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
											: 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
										}>
											{course.isActive ? 'Đang hoạt động' : 'Đã khóa'}
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
								onChange={(e) => fetchRows(1, Number(e.target.value), searchCode, searchName)}
								className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
							>
								{PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
							</select>
							<span>/ trang — {total} môn học</span>
						</div>

						<Pagination className="w-auto justify-end">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) fetchRows(page - 1, pageSize, searchCode, searchName) }} className={page <= 1 ? 'pointer-events-none opacity-40' : ''} />
								</PaginationItem>
								{pageNumbers.map((item, index) => (
									<PaginationItem key={`${item}-${index}`}>
										{item === '...'
											? <PaginationEllipsis />
											: <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); fetchRows(item, pageSize, searchCode, searchName) }}>{item}</PaginationLink>}
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) fetchRows(page + 1, pageSize, searchCode, searchName) }} className={page >= totalPages ? 'pointer-events-none opacity-40' : ''} />
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
			/>
		</div>
	)
}