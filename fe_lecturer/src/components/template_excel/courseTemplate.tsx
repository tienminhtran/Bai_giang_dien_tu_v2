import * as XLSX from 'xlsx'

export const courseTemplateFilename = 'mau_import_mon_hoc.xlsx'

const HEADER_COLS = ['Mã môn học', 'Tên môn học', 'Số tín chỉ', 'Mô tả', 'Tên chuyên ngành']
const COL_WIDTHS = [{ wch: 18 }, { wch: 32 }, { wch: 14 }, { wch: 40 }, { wch: 28 }]

const HEADER_STYLE = {
	font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
	fill: { fgColor: { rgb: '08387F' } },
	alignment: { horizontal: 'center', vertical: 'center' },
	border: {
		top: { style: 'thin', color: { rgb: 'D1D5DB' } },
		bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
		left: { style: 'thin', color: { rgb: 'D1D5DB' } },
		right: { style: 'thin', color: { rgb: 'D1D5DB' } },
	},
}

const CELL_STYLE = {
	alignment: { vertical: 'center' },
	border: {
		top: { style: 'thin', color: { rgb: 'E5E7EB' } },
		bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
		left: { style: 'thin', color: { rgb: 'E5E7EB' } },
		right: { style: 'thin', color: { rgb: 'E5E7EB' } },
	},
}

function buildSheet(sampleRows: Record<string, unknown>[] = []) {
	const data = [HEADER_COLS, ...sampleRows.map((r) => HEADER_COLS.map((h) => r[h] ?? ''))]
	const ws = XLSX.utils.aoa_to_sheet(data)
	ws['!cols'] = COL_WIDTHS
	ws['!freeze'] = { xSplit: 0, ySplit: 1 }

	const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
	for (let C = range.s.c; C <= range.e.c; C++) {
		const addr = XLSX.utils.encode_cell({ r: 0, c: C })
		if (ws[addr]) ws[addr].s = HEADER_STYLE
	}
	for (let R = 1; R <= range.e.r; R++) {
		for (let C = range.s.c; C <= range.e.c; C++) {
			const addr = XLSX.utils.encode_cell({ r: R, c: C })
			if (ws[addr]) ws[addr].s = CELL_STYLE
		}
	}
	return ws
}

export function downloadCourseExcelTemplate(faculties: { id: string; facultyName: string }[] = []) {
	const workbook = XLSX.utils.book_new()

	if (faculties.length === 0) {
		// fallback: 1 sheet mẫu nếu chưa load được danh sách khoa
		const ws = buildSheet([
			{ 'Mã môn học': 'CNTT201', 'Tên môn học': 'Lập trình NodeJS', 'Số tín chỉ': 3, 'Mô tả': 'Môn học backend NodeJS Express', 'Tên chuyên ngành': 'Kỹ thuật phần mềm' },
		])
		XLSX.utils.book_append_sheet(workbook, ws, 'Ten Khoa')
	} else {
		for (const faculty of faculties) {
			const sheetName = faculty.facultyName.substring(0, 31)
			XLSX.utils.book_append_sheet(workbook, buildSheet(), sheetName)
		}
	}

	XLSX.writeFile(workbook, courseTemplateFilename)
}
