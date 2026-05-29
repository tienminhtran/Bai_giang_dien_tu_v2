import { useState } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import studentService from '@/services/studentService'
import { mapRowsToStudents } from '../utils/mapRowsToStudents'

export function useStudentImport({ onSuccess }) {
	const [isOpen, setIsOpen]                     = useState(false)
	const [importFile, setImportFile]             = useState(null)
	const [importSubmitting, setImportSubmitting] = useState(false)
	const [importResult, setImportResult]         = useState(null)
	const [importedRows, setImportedRows]         = useState([])

	const closeModal = (open) => {
		setIsOpen(open)
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
			const data     = await importFile.arrayBuffer()
			const wb       = XLSX.read(data, { type: 'array' })
			const ws       = wb.Sheets[wb.SheetNames[0]]
			const students = mapRowsToStudents(XLSX.utils.sheet_to_json(ws))

			if (students.length === 0) {
				toast.error('File Excel không có dữ liệu hợp lệ hoặc thiếu cột Mã sinh viên / Họ và tên')
				return
			}

			setImportedRows(students)
			const result = await studentService.importStudents(students)
			setImportResult(result)

			if (result.successCount > 0) onSuccess?.()

			if (result.errorCount === 0) {
				toast.success(`Đã nhập ${result.successCount} sinh viên thành công`)
				setIsOpen(false)
				setImportFile(null)
			} else {
				toast.warning(`Nhập ${result.successCount}/${result.total} thành công — ${result.errorCount} dòng lỗi`)
			}
		} catch {
			toast.error('Không đọc được file Excel hoặc lỗi kết nối')
		} finally {
			setImportSubmitting(false)
		}
	}

	const downloadErrors = () => {
		if (!importResult?.errors?.length) return
		const rows = importResult.errors.map(({ row, student_code, message }) => {
			const orig = importedRows[row - 1] || {}
			return {
				'Dòng': row,
				'Mã sinh viên': student_code || orig.studentCode || '',
				'Họ và tên':    orig.fullName  || '',
				'Email':        orig.email     || '',
				'Ngày sinh':    orig.dob       || '',
				'Tên lớp':      orig.className || '',
				'Chuyên ngành': orig.major     || '',
				'Số điện thoại': orig.phone    || '',
				'Lỗi': message,
			}
		})
		const ws = XLSX.utils.json_to_sheet(rows)
		ws['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 28 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 40 }]
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
		XLSX.writeFile(wb, 'loi_import_sinh_vien.xlsx')
	}

	return {
		isOpen, closeModal,
		importFile, setImportFile,
		importSubmitting, importResult,
		handleImport, downloadErrors,
	}
}
