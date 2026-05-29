import { parseExcelDate } from './parseExcelDate'

export const mapRowsToStudents = (rows = []) =>
	rows
		.map((row) => ({
			studentCode: String(row.studentCode || row['Mã sinh viên']    || row['Mã số sinh viên'] || row.mssv || row.code || '').trim(),
			fullName:    String(row.fullName    || row['Họ và tên']       || row['Họ tên']           || row.hoTen || row.name || '').trim(),
			email:       String(row.email       || row['Email']           || '').trim(),
			dob:         parseExcelDate(row.dob || row['Ngày sinh']       || row.birthDate),
			className:   String(row.className   || row['Tên lớp']         || row['Lớp']             || row.class || '').trim(),
			major:       String(row.major       || row['Chuyên ngành']    || '').trim(),
			phone:       String(row.phone       || row['Số điện thoại']   || '').trim(),
			avatarUrl:   String(row.avatarUrl   || row.avatar_url         || row['Ảnh đại diện']    || '').trim(),
		}))
		.filter((s) => s.studentCode && s.fullName)
