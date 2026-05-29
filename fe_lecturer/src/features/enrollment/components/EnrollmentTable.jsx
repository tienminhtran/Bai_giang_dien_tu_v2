import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

function SortIcon({ column, sortConfig }) {
	if (sortConfig.key !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-slate-400" />
	return sortConfig.direction === 'asc'
		? <ArrowUp   className="ml-1 inline h-3.5 w-3.5 text-[#08387F]" />
		: <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-[#08387F]" />
}

const TYPE_BADGE = {
	new:     { label: 'Đăng ký mới',    cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
	retake:  { label: 'Học lại',         cls: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
	improve: { label: 'Học cải thiện',   cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
}

const COLUMNS = [
	{ key: 'studentCode',  label: 'Mã sinh viên' },
	{ key: 'fullName',     label: 'Họ tên' },
	{ key: 'courseCode',   label: 'Mã môn học' },
	{ key: 'courseName',   label: 'Môn học' },
	{ key: 'academicYear', label: 'Năm học' },
	{ key: 'semester',     label: 'Kỳ' },
	{ key: 'enrollmentType', label: 'Loại đăng ký' },
	{ key: 'enrolledAt',   label: 'Ngày đăng ký' },
]

const formatDate = (val) => {
	if (!val) return '—'
	try { return new Date(val).toLocaleDateString('vi-VN') } catch { return val }
}

export function EnrollmentTable({ enrollments, loading, sortConfig, onSort, currentPage, totalPages, safePage, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange, getPageNumbers }) {
	return (
		<Card className="border-slate-200 shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg font-bold text-slate-900">Danh sách đăng ký học phần</CardTitle>
				<CardDescription>Kết quả lọc theo bộ điều kiện tìm kiếm.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="w-full overflow-x-auto rounded-none border border-slate-200">
					<Table>
						<TableHeader>
							<TableRow>
								{COLUMNS.map(({ key, label }) => (
									<TableHead
										key={label}
										className={key ? 'cursor-pointer select-none whitespace-nowrap' : undefined}
										onClick={key ? () => onSort(key) : undefined}
									>
										{label}
										{key && <SortIcon column={key} sortConfig={sortConfig} />}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={COLUMNS.length} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
								</TableRow>
							) : enrollments.length === 0 ? (
								<TableRow>
									<TableCell colSpan={COLUMNS.length} className="py-8 text-center text-slate-500">Không tìm thấy dữ liệu phù hợp.</TableCell>
								</TableRow>
							) : (
								enrollments.map((e) => {
									const badge = TYPE_BADGE[e.enrollmentType] || { label: e.enrollmentType, cls: 'bg-slate-100 text-slate-700 hover:bg-slate-100' }
									return (
										<TableRow key={e.id}>
											<TableCell className="font-semibold text-slate-900">{e.studentCode}</TableCell>
											<TableCell>{e.fullName}</TableCell>
											<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
											<TableCell className="max-w-[200px] truncate" title={e.courseName}>{e.courseName}</TableCell>
											<TableCell>{e.academicYear}</TableCell>
											<TableCell className="text-center">{e.semester}</TableCell>
											<TableCell>
												<Badge className={`rounded-none ${badge.cls}`}>{badge.label}</Badge>
											</TableCell>
											<TableCell className="whitespace-nowrap text-slate-500 text-sm">{formatDate(e.enrolledAt)}</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-sm text-slate-600">
						<span>Hiển thị</span>
						<select
							value={pageSize}
							onChange={(e) => onPageSizeChange(Number(e.target.value))}
							className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#08387F]"
						>
							{pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
						</select>
						<span>/ trang — {total} bản ghi</span>
					</div>

					<Pagination className="w-auto justify-end">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => { e.preventDefault(); onPageChange((p) => Math.max(1, p - 1)) }}
									className={safePage === 1 ? 'pointer-events-none opacity-40' : ''}
								/>
							</PaginationItem>
							{getPageNumbers().map((page, idx) =>
								page === '...' ? (
									<PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
								) : (
									<PaginationItem key={page}>
										<PaginationLink href="#" isActive={page === safePage} onClick={(e) => { e.preventDefault(); onPageChange(page) }}>
											{page}
										</PaginationLink>
									</PaginationItem>
								)
							)}
							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => { e.preventDefault(); onPageChange((p) => Math.min(totalPages, p + 1)) }}
									className={safePage === totalPages ? 'pointer-events-none opacity-40' : ''}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</CardContent>
		</Card>
	)
}
