import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import enrollmentService from '@/services/enrollmentService'

export const PAGE_SIZE_OPTIONS = [10, 20, 50]
const normalize = (v) => String(v || '').trim().toLowerCase()

export function useEnrollmentList() {
	const [enrollments, setEnrollments] = useState([])
	const [total, setTotal]             = useState(0)
	const [loading, setLoading]         = useState(false)
	const [sortConfig, setSortConfig]   = useState({ key: null, direction: 'asc' })
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize]       = useState(PAGE_SIZE_OPTIONS[0])

	const [filters, setFilters] = useState({
		studentCode:  '',
		fullName:     '',
		courseCode:   '',
		courseName:   '',
		academicYear: '',
		semester:     '',
	})
	// applied filters — only update on search click
	const [appliedFilters, setAppliedFilters] = useState(filters)

	const fetchEnrollments = useCallback(async (page, size, f) => {
		setLoading(true)
		try {
			const { rows, total: t } = await enrollmentService.list({ ...f, page, pageSize: size })
			setEnrollments(rows)
			setTotal(t)
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Không tải được danh sách ghi danh')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchEnrollments(currentPage, pageSize, appliedFilters)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, pageSize, appliedFilters])

	const handleSearch = () => {
		setAppliedFilters(filters)
		setCurrentPage(1)
	}

	const handleReset = () => {
		const empty = { studentCode: '', fullName: '', courseCode: '', courseName: '', academicYear: '', semester: '' }
		setFilters(empty)
		setAppliedFilters(empty)
		setCurrentPage(1)
	}

	const refresh = () => {
		fetchEnrollments(currentPage, pageSize, appliedFilters)
	}

	const handleSort = (key) =>
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		}))

	const sortedEnrollments = useMemo(() => {
		if (!sortConfig.key) return enrollments
		return [...enrollments].sort((a, b) => {
			const aVal = normalize(a[sortConfig.key])
			const bVal = normalize(b[sortConfig.key])
			const cmp  = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
			return sortConfig.direction === 'asc' ? cmp : -cmp
		})
	}, [enrollments, sortConfig])

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
		enrollments: sortedEnrollments, total, loading,
		filters, setFilters,
		sortConfig, handleSort,
		currentPage, setCurrentPage,
		pageSize, setPageSize,
		totalPages, safePage, getPageNumbers,
		handleSearch, handleReset, refresh,
	}
}
