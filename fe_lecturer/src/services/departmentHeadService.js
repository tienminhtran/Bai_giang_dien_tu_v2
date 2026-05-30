import api from '../api/axios'
import DEPARTMENT_HEAD_EP from '../constants/endpoints/departmentHead.endpoints'

const toFrontend = (l) => ({
  id:             l.id,
  lecturerCode:   l.lecturer_code,
  fullName:       l.full_name,
  email:          l.email || '',
  facultyId:      l.faculty_id || null,
  facultyName:    l.faculty?.faculty_name || '',
  majorId:        l.major_id || null,
  majorName:      l.major?.major_name || '',
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

// Lấy danh sách giảng viên theo chuyên ngành cụ thể (trưởng khoa)
const listLecturersByMajor = async (majorId, { lecturerCode = '', fullName = '', page = 1, pageSize = 20 } = {}) => {
  const params = { page, pageSize }
  if (lecturerCode) params.lecturer_code = lecturerCode
  if (fullName)     params.full_name     = fullName
  const res = await api.get(DEPARTMENT_HEAD_EP.MAJOR_LECTURERS(majorId), { params })
  const { data, total, major_name, is_lock, faculty_id } = res.data
  return { rows: data.map(toFrontend), total, majorName: major_name, isLock: Boolean(is_lock), facultyId: faculty_id }
}

export default { listLecturers, listLecturersByMajor }
