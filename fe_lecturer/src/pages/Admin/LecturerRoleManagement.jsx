import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUrlState } from '@/hooks'
import * as XLSX from 'xlsx'
import { Download, Edit, Search, Settings, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import userRoleService from '@/services/userRoleService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const URL_DEFAULTS_LRM = { page: 1, pageSize: PAGE_SIZE_OPTIONS[0] }

export default function LecturerRoleManagement() {
	const { get, set, resetPage, searchParams } = useUrlState(URL_DEFAULTS_LRM)
	const page     = Number(get('page'))     || 1
	const pageSize = Number(get('pageSize')) || PAGE_SIZE_OPTIONS[0]
	const [draftCode, setDraftCode] = useState(() => get('lecturerCode'))
	const [draftName, setDraftName] = useState(() => get('fullName'))
	const [refreshKey, setRefreshKey] = useState(0)

	const [rows, setRows]                         = useState([])
	const [total, setTotal]                       = useState(0)
	const [loading, setLoading]                   = useState(false)
	const [rolesLoading, setRolesLoading]         = useState(false)
	const [allRoles, setAllRoles]                 = useState([])
	const [editOpen, setEditOpen]                 = useState(false)
	const [editSubmitting, setEditSubmitting]     = useState(false)
	const [selectedLecturer, setSelectedLecturer] = useState(null)
	const [selectedRoleIds, setSelectedRoleIds]   = useState([])

	const selectedRoleIdSet = useMemo(() => new Set(selectedRoleIds), [selectedRoleIds])
	const totalPages        = Math.max(Math.ceil(total / pageSize), 1)
	const safePage          = Math.min(page, totalPages)

	const getPageNumbers = () => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
		const pages = [1]
		if (safePage > 3) pages.push('...')
		for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
		if (safePage < totalPages - 2) pages.push('...')
		pages.push(totalPages)
		return pages
	}

	useEffect(() => {
		setRolesLoading(true)
		userRoleService.listAllRoles()
			.then(setAllRoles)
			.catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách quyền'))
			.finally(() => setRolesLoading(false))
	}, [])

	useEffect(() => {
		const code = searchParams.get('lecturerCode') || ''
		const name = searchParams.get('fullName') || ''
		setLoading(true)
		userRoleService.listLecturerRoles({ lecturerCode: code, fullName: name, page, pageSize })
			.then(({ rows: data, total: count }) => { setRows(data); setTotal(count) })
			.catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách phân quyền'))
			.finally(() => setLoading(false))
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, refreshKey])

	const afterMutation = useCallback(() => {
		resetPage()
		setRefreshKey((k) => k + 1)
	}, [resetPage])

	const openEdit = (lecturer) => {
		setSelectedLecturer(lecturer)
		setSelectedRoleIds((lecturer.roles || []).map((r) => r.id))
		setEditOpen(true)
	}

	const handleSave = async () => {
		if (!selectedLecturer?.id) return
		try {
			setEditSubmitting(true)
			await userRoleService.updateLecturerRoles(selectedLecturer.id, selectedRoleIds)
			toast.success('Cập nhật quyền giảng viên thành công')
			setEditOpen(false)
			setSelectedLecturer(null)
			afterMutation()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Cập nhật quyền giảng viên thất bại')
		} finally {
			setEditSubmitting(false)
		}
	}

	const handleExportExcel = async () => {
		try {
			const loadingToast = toast.loading('Đang tải dữ liệu để xuất Excel...')
			const appliedCode = searchParams.get('lecturerCode') || ''
			const appliedName = searchParams.get('fullName') || ''
			const { total: count } = await userRoleService.listLecturerRoles({ lecturerCode: appliedCode, fullName: appliedName, page: 1, pageSize: 1 })
			const { rows: data }   = await userRoleService.listLecturerRoles({ lecturerCode: appliedCode, fullName: appliedName, page: 1, pageSize: Math.max(count, 1) })
			const exportRows = data.map((item, idx) => ({
				STT: idx + 1,
				'Mã giảng viên': item.lecturerCode,
				'Họ tên':        item.fullName,
				'Khoa/Viện':     item.facultyName || '',
				'Quyền':         (item.roles || []).map((r) => r.role_name).join(', '),
				'Trạng thái':    item.isActive ? 'Đang hoạt động' : 'Đã khóa',
			}))
			const ws = XLSX.utils.json_to_sheet(exportRows)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'PhanQuyenGiangVien')
			XLSX.writeFile(wb, `phan-quyen-giang-vien-${new Date().toISOString().slice(0, 10)}.xlsx`)
			toast.dismiss(loadingToast)
			toast.success('Đã xuất file Excel')
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Xuất Excel thất bại')
		}
	}

	return (
		<div className="space-y-6">
			{/*  Card 1: Filter + Action bar  */}
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-black text-[#08387F]">Phân quyền người dùng</CardTitle>
					<CardDescription>Quản lý quyền truy cập của giảng viên, lọc nhanh và xuất dữ liệu Excel.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Filter bar — giữ inline */}
					<div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Mã giảng viên</label>
							<Input
								value={draftCode}
								onChange={(e) => setDraftCode(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && resetPage({ lecturerCode: draftCode.trim(), fullName: draftName.trim() })}
								placeholder="Nhập mã giảng viên"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Họ tên</label>
							<Input
								value={draftName}
								onChange={(e) => setDraftName(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && resetPage({ lecturerCode: draftCode.trim(), fullName: draftName.trim() })}
								placeholder="Nhập họ tên"
							/>
						</div>
						<div className="flex items-end">
							<Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={() => resetPage({ lecturerCode: draftCode.trim(), fullName: draftName.trim() })}>
								<Search className="mr-2 h-4 w-4" /> Tìm
							</Button>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={handleExportExcel}>
							<Download className="mr-2 h-4 w-4" /> Xuất Excel
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

			{/*  Card 2: Table + Pagination  */}
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-bold text-slate-900">Danh sách phân quyền</CardTitle>
					<CardDescription>Kết quả lọc theo mã giảng viên và họ tên.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="w-full rounded-none border border-slate-200">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="whitespace-nowrap">Mã giảng viên</TableHead>
									<TableHead className="whitespace-nowrap">Họ tên</TableHead>
									<TableHead className="whitespace-nowrap">Phòng ban</TableHead>
									<TableHead className="whitespace-nowrap">Quyền hiện tại</TableHead>
									<TableHead className="whitespace-nowrap">Trạng thái</TableHead>
									<TableHead className="whitespace-nowrap">Hành động</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-slate-400">Đang tải...</TableCell>
									</TableRow>
								) : rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy giảng viên phù hợp.</TableCell>
									</TableRow>
								) : rows.map((lecturer) => (
									<TableRow key={lecturer.id}>
										<TableCell className="font-semibold text-slate-900 whitespace-nowrap">{lecturer.lecturerCode}</TableCell>
										<TableCell className="whitespace-nowrap">{lecturer.fullName}</TableCell>
										<TableCell className="whitespace-nowrap">{lecturer.facultyName || '—'}</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1.5">
												{(lecturer.roles || []).length > 0
													? lecturer.roles.map((role) => (
														<Badge key={role.id} variant="outline" className="border-[#08387F]/20 bg-[#08387F]/5 text-[#08387F]">
															{role.role_name}
														</Badge>
													))
													: <span className="text-slate-400 text-sm">Chưa gán quyền</span>
												}
											</div>
										</TableCell>
										<TableCell>
											<Badge className={lecturer.isActive
												? 'rounded-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
												: 'rounded-none bg-rose-100 text-rose-700 hover:bg-rose-100'
											}>
												{lecturer.isActive ? 'Đang hoạt động' : 'Đã khóa'}
											</Badge>
										</TableCell>
										<TableCell>
											<Button type="button" variant="outline" title="Cập nhật quyền" className=" text-[#08387F] hover:bg-slate-50" onClick={() => openEdit(lecturer)}>
												<Settings className=" h-4 w-4" />
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
							<span>/ trang — {total} giảng viên</span>
						</div>

						<Pagination className="w-auto justify-end">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => { e.preventDefault(); if (safePage > 1) set({ page: safePage - 1 }) }}
										className={safePage === 1 ? 'pointer-events-none opacity-40' : ''}
									/>
								</PaginationItem>

								{getPageNumbers().map((p, idx) =>
									p === '...' ? (
										<PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
									) : (
										<PaginationItem key={p}>
											<PaginationLink
												href="#"
												isActive={p === safePage}
												onClick={(e) => { e.preventDefault(); set({ page: p }) }}
											>
												{p}
											</PaginationLink>
										</PaginationItem>
									)
								)}

								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => { e.preventDefault(); if (safePage < totalPages) set({ page: safePage + 1 }) }}
										className={safePage === totalPages ? 'pointer-events-none opacity-40' : ''}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				</CardContent>
			</Card>

			{/*  Dialog cập nhật quyền  */}
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-[#08387F]">
							<ShieldCheck className="h-5 w-5" />
							Cập nhật quyền giảng viên
						</DialogTitle>
						<DialogDescription>Chọn một hoặc nhiều quyền để gán cho giảng viên.</DialogDescription>
					</DialogHeader>

					{selectedLecturer && (
						<div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
							<p><span className="font-semibold">Mã:</span> {selectedLecturer.lecturerCode}</p>
							<p><span className="font-semibold">Họ tên:</span> {selectedLecturer.fullName}</p>
							{selectedLecturer.facultyName && <p><span className="font-semibold">Khoa/Viện:</span> {selectedLecturer.facultyName}</p>}
						</div>
					)}

					<div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
						{rolesLoading ? (
							<p className="py-4 text-center text-sm text-slate-500">Đang tải danh sách quyền...</p>
						) : allRoles.length === 0 ? (
							<p className="py-4 text-center text-sm text-slate-500">Chưa có quyền nào trong hệ thống.</p>
						) : allRoles.map((role) => (
							<label
								key={role.id}
								className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
									selectedRoleIdSet.has(role.id)
										? 'border-[#08387F] bg-[#08387F]/5'
										: 'border-slate-200 bg-white hover:bg-slate-50'
								}`}
							>
								<Checkbox
									checked={selectedRoleIdSet.has(role.id)}
									onCheckedChange={(checked) =>
										setSelectedRoleIds((cur) => checked
											? [...new Set([...cur, role.id])]
											: cur.filter((id) => id !== role.id)
										)
									}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-slate-900">{role.role_name}</p>
									{role.description && <p className="truncate text-xs text-slate-500">{role.description}</p>}
								</div>
								{selectedRoleIdSet.has(role.id) && (
									<span className="shrink-0 text-xs font-medium text-[#08387F]">✓ Đã chọn</span>
								)}
							</label>
						))}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
						<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" disabled={editSubmitting} onClick={handleSave}>
							{editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
