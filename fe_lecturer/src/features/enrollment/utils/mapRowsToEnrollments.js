const VALID_TYPES = ['new', 'retake', 'improve']

const TYPE_ALIAS = {
  'đăng ký mới': 'new', 'dang ky moi': 'new', 'mới': 'new', 'new': 'new',
  'học lại': 'retake', 'hoc lai': 'retake', 'lại': 'retake', 'retake': 'retake',
  'học cải thiện': 'improve', 'hoc cai thien': 'improve', 'cải thiện': 'improve', 'improve': 'improve',
}

export const mapRowsToEnrollments = (rows = []) =>
  rows
    .map((row) => {
      const rawType = String(
        row.enrollmentType || row.enrollment_type ||
        row['Loại đăng ký'] || row['loại đăng ký'] ||
        row['Loai dang ky'] || ''
      ).trim().toLowerCase()

      return {
        studentCode:    String(row.studentCode  || row.student_code  || row['Mã số sinh viên'] || row['MSSV'] || '').trim(),
        courseCode:     String(row.courseCode   || row.course_code   || row['Mã môn học']       || '').trim().toUpperCase(),
        academicYear:   String(row.academicYear || row.academic_year || row['Năm học']          || '').trim().replace(/\s*-\s*/g, '-'),
        semester:       Number(row.semester     || row['Kỳ học']     || row['Học kỳ']           || 0),
        enrollmentType: TYPE_ALIAS[rawType] || rawType,
      }
    })
    .filter((r) => r.studentCode && r.courseCode && r.academicYear && r.semester && VALID_TYPES.includes(r.enrollmentType))
