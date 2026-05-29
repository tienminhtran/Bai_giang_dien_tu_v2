import { useEffect, useState } from 'react'
import { Edit, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import academicTermService from '@/services/academicTermService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SEMESTER_LABELS = { 1: 'Kỳ 1', 2: 'Kỳ 2', 3: 'Kỳ hè' }

const emptyForm = { academicYear: '', semester: '1', startDate: '', endDate: '', isActive: true }

const formatDate = (val) => {
	if (!val) return '—'
	try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

// ── Dialog thêm / sửa ──────────────────────────────────────────────────────
function TermDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit, submitting, isEdit }) {
	const update = (field) => (e) => {
		const value = field === 'isActive' ? e.target.checked : e.target.value
		onFormChange((prev) => ({ ...prev, [field]: value }))
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}</DialogTitle>
					<DialogDescription>
						{isEdit ? 'Cập nhật thông tin học kỳ.' : 'Nhập thông tin để tạo học kỳ mới.'}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2 sm:grid-cols-2">
					<div className="space-y-2 sm:col-span-2">
						<label className="text-sm font-semibold text-slate-700">
							Năm học <span className="text-rose-500">*</span>
						</label>
						<Input
							value={form.academicYear}
							onChange={update('academicYear')}
							placeholder="VD: 2025-2026"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold text-slate-700">
							Học kỳ <span className="text-rose-500">*</span>
						</label>
						<select
							value={form.semester}
							onChange={update('semester')}
							className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
						>
							<option value="1">Kỳ 1</option>
							<option value="2">Kỳ 2</option>
							<option value="3">Kỳ hè</option>
						</select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold text-slate-700">Trạng thái</label>
						<label className="flex cursor-pointer items-center gap-2 pt-2">
							<input
								type="checkbox"
								checked={form.isActive}
								onChange={update('isActive')}
								className="h-4 w-4 rounded border-slate-300 accent-[#08387F]"
							/>
							<span className="text-sm text-slate-700">Đang mở</span>
						</label>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold text-slate-700">Ngày bắt đầu</label>
						<Input type="date" value={form.startDate} onChange={update('startDate')} />
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold text-slate-700">Ngày kết thúc</label>
						<Input type="date" value={form.endDate} onChange={update('endDate')} />
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
					<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
						{submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo học kỳ'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ── Trang chính ────────────────────────────────────────────────────────────
export default function SemesterManagement() {
	const [rows, setRows]           = useState([])
	const [total, setTotal]         = useState(0)
	const [loading, setLoading]     = useState(false)
	const [page, setPage]           = useState(1)
	const [pageSize, setPageSize]   = useState(PAGE_SIZE_OPTIONS[0])

	// filters
	const [searchYear, setSearchYear]         = useState('')
	const [searchSemester, setSearchSemester] = useState('')
	const [searchActive, setSearchActive]     = useState('')

	// dialog
	const [dialogOpen, setDialogOpen]       = useState(false)
	const [dialogForm, setDialogForm]       = useState(emptyForm)
	const [dialogSubmitting, setDialogSubmitting] = useState(false)
	const [editTarget, setEditTarget]       = useState(null) // null = thêm mới

	const totalPages = Math.max(Math.ceil(total / pageSize), 1)

	const fetchRows = async (p = page, ps = pageSize, year = searchYear, sem = searchSemester, active = searchActive) => {
		setLoading(true)
		try {
			const { rows: data, total: count } = await academicTermService.list({
				academicYear: year, semester: sem, isActive: active, page: p, pageSize: ps,
			})
			setRows(data)
			setTotal(count)
			setPage(p)
			setPageSize(ps)
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không tải được danh sách học kỳ')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { fetchRows() }, []) // eslint-disable-line react-hooks/exhaustive-deps

	const refresh = () => fetchRows(page, pageSize, searchYear, searchSemester, searchActive)

	const handleSearch = () => fetchRows(1, pageSize, searchYear, searchSemester, searchActive)
	const handleReset  = () => {
		setSearchYear(''); setSearchSemester(''); setSearchActive('')
		fetchRows(1, pageSize, '', '', '')
	}

	// ── Thêm mới ──────────────────────────────────────────────────────────────
	const openAddDialog = () => {
		setEditTarget(null)
		setDialogForm(emptyForm)
		setDialogOpen(true)
	}

	// ── Sửa ────────────────────────────────────────────────────────────────────
	const openEditDialog = (term) => {
		setEditTarget(term)
		setDialogForm({
			academicYear: term.academicYear,
			semester:     String(term.semester),
			startDate:    term.startDate || '',
			endDate:      term.endDate   || '',
			isActive:     term.isActive,
		})
		setDialogOpen(true)
	}

	const handleSubmit = async () => {
		if (!dialogForm.academicYear.trim()) {
			toast.error('Vui lòng nhập năm học')
			return
		}
		try {
			setDialogSubmitting(true)
			if (editTarget) {
				await academicTermService.update(editTarget.id, dialogForm)
				toast.success('Cập nhật học kỳ thành công')
			} else {
				await academicTermService.create(dialogForm)
				toast.success('Tạo học kỳ thành công')
			}
			setDialogOpen(false)
			refresh()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Lưu học kỳ thất bại')
		} finally {
			setDialogSubmitting(false)
		}
	}

	// ── Phân trang ─────────────────────────────────────────────────────────────
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
			{/* Filter card */}
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-black text-[#08387F]">Quản lý học kỳ</CardTitle>
					<CardDescription>Tra cứu, thêm mới và chỉnh sửa thông tin học kỳ.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Filters */}
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Năm học</label>
							<Input
								value={searchYear}
								onChange={(e) => setSearchYear(e.target.value)}
								placeholder="VD: 2025-2026"
								onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Học kỳ</label>
							<select
								value={searchSemester}
								onChange={(e) => setSearchSemester(e.target.value)}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
							>
								<option value="">Tất cả</option>
								<option value="1">Kỳ 1</option>
								<option value="2">Kỳ 2</option>
								<option value="3">Kỳ hè</option>
							</select>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">Trạng thái</label>
							<select
								value={searchActive}
								onChange={(e) => setSearchActive(e.target.value)}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08387F]/30"
							>
								<option value="">Tất cả</option>
								<option value="true">Đang mở</option>
								<option value="false">Đã đóng</option>
							</select>
						</div>

						<div className="flex items-end gap-2">
							<Button type="button" className="flex-1 bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={handleSearch}>
								<Search className="mr-2 h-4 w-4" /> Tìm
							</Button>
							<Button type="button" variant="outline" onClick={handleReset} title="Xóa bộ lọc">
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={openAddDialog}>
							<Plus className="mr-2 h-4 w-4" /> Thêm học kỳ
						</Button>
					</div>

					<Separator />

					<div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
						<Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
							Tổng: {total} học kỳ
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Table card */}
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-bold text-slate-900">Danh sách học kỳ</CardTitle>
					<CardDescription>Kết quả lọc theo điều kiện tìm kiếm.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="w-full overflow-x-auto rounded-none border border-slate-200">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="whitespace-nowrap">Năm học</TableHead>
									<TableHead className="whitespace-nowrap">Học kỳ</TableHead>
									<TableHead className="whitespace-nowrap">Ngày bắt đầu</TableHead>
									<TableHead className="whitespace-nowrap">Ngày kết thúc</TableHead>
									<TableHead className="whitespace-nowrap">Trạng thái</TableHead>
									<TableHead className="w-px whitespace-nowrap">Hành động</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
									</TableRow>
								) : rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy học kỳ phù hợp.</TableCell>
									</TableRow>
								) : rows.map((term) => (
									<TableRow key={term.id}>
										<TableCell className="font-semibold text-slate-900">{term.academicYear}</TableCell>
										<TableCell>{SEMESTER_LABELS[term.semester] ?? `Kỳ ${term.semester}`}</TableCell>
										<TableCell className="text-slate-600">{formatDate(term.startDate)}</TableCell>
										<TableCell className="text-slate-600">{formatDate(term.endDate)}</TableCell>
										<TableCell>
											<Badge className={term.isActive
												? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
												: 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
											}>
												{term.isActive ? 'Đang mở' : 'Đã đóng'}
											</Badge>
										</TableCell>
										<TableCell>
											<Button
												type="button" variant="ghost" size="icon-sm"
												title="Chỉnh sửa"
												onClick={() => openEditDialog(term)}
											>
												<Edit className="h-4 w-4 text-blue-500" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-sm text-slate-600">
							<span>Hiển thị</span>
							<select
								value={pageSize}
								onChange={(e) => fetchRows(1, Number(e.target.value), searchYear, searchSemester, searchActive)}
								className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
							>
								{PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
							</select>
							<span>/ trang — {total} học kỳ</span>
						</div>

						<Pagination className="w-auto justify-end">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => { e.preventDefault(); if (page > 1) fetchRows(page - 1, pageSize, searchYear, searchSemester, searchActive) }}
										className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
									/>
								</PaginationItem>
								{pageNumbers.map((item, idx) => (
									<PaginationItem key={`${item}-${idx}`}>
										{item === '...'
											? <PaginationEllipsis />
											: <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); fetchRows(item, pageSize, searchYear, searchSemester, searchActive) }}>{item}</PaginationLink>
										}
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => { e.preventDefault(); if (page < totalPages) fetchRows(page + 1, pageSize, searchYear, searchSemester, searchActive) }}
										className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				</CardContent>
			</Card>

			{/* Dialog thêm / sửa */}
			<TermDialog
				isOpen={dialogOpen}
				onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditTarget(null) }}
				form={dialogForm}
				onFormChange={setDialogForm}
				onSubmit={handleSubmit}
				submitting={dialogSubmitting}
				isEdit={!!editTarget}
			/>
		</div>
	)
}
