export const parseExcelDate = (value) => {
	if (!value) return ''
	if (value instanceof Date) return isNaN(value) ? '' : value.toISOString().slice(0, 10)
	return String(value).trim()
}
