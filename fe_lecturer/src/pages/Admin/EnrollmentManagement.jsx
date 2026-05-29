import * as XLSX from 'xlsx'
import { Search, X } from 'lucide-react'
import { toast } from 'sonner'
import enrollmentService from '@/services/enrollmentService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { useEnrollmentList, PAGE_SIZE_OPTIONS } from '@/features/enrollment/hooks/useEnrollmentList'
import { useEnrollmentImport } from '@/features/enrollment/hooks/useEnrollmentImport'
import { EnrollmentActionBar } from '@/features/enrollment/components/EnrollmentActionBar'
import { EnrollmentTable } from '@/features/enrollment/components/EnrollmentTable'
import { ImportEnrollmentDialog } from '@/features/enrollment/components/ImportEnrollmentDialog'

const downloadEnrollmentTemplate = () => {
	const sample = [
		{ 'Mã số sinh viên': '21010611', 'Mã môn học': '010113', 'Năm học': '2025-2026', 'Kỳ học': 2, 'Loại đăng ký': 'new' },
		{ 'Mã số sinh viên': '21010612', 'Mã môn học': '010113', 'Năm học': '2025-2026', 'Kỳ học': 2, 'Loại đăng ký': 'retake' },
		{ 'Mã số sinh viên': '21010613', 'Mã môn học': '010113', 'Năm học': '2025-2026', 'Kỳ học': 2, 'Loại đăng ký': 'improve' },
	]
	const ws = XLSX.utils.json_to_sheet(sample)
	ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 18 }]
	const wb = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(wb, ws, 'GhiDanh')
	XLSX.writeFile(wb, 'mau_import_ghi_danh.xlsx')
}

export default function EnrollmentManagement() {
	const list = useEnrollmentList()
	const imp  = useEnrollmentImport({ onSuccess: list.refresh })

	const handleExportExcel = async () => {
		const loadingToast = toast.loading('Đang tải dữ liệu để xuất Excel...')
		try {
			const { total }   = await enrollmentService.list({ ...list.filters, page: 1, pageSize: 1 })
			const { rows }    = await enrollmentService.list({ ...list.filters, page: 1, pageSize: Math.max(total, 1) })

			const data = rows.map((e, i) => ({
				STT:               i + 1,
				'Mã sinh viên':    e.studentCode,
				'Họ tên':          e.fullName,
				'Mã môn học':      e.courseCode,
				'Tên môn học':     e.courseName,
				'Năm học':         e.academicYear,
				'Kỳ học':          e.semester,
				'Loại đăng ký':    e.enrollmentTypeLabel,
				'Ngày đăng ký':    e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('vi-VN') : '',
			}))

			const ws = XLSX.utils.json_to_sheet(data)
			ws['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 36 }, { wch: 12 }, { wch: 6 }, { wch: 16 }, { wch: 14 }]
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'GhiDanh')
			XLSX.writeFile(wb, 'danh_sach_ghi_danh.xlsx')
			toast.dismiss(loadingToast)
			toast.success('Đã xuất Excel')
		} catch (err) {
			toast.dismiss(loadingToast)
			toast.error(err?.response?.data?.message || 'Xuất Excel thất bại')
		}
	}

	const { filters, setFilters } = list

	return (
		<div className="space-y-6">
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-black text-[#08387F]">Đăng ký học phần</CardTitle>
					<CardDescription>Tra cứu, import/export danh sách sinh viên đăng ký học phần.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Filter bar */}
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Mã sinh viên</label>
							<Input value={filters.studentCode} onChange={(e) => setFilters((f) => ({ ...f, studentCode: e.target.value }))} placeholder="Nhập MSSV" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Họ tên</label>
							<Input value={filters.fullName} onChange={(e) => setFilters((f) => ({ ...f, fullName: e.target.value }))} placeholder="Nhập họ tên" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Mã môn học</label>
							<Input value={filters.courseCode} onChange={(e) => setFilters((f) => ({ ...f, courseCode: e.target.value }))} placeholder="VD: 010113" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Tên môn học</label>
							<Input value={filters.courseName} onChange={(e) => setFilters((f) => ({ ...f, courseName: e.target.value }))} placeholder="Nhập tên môn" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Năm học</label>
							<Input value={filters.academicYear} onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))} placeholder="VD: 2025-2026" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Học kỳ</label>
							<Input value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))} placeholder="1 | 2 | 3" onKeyDown={(e) => e.key === 'Enter' && list.handleSearch()} />
						</div>
					</div>

					<div className="flex gap-2">
						<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={list.handleSearch}>
							<Search className="mr-2 h-4 w-4" /> Tìm kiếm
						</Button>
						<Button type="button" variant="outline" onClick={list.handleReset}>
							<X className="mr-2 h-4 w-4" /> Xóa bộ lọc
						</Button>
					</div>

					<EnrollmentActionBar
						onExport={handleExportExcel}
						onDownloadTemplate={downloadEnrollmentTemplate}
						onImportOpen={() => imp.closeModal(true)}
					/>

					<Separator />

					<div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
						<Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
							Tổng: {list.total} bản ghi
						</Badge>
					</div>
				</CardContent>
			</Card>

			<EnrollmentTable
				enrollments={list.enrollments}
				loading={list.loading}
				sortConfig={list.sortConfig}
				onSort={list.handleSort}
				currentPage={list.currentPage}
				totalPages={list.totalPages}
				safePage={list.safePage}
				pageSize={list.pageSize}
				total={list.total}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				onPageChange={list.setCurrentPage}
				onPageSizeChange={(size) => { list.setPageSize(size); list.setCurrentPage(1) }}
				getPageNumbers={list.getPageNumbers}
			/>

			<ImportEnrollmentDialog
				isOpen={imp.isOpen}
				onOpenChange={imp.closeModal}
				importFile={imp.importFile}
				onFileChange={imp.setImportFile}
				importResult={imp.importResult}
				onImport={imp.handleImport}
				onDownloadErrors={imp.downloadErrors}
				submitting={imp.importSubmitting}
			/>
		</div>
	)
}
