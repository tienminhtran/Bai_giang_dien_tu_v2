import api from '../api/axios'
import DEPARTMENT_HEAD_EP from '../constants/endpoints/departmentHead.endpoints'

const toFrontend = (l) => ({
  id:             l.id,
  lecturerCode:   l.lecturer_code,
  fullName:       l.full_name,
  email:          l.email || '',
  facultyName:    l.faculty?.faculty_name || '',
  academicDegree: l.academic_degree || '',
  phone:          l.phone || '',
  isActive:       Boolean(l.is_active),
})

const listLecturers = async ({ lecturerCode = '', fullName = '', page = 1, pageSize = 20 } = {}) => {
  const params = { page, pageSize }
  if (lecturerCode) params.lecturer_code = lecturerCode
  if (fullName)     params.full_name     = fullName
  const res = await api.get(DEPARTMENT_HEAD_EP.LECTURERS, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

export default { listLecturers }
