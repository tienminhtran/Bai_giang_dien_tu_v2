import * as XLSX from 'xlsx'
import { Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import studentService from '@/services/studentService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { useStudentList, PAGE_SIZE_OPTIONS } from '@/features/student/hooks/useStudentList'
import { useStudentForm } from '@/features/student/hooks/useStudentForm'
import { useStudentImport } from '@/features/student/hooks/useStudentImport'
import { StudentActionBar } from '@/features/student/components/StudentActionBar'
import { StudentTable } from '@/features/student/components/StudentTable'
import { AddStudentDialog } from '@/features/student/components/AddStudentDialog'
import { ImportStudentDialog } from '@/features/student/components/ImportStudentDialog'

export default function StudentManagement() {
	const list = useStudentList()
	const form = useStudentForm({ onSuccess: list.refresh })
	const imp  = useStudentImport({ onSuccess: list.refresh })
	const [editStudent, setEditStudent] = useState(null)
	const [editForm, setEditForm] = useState({
		studentCode: '',
		fullName: '',
		email: '',
		dob: '',
		className: '',
		major: '',
		phone: '',
		avatarUrl: '',
		isActive: true,
	})
	const [editOpen, setEditOpen] = useState(false)
	const [editSubmitting, setEditSubmitting] = useState(false)
	const [confirmDialog, setConfirmDialog] = useState({
		open: false,
		title: '',
		description: '',
		confirmLabel: 'Xác nhận',
	})
	const confirmActionRef = useRef(null)

	const openEditDialog = (student) => {
		setEditStudent(student)
		setEditForm({
			studentCode: student.studentCode || '',
			fullName: student.fullName || '',
			email: student.email || '',
			dob: student.dob || '',
			className: student.className || '',
			major: student.major || '',
			phone: student.phone || '',
			avatarUrl: student.avatarUrl || '',
			isActive: Boolean(student.isActive),
		})
		setEditOpen(true)
	}

	const handleUpdateStudent = async () => {
		if (!editStudent?.id) return
		if (!editForm.studentCode.trim() || !editForm.fullName.trim()) {
			toast.error('Vui lòng nhập mã số sinh viên và họ tên')
			return
		}

		try {
			setEditSubmitting(true)
			await studentService.update(editStudent.id, editForm)
			toast.success('Cập nhật thông tin sinh viên thành công')
			setEditOpen(false)
			setEditStudent(null)
			list.refreshKeepPage()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Cập nhật thông tin sinh viên thất bại')
		} finally {
			setEditSubmitting(false)
		}
	}

	const openConfirmDialog = ({ title, description, confirmLabel = 'Xác nhận', onConfirm }) => {
		confirmActionRef.current = onConfirm
		setConfirmDialog({
			open: true,
			title,
			description,
			confirmLabel,
		})
	}

	const handleConfirmDialogChange = (open) => {
		setConfirmDialog((prev) => ({ ...prev, open }))
		if (!open) confirmActionRef.current = null
	}

	const handleConfirmAction = async () => {
		const action = confirmActionRef.current
		handleConfirmDialogChange(false)
		if (typeof action === 'function') await action()
	}

	const lockStudent = async (student, action = 'lock') => {
		const isLock = action === 'lock'
		const actionLabel = isLock ? 'khóa' : 'mở khóa'
		try {
			await studentService.lockAccount(student.id, action)
			toast.success(`Đã ${actionLabel} tài khoản sinh viên`)
			list.refreshKeepPage()
		} catch (err) {
			toast.error(err?.response?.data?.message || `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} tài khoản thất bại`)
		}
	}

	const handleLockStudent = (student, action = 'lock') => {
		const isLock = action === 'lock'
		const actionLabel = isLock ? 'khóa' : 'mở khóa'
		openConfirmDialog({
			title: `Xác nhận ${actionLabel} tài khoản`,
			description: `Bạn có chắc muốn ${actionLabel} tài khoản của ${student.fullName}?`,
			confirmLabel: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} tài khoản`,
			onConfirm: () => lockStudent(student, action),
		})
	}

	const resetPassword = async (student) => {
		try {
			await studentService.resetPassword(student.id, '12345678')
			toast.success('Đã reset mật khẩu về 12345678')
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Reset mật khẩu thất bại')
		}
	}

	const handleResetPassword = (student) => {
		openConfirmDialog({
			title: 'Xác nhận đặt lại mật khẩu',
			description: `Đặt lại mật khẩu của ${student.fullName} về 12345678?`,
			confirmLabel: 'Đặt lại mật khẩu',
			onConfirm: () => resetPassword(student),
		})
	}

	const lockAll = async (isLock = true) => {
		const action = isLock ? 'lock' : 'unlock'
		const actionLabel = isLock ? 'khóa' : 'mở khóa'

		const loadingToast = toast.loading(`Đang ${actionLabel} toàn bộ tài khoản...`)
		try {
			const { total } = await studentService.list({
				page: 1,
				pageSize: 1,
				studentCode: list.appliedCode,
				fullName: list.appliedName,
			})

			if (!total) {
				toast.dismiss(loadingToast)
				toast.error(`Không có sinh viên để ${actionLabel}`)
				return
			}

			const { rows } = await studentService.list({
				page: 1,
				pageSize: Math.max(total, 1),
				studentCode: list.appliedCode,
				fullName: list.appliedName,
			})

			const studentIds = rows.map((student) => student.id).filter(Boolean)
			const bulkResult = await studentService.lockAccounts(studentIds, action)
			const result = bulkResult?.data || {}
			const success = Number(result.successCount || 0)
			const fail = Number(result.errorCount || 0)

			toast.dismiss(loadingToast)
			if (success > 0) toast.success(`Đã ${actionLabel} ${success} tài khoản sinh viên`)
			if (fail > 0) toast.error(`${fail} tài khoản ${actionLabel} thất bại`)
			list.refreshKeepPage()
		} catch (err) {
			toast.dismiss(loadingToast)
			toast.error(err?.response?.data?.message || `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ thất bại`)
		}
	}

	const handleLockAll = (isLock = true) => {
		const actionLabel = isLock ? 'khóa' : 'mở khóa'
		openConfirmDialog({
			title: `Xác nhận ${actionLabel} toàn bộ`,
			description: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ sinh viên theo bộ lọc hiện tại?`,
			confirmLabel: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} toàn bộ`,
			onConfirm: () => lockAll(isLock),
		})
	}

	const handleExportExcel = async () => {
		try {
			const loadingToast = toast.loading('Đang tải dữ liệu để xuất Excel...')
			const { total }   = await studentService.list({ page: 1, pageSize: 1, studentCode: list.appliedCode, fullName: list.appliedName })
			const { rows }    = await studentService.list({ page: 1, pageSize: Math.max(total, 1), studentCode: list.appliedCode, fullName: list.appliedName })
			const data = rows.map((s, i) => ({
				STT: i + 1, user_id: s.userId,
				'Mã số sinh viên': s.studentCode, 'Họ tên': s.fullName,
				Email: s.email, 'Ngày sinh': s.dob, Lớp: s.className,
				'Chuyên ngành': s.major, 'Số điện thoại': s.phone,
				avatar_url: s.avatarUrl, is_active: s.isActive ? 1 : 0,
			}))
			const ws = XLSX.utils.json_to_sheet(data)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'SinhVien')
			XLSX.writeFile(wb, 'danh_sach_sinh_vien.xlsx')
			toast.dismiss(loadingToast)
			toast.success('Đã xuất Excel')
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Xuất Excel thất bại')
		}
	}

	return (
		<div className="space-y-6">
			<Card className="border-slate-200 shadow-sm">
				<CardHeader className="space-y-2">
					<CardTitle className="text-2xl font-black text-[#08387F]">Quản lý thông tin sinh viên</CardTitle>
					<CardDescription>Tra cứu, thêm mới, import/export Excel và khóa tài khoản sinh viên.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Filter bar — 2 input + 1 button, giữ inline vì tách ra tốn nhiều props hơn */}
					<div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_auto]">
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Mã số sinh viên</label>
							<Input value={list.keywordCode} onChange={(e) => list.setKeywordCode(e.target.value)} placeholder="Nhập MSSV" />
						</div>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-slate-700">Họ tên</label>
							<Input value={list.keywordName} onChange={(e) => list.setKeywordName(e.target.value)} placeholder="Nhập họ tên" />
						</div>
						<div className="flex items-end">
							<Button type="button" className="w-full bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={list.handleSearch}>
								<Search className="mr-2 h-4 w-4" /> Tìm
							</Button>
						</div>
					</div>

					<StudentActionBar
						onAddOpen={() => form.setIsOpen(true)}
						onImportOpen={() => imp.closeModal(true)}
						onExport={handleExportExcel}
						onLockAll={() => handleLockAll(true)}
						onUnlockAll={() => handleLockAll(false)}
						onLockSelected={() => toast.error('Chức năng khóa tài khoản chưa có API')}
					/>

					<Separator />

					<div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
						<Badge variant="secondary" className="rounded-none bg-slate-100 text-slate-700 hover:bg-slate-100">
							Tổng: {list.total}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<StudentTable
				students={list.students}
				loading={list.loading}
				sortConfig={list.sortConfig}
				onSort={list.handleSort}
				currentPage={list.currentPage}
				totalPages={list.totalPages}
				safePage={list.safePage}
				pageSize={list.pageSize}
				total={list.total}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				onPageChange={list.onPageChange}
				onPageSizeChange={list.onPageSizeChange}
				getPageNumbers={list.getPageNumbers}
				onLock={handleLockStudent}
				onEdit={openEditDialog}
				onChangePassword={handleResetPassword}
			/>

			<AddStudentDialog
				isOpen={form.isOpen}
				onOpenChange={form.setIsOpen}
				form={form.form}
				onFormChange={form.setForm}
				onSubmit={form.handleSubmit}
				submitting={form.submitting}
			/>

			<ImportStudentDialog
				isOpen={imp.isOpen}
				onOpenChange={imp.closeModal}
				importFile={imp.importFile}
				onFileChange={imp.setImportFile}
				importResult={imp.importResult}
				onImport={imp.handleImport}
				onDownloadErrors={imp.downloadErrors}
				submitting={imp.importSubmitting}
			/>

			<AddStudentDialog
				isOpen={editOpen}
				onOpenChange={(open) => { setEditOpen(open); if (!open) setEditStudent(null) }}
				form={editForm}
				onFormChange={setEditForm}
				onSubmit={handleUpdateStudent}
				submitting={editSubmitting}
				title="Chỉnh sửa thông tin sinh viên"
				description="Cập nhật thông tin sinh viên hiện tại"
				submitLabel="Lưu thay đổi"
			/>

			<AlertDialog open={confirmDialog.open} onOpenChange={handleConfirmDialogChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
						<AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Hủy</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmAction}>{confirmDialog.confirmLabel}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
