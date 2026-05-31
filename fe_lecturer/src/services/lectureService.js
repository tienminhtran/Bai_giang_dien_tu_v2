import api from '../api/axios'
import LECTURE_EP from '../constants/endpoints/lecture.endpoints'

const toFrontend = (lecture) => ({
  id: lecture.id,
  userId: lecture.user_id,
  lecturerCode: lecture.lecturer_code,
  fullName: lecture.full_name,
  email: lecture.email || '',
  facultyId: lecture.faculty_id || null,
  facultyName: lecture.faculty?.faculty_name || '',
  majorId: lecture.major_id || null,
  majorName: lecture.major?.major_name || '',
  academicDegree: lecture.academic_degree || '',
  phone: lecture.phone || '',
  isActive: Boolean(lecture.is_active),
})

// facultyId: lọc theo khoa; noMajor: chỉ lấy GV chưa có chuyên ngành
const list = async ({ lecturerCode = '', fullName = '', facultyId = '', majorId = '', noMajor = false, page = 1, pageSize = 10 } = {}) => {
  const params = { page, pageSize }
  if (lecturerCode) params.lecturer_code = lecturerCode
  if (fullName) params.full_name = fullName
  if (facultyId) params.faculty_id = facultyId
  if (majorId) params.major_id = majorId
  if (noMajor) params.no_major = true

  const res = await api.get(LECTURE_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const create = async (form) => {
  const body = {
    lecturer_code: form.lecturerCode?.trim(),
    full_name: form.fullName?.trim(),
    email: form.email?.trim() || undefined,
    faculty_id: form.facultyId || undefined,
    major_id: form.majorId || undefined,
    academic_degree: form.academicDegree || undefined,
    phone: form.phone?.trim() || undefined,
  }
  const res = await api.post(LECTURE_EP.CREATE, body)
  return res.data
}

const importLecturers = async (lecturers) => {
  const body = lecturers.map((form) => ({
    lecturer_code:   String(form.lecturerCode || '').trim(),
    full_name:       String(form.fullName || '').trim(),
    email:           form.email?.trim() || undefined,
    faculty_name:    form.facultyName?.trim() || undefined,
    academic_degree: form.academicDegree?.trim() || undefined,
    phone:           form.phone?.trim() || undefined,
  }))
  const res = await api.post(LECTURE_EP.IMPORT, body)
  return res.data.data
}

const update = async (id, form) => {
  const body = {
    lecturer_code: form.lecturerCode?.trim(),
    full_name: form.fullName?.trim(),
    email: form.email?.trim() || undefined,
    faculty_id: form.facultyId || null,
    major_id: form.majorId || null,
    academic_degree: form.academicDegree || null,
    phone: form.phone?.trim() || undefined,
    is_active: form.isActive,
  }
  const res = await api.put(`${LECTURE_EP.UPDATE}/${id}`, body)
  return res.data
}

const updateDegree = async (id, academicDegree) => {
  const res = await api.patch(`${LECTURE_EP.DEGREE}/${id}/degree`, { academic_degree: academicDegree || null })
  return res.data
}

const lockAccount = async (id, action = 'lock') => {
  const res = await api.post(`${LECTURE_EP.LIST}/${id}/lock`, { action })
  return res.data
}

const lockAccounts = async (lecturerIds = [], action = 'lock') => {
  const res = await api.post(LECTURE_EP.LOCK_BATCH, { lecturerIds, action })
  return res.data
}

const resetPassword = async (id, newPassword = '12345678') => {
  const res = await api.post(`${LECTURE_EP.LIST}/${id}/reset-password`, { newPassword })
  return res.data
}

export default { list, create, importLecturers, update, updateDegree, lockAccount, lockAccounts, resetPassword }
