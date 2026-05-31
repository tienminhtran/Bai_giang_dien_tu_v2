import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import studentService from '@/services/studentService'
import { useUrlState } from '@/hooks'

export const PAGE_SIZE_OPTIONS = [10, 20, 50]
const normalize = (v) => String(v || '').trim().toLowerCase()
const URL_DEFAULTS = { page: 1, pageSize: PAGE_SIZE_OPTIONS[0] }

export function useStudentList() {
	const { get, set, resetPage, searchParams } = useUrlState(URL_DEFAULTS)
	const page     = Number(get('page'))     || 1
	const pageSize = Number(get('pageSize')) || PAGE_SIZE_OPTIONS[0]

	// draft: giá trị người dùng đang gõ, chưa apply
	const [keywordCode, setKeywordCode] = useState(() => get('studentCode'))
	const [keywordName, setKeywordName] = useState(() => get('fullName'))
	const [refreshKey, setRefreshKey]   = useState(0)

	const [students, setStudents]     = useState([])
	const [total, setTotal]           = useState(0)
	const [loading, setLoading]       = useState(false)
	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

	// fetch mỗi khi URL hoặc refreshKey thay đổi
	useEffect(() => {
		const code = searchParams.get('studentCode') || ''
		const name = searchParams.get('fullName')    || ''
		setLoading(true)
		studentService.list({ studentCode: code, fullName: name, page, pageSize })
			.then(({ rows, total: t }) => { setStudents(rows); setTotal(t) })
			.catch((err) => toast.error(err?.response?.data?.message || 'Không tải được danh sách sinh viên'))
			.finally(() => setLoading(false))
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, refreshKey])

	// sau thêm/import: về trang 1, force re-fetch dù đang ở trang 1
	const afterMutation = useCallback(() => {
		resetPage()
		setRefreshKey((k) => k + 1)
	}, [resetPage])

	// sau khi sửa/khóa 1 dòng có sẵn: giữ nguyên trang đang xem, chỉ re-fetch
	const refreshKeepPage = useCallback(() => {
		setRefreshKey((k) => k + 1)
	}, [])

	const handleSearch = () =>
		resetPage({ studentCode: keywordCode.trim(), fullName: keywordName.trim() })

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
	const safePage   = Math.min(page, totalPages)

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
		// applied filter (từ URL) — dùng cho export/lockAll
		appliedCode: searchParams.get('studentCode') || '',
		appliedName: searchParams.get('fullName')    || '',
		sortConfig, handleSort,
		currentPage: safePage, pageSize,
		totalPages, safePage, getPageNumbers,
		handleSearch,
		refresh: afterMutation,
		refreshKeepPage,
		// cho StudentTable
		onPageChange:     (p)    => set({ page: p }),
		onPageSizeChange: (size) => resetPage({ pageSize: size }),
	}
}
