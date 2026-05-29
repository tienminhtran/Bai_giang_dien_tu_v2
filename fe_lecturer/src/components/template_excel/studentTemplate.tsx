import * as XLSX from 'xlsx'

export const studentTemplateRows = [
	{
		'Mã sinh viên': '24014564',
		'Họ và tên': 'Nguyễn Văn Tí',
		'Email': 'an.sv001@student.edu.vn',
		'Ngày sinh': '2005-11-22',
		'Tên lớp': 'CNTT01',
		'Chuyên ngành': 'Công nghệ thông tin',
		'Số điện thoại': '0901234567',
	},
	{
		'Mã sinh viên': '24014565',
		'Họ và tên': 'Trần Thị B',
		'Email': 'binh.sv002@student.edu.vn',
		'Ngày sinh': '10/12/2005',
		'Tên lớp': 'CNTT01',
		'Chuyên ngành': 'Công nghệ thông tin',
		'Số điện thoại': '0901234568',
	},
	{
		'Mã sinh viên': '24014566',
		'Họ và tên': 'Lê Văn C',
		'Email': 'c.sv003@student.edu.vn',
		'Ngày sinh': '15-08-2005',
		'Tên lớp': 'CNTT01',
		'Chuyên ngành': 'Công nghệ thông tin',
		'Số điện thoại': '0901234569',
	}
]

export const studentTemplateFilename = 'mau_import_sinh_vien.xlsx'

export function downloadStudentExcelTemplate() {
	const worksheet = XLSX.utils.json_to_sheet(studentTemplateRows)

	// Width cột
	worksheet['!cols'] = [
		{ wch: 18 }, // Mã sinh viên
		{ wch: 28 }, // Họ và tên
		{ wch: 35 }, // Email
		{ wch: 15 }, // Ngày sinh
		{ wch: 15 }, // Tên lớp
		{ wch: 30 }, // Chuyên ngành
		{ wch: 18 }, // SĐT
	]

	// Style header
	const range = XLSX.utils.decode_range(worksheet['!ref'] || '')

	for (let C = range.s.c; C <= range.e.c; ++C) {
		const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })

		if (!worksheet[cellAddress]) continue

		worksheet[cellAddress].s = {
			font: {
				bold: true,
				color: { rgb: 'FFFFFF' },
				sz: 12,
			},
			fill: {
				fgColor: { rgb: '2563EB' }, // blue-600
			},
			alignment: {
				horizontal: 'center',
				vertical: 'center',
			},
			border: {
				top: { style: 'thin', color: { rgb: 'D1D5DB' } },
				bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
				left: { style: 'thin', color: { rgb: 'D1D5DB' } },
				right: { style: 'thin', color: { rgb: 'D1D5DB' } },
			},
		}
	}

	// Style body
	for (let R = 1; R <= range.e.r; ++R) {
		for (let C = range.s.c; C <= range.e.c; ++C) {
			const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })

			if (!worksheet[cellAddress]) continue

			worksheet[cellAddress].s = {
				alignment: {
					vertical: 'center',
				},
				border: {
					top: { style: 'thin', color: { rgb: 'E5E7EB' } },
					bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
					left: { style: 'thin', color: { rgb: 'E5E7EB' } },
					right: { style: 'thin', color: { rgb: 'E5E7EB' } },
				},
			}
		}
	}

	// Freeze header
	worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'SinhVien')

	XLSX.writeFile(workbook, studentTemplateFilename)
}