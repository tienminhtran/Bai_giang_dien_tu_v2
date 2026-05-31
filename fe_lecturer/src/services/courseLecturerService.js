import api from '../api/axios'
import { COURSE_LECTURER_EP } from '../constants'

const toFrontend = (row) => ({
  id:                     row.id,
  lecturerCode:           row.Lecturer?.lecturer_code             || '',
  lecturerName:           row.Lecturer?.full_name                 || '',
  lecturerDegree:         row.Lecturer?.academic_degree           || '',
  lecturerFacultyName:    row.Lecturer?.faculty?.faculty_name     || '',
  lecturerDept:           row.Lecturer?.major?.major_name         || '',
  courseCode:             row.Course?.course_code                 || '',
  courseName:             row.Course?.course_name      || '',
  courseActive:           Boolean(row.Course?.is_active),
  roleName:               row.CourseRole?.role_name    || '',
  assignedByCode:         row.assignedByUser?.Lecturer?.lecturer_code || row.assignedByUser?.username || '',
  assignedByName:         row.assignedByUser?.Lecturer?.full_name     || row.assignedByUser?.username || '',
  assignedAt:             row.assigned_at || '',
  isActive:               Boolean(row.is_active),
})

const list = async ({
  lecturerCode = '', lecturerName = '',
  roleName = '',
  courseCode = '', courseName = '',
  assignedByCode = '', assignedByName = '',
  isActive = '',
  page = 1, pageSize = 20,
} = {}) => {
  const params = { page, pageSize }
  if (lecturerCode)   params.lecturer_code    = lecturerCode
  if (lecturerName)   params.lecturer_name    = lecturerName
  if (roleName)       params.role_name        = roleName
  if (courseCode)     params.course_code      = courseCode
  if (courseName)     params.course_name      = courseName
  if (assignedByCode) params.assigned_by_code = assignedByCode
  if (assignedByName) params.assigned_by_name = assignedByName
  if (isActive !== '') params.is_active       = isActive

  const res = await api.get(COURSE_LECTURER_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const assign = async ({ courseCode, lecturerCode, roleName }) => {
  const res = await api.post(COURSE_LECTURER_EP.ASSIGN, {
    course_code:   String(courseCode   || '').trim().toUpperCase(),
    lecturer_code: String(lecturerCode || '').trim(),
    role_name:     roleName,
  })
  return res.data
}

const updateRole = async (id, roleName) => {
  const res = await api.patch(`${COURSE_LECTURER_EP.ROLE}/${id}/role`, { role_name: roleName })
  return res.data
}

const updateStatus = async (id, isActive) => {
  const res = await api.patch(`${COURSE_LECTURER_EP.STATUS}/${id}/status`, { is_active: isActive })
  return res.data
}

const bulkAssign = async (rows) => {
  const body = rows.map((r) => ({
    course_code:   String(r.courseCode   || r.course_code   || '').trim().toUpperCase(),
    lecturer_code: String(r.lecturerCode || r.lecturer_code || '').trim(),
    role_name:     String(r.roleName     || r.role_name     || '').trim(),
  }))
  const res = await api.post(`${COURSE_LECTURER_EP.ASSIGN}/bulk`, body)
  return res.data // { success, message, data: { total, successCount, errorCount, errors } }
}

export default { list, assign, updateRole, updateStatus, bulkAssign }
