import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import studentService from '@/services/studentService'

export const PAGE_SIZE_OPTIONS = [10, 20, 50]
const normalize = (v) => String(v || '').trim().toLowerCase()

export function useStudentList() {
	const [students, setStudents]       = useState([])
	const [total, setTotal]             = useState(0)
	const [loading, setLoading]         = useState(false)
	const [keywordCode, setKeywordCode] = useState('')
	const [keywordName, setKeywordName] = useState('')
	const [sortConfig, setSortConfig]   = useState({ key: null, direction: 'asc' })
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize]       = useState(PAGE_SIZE_OPTIONS[0])

	const fetchStudents = useCallback(async (page, size, code, name) => {
		setLoading(true)
		try {
			const { rows, total: t } = await studentService.list({ studentCode: code, fullName: name, page, pageSize: size })
			setStudents(rows)
			setTotal(t)
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không tải được danh sách sinh viên')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchStudents(currentPage, pageSize, keywordCode, keywordName)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, pageSize])

	const handleSearch = () => {
		setCurrentPage(1)
		fetchStudents(1, pageSize, keywordCode, keywordName)
	}

	const refresh = () => {
		setCurrentPage(1)
		fetchStudents(1, pageSize, keywordCode, keywordName)
	}

	const handleSort = (key) =>
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		}))

	const sortedStudents = useMemo(() => {
		if (!sortConfig.key) return students
		return [...students].sort((a, b) => {
			const aVal = normalize(a[sortConfig.key])
			const bVal = normalize(b[sortConfig.key])
			const cmp  = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
			return sortConfig.direction === 'asc' ? cmp : -cmp
		})
	}, [students, sortConfig])

	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	const safePage   = Math.min(currentPage, totalPages)

	const getPageNumbers = () => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
		const pages = [1]
		if (safePage > 3) pages.push('...')
		for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
		if (safePage < totalPages - 2) pages.push('...')
		pages.push(totalPages)
		return pages
	}

	return {
		students: sortedStudents, total, loading,
		keywordCode, setKeywordCode,
		keywordName, setKeywordName,
		sortConfig, handleSort,
		currentPage, setCurrentPage,
		pageSize, setPageSize,
		totalPages, safePage, getPageNumbers,
		fetchStudents, handleSearch, refresh,
	}
}
