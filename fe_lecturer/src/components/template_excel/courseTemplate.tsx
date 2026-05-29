import * as XLSX from 'xlsx'

export const courseTemplateRows = [
	{
		'Mã môn học': 'CNTT201',
		'Tên môn học': 'Lập trình NodeJS',
		'Số tín chỉ': 3,
		'Mô tả': 'Môn học backend NodeJS Express',
		'Đang hoạt động': 'true',
	},
	{
		'Mã môn học': '0101234',
		'Tên môn học': 'Machine Learning',
		'Số tín chỉ': 3,
		'Mô tả': 'Môn học Machine Learning',
		'Đang hoạt động': 'true',
	},
	{
		'Mã môn học': '0101224',
		'Tên môn học': 'AI nâng cao',
		'Số tín chỉ': 4,
		'Mô tả': 'Test trùng mã môn học',
		'Đang hoạt động': 'true',
	},
]

export const courseTemplateFilename = 'mau_import_mon_hoc.xlsx'

export function downloadCourseExcelTemplate() {
	const worksheet = XLSX.utils.json_to_sheet(courseTemplateRows)

	worksheet['!cols'] = [
		{ wch: 18 },
		{ wch: 28 },
		{ wch: 14 },
		{ wch: 40 },
		{ wch: 16 },
	]

	const range = XLSX.utils.decode_range(worksheet['!ref'] || '')
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
		if (!worksheet[cellAddress]) continue
		worksheet[cellAddress].s = {
			font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
			fill: { fgColor: { rgb: '2563EB' } },
			alignment: { horizontal: 'center', vertical: 'center' },
			border: {
				top: { style: 'thin', color: { rgb: 'D1D5DB' } },
				bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
				left: { style: 'thin', color: { rgb: 'D1D5DB' } },
				right: { style: 'thin', color: { rgb: 'D1D5DB' } },
			},
		}
	}

	for (let R = 1; R <= range.e.r; ++R) {
		for (let C = range.s.c; C <= range.e.c; ++C) {
			const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
			if (!worksheet[cellAddress]) continue
			worksheet[cellAddress].s = {
				alignment: { vertical: 'center' },
				border: {
					top: { style: 'thin', color: { rgb: 'E5E7EB' } },
					bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
					left: { style: 'thin', color: { rgb: 'E5E7EB' } },
					right: { style: 'thin', color: { rgb: 'E5E7EB' } },
				},
			}
		}
	}

	worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'MonHoc')
	XLSX.writeFile(workbook, courseTemplateFilename)
}