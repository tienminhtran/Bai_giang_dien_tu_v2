import api from '../api/axios'
import { ENROLLMENT_EP } from '../constants'

const ENROLLMENT_TYPE_LABEL = {
  new:     'Đăng ký mới',
  retake:  'Học lại',
  improve: 'Học cải thiện',
}

const toFrontend = (e) => ({
  id:             e.id,
  studentCode:    e.Student?.student_code   || '',
  fullName:       e.Student?.full_name      || '',
  courseCode:     e.Course?.course_code     || '',
  courseName:     e.Course?.course_name     || '',
  academicYear:   e.AcademicTerm?.academic_year || '',
  semester:       e.AcademicTerm?.semester  ?? '',
  enrollmentType: e.enrollment_type         || '',
  enrollmentTypeLabel: ENROLLMENT_TYPE_LABEL[e.enrollment_type] || e.enrollment_type,
  status:         e.status                  || '',
  enrolledAt:     e.enrolled_at             || '',
})

const list = async ({ studentCode = '', fullName = '', courseCode = '', courseName = '', academicYear = '', semester = '', page = 1, pageSize = 10 } = {}) => {
  const params = { page, pageSize }
  if (studentCode)  params.student_code  = studentCode
  if (fullName)     params.full_name     = fullName
  if (courseCode)   params.course_code   = courseCode
  if (courseName)   params.course_name   = courseName
  if (academicYear) params.academic_year = academicYear
  if (semester)     params.semester      = semester

  const res = await api.get(ENROLLMENT_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const bulkAdd = async (rows) => {
  const body = rows.map((r) => ({
    student_code:    String(r.studentCode    || r.student_code    || '').trim(),
    course_code:     String(r.courseCode     || r.course_code     || '').trim(),
    academic_year:   String(r.academicYear   || r.academic_year   || '').trim(),
    semester:        Number(r.semester),
    enrollment_type: String(r.enrollmentType || r.enrollment_type || '').trim(),
  }))
  const res = await api.post(ENROLLMENT_EP.BULK, body)
  return res.data // { success, message, data: { total, successCount, errorCount, errors } }
}

export default { list, bulkAdd, ENROLLMENT_TYPE_LABEL }
