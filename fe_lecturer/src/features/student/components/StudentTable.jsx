import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Key, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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

const COLUMNS = [
	{ key: 'studentCode', label: 'MSSV' },
	{ key: 'fullName',    label: 'Họ tên' },
	{ key: 'dob',         label: 'Ngày sinh' },
	{ key: 'className',   label: 'Lớp' },
	{ key: 'major',       label: 'Chuyên ngành' },
	{ key: 'email',       label: 'Email' },
	{ key: null,          label: 'Số điện thoại' },
	{ key: 'isActive',    label: 'Trạng thái' },
	{ key: null,          label: 'Hành động' },
]

export function StudentTable({ students, loading, sortConfig, onSort, currentPage, totalPages, safePage, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange, getPageNumbers, onLock, onEdit, onChangePassword }) {
	return (
		<Card className="border-slate-200 shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg font-bold text-slate-900">Danh sách sinh viên</CardTitle>
				<CardDescription>Kết quả lọc theo mã số sinh viên và họ tên.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="w-full rounded-none border border-slate-200">
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
									<TableCell colSpan={8} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
								</TableRow>
							) : students.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="py-8 text-center text-slate-500">Không tìm thấy sinh viên phù hợp.</TableCell>
								</TableRow>
							) : (
								students.map((s) => (
									<TableRow key={s.id}>
										<TableCell className="font-semibold text-slate-900">{s.studentCode}</TableCell>
										<TableCell>{s.fullName}</TableCell>
										<TableCell>{s.dob       || '—'}</TableCell>
										<TableCell>{s.className || '—'}</TableCell>
										<TableCell>{s.major     || '—'}</TableCell>
										<TableCell>{s.email     || '—'}</TableCell>
										<TableCell>{s.phone     || '—'}</TableCell>
										<TableCell>
											<Badge className={s.isActive
												? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
												: 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
											}>
												{s.isActive ? 'Đang hoạt động' : 'Đã khóa'}
											</Badge>
										</TableCell>
										<TableCell className="w-px">
											<div className="flex items-center gap-2">
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													title={s.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
													onClick={() => {
														if (typeof onLock === 'function') return onLock(s, s.isActive ? 'lock' : 'unlock')
														toast('Chức năng khóa/mở khóa chưa có handler', { type: 'warning' })
													}}
												>
													{s.isActive ? (
														<Lock className="h-4 w-4 text-rose-500" />
													) : (
														<Unlock className="h-4 w-4 text-emerald-600" />
													)}
												</Button>

												<Button type="button" variant="ghost" size="icon-sm" title="Sửa thông tin" onClick={() => {
													if (typeof onEdit === 'function') return onEdit(s)
													toast('Chức năng sửa chưa có handler', { type: 'warning' })
												}}>
													<Edit className="h-4 w-4 text-blue-500" />
												</Button>

												<Button type="button" variant="ghost" size="icon-sm" title="Đổi mật khẩu" onClick={() => {
													if (typeof onChangePassword === 'function') return onChangePassword(s)
													toast('Chức năng đổi mật khẩu chưa có handler', { type: 'warning' })
												}}>
													<Key className="h-4 w-4 text-purple-500" />
												</Button>
											</div>
										</TableCell>
										

									</TableRow>
								))
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
							{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
						</select>
						<span>/ trang — {total} sinh viên</span>
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
									<PaginationItem key={`ellipsis-${idx}`}><PaginationEllipsis /></PaginationItem>
								) : (
									<PaginationItem key={page}>
										<PaginationLink
											href="#"
											isActive={page === safePage}
											onClick={(e) => { e.preventDefault(); onPageChange(page) }}
										>
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
