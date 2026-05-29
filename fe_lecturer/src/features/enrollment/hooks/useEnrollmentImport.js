import { useState } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import enrollmentService from '@/services/enrollmentService'
import { mapRowsToEnrollments } from '../utils/mapRowsToEnrollments'

export function useEnrollmentImport({ onSuccess }) {
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

			const data = await importFile.arrayBuffer()
			const wb   = XLSX.read(data, { type: 'array' })
			const ws   = wb.Sheets[wb.SheetNames[0]]
			const rows = mapRowsToEnrollments(XLSX.utils.sheet_to_json(ws))

			if (rows.length === 0) {
				toast.error('File Excel không có dữ liệu hợp lệ hoặc thiếu/sai cột bắt buộc')
				return
			}

			setImportedRows(rows)
			const res    = await enrollmentService.bulkAdd(rows)
			const result = res.data // { total, successCount, errorCount, errors }
			setImportResult(result)

			if (result.successCount > 0) onSuccess?.()

			if (result.errorCount === 0) {
				toast.success(`Đã ghi danh ${result.successCount} bản ghi thành công`)
				setIsOpen(false)
				setImportFile(null)
			} else {
				toast.warning(`Ghi danh ${result.successCount}/${result.total} thành công — ${result.errorCount} dòng lỗi`)
			}
		} catch {
			toast.error('Không đọc được file Excel hoặc lỗi kết nối')
		} finally {
			setImportSubmitting(false)
		}
	}

	const downloadErrors = () => {
		if (!importResult?.errors?.length) return
		const rows = importResult.errors.map(({ row, student_code, course_code, reason }) => {
			const orig = importedRows[(row ?? 2) - 2] || {}
			return {
				'Dòng':              row ?? '',
				'Mã số sinh viên':   student_code || orig.studentCode || '',
				'Mã môn học':        course_code  || orig.courseCode  || '',
				'Năm học':           orig.academicYear || '',
				'Kỳ học':            orig.semester     || '',
				'Loại đăng ký':      orig.enrollmentType || '',
				'Lỗi':               reason || '',
			}
		})
		const ws = XLSX.utils.json_to_sheet(rows)
		ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 40 }]
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Lỗi')
		XLSX.writeFile(wb, 'loi_import_ghi_danh.xlsx')
	}

	return {
		isOpen, closeModal,
		importFile, setImportFile,
		importSubmitting, importResult,
		handleImport, downloadErrors,
	}
}
