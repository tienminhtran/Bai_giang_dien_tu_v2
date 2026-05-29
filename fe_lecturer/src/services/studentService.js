import api from '../api/axios'
import { STUDENT_EP } from '../constants'

const toFrontend = (s) => ({
  id:          s.id,
  userId:      s.user_id,
  studentCode: s.student_code,
  fullName:    s.full_name,
  email:       s.email    || '',
  dob:         s.dob      || '',
  className:   s.class_name || '',
  major:       s.major    || '',
  phone:       s.phone    || '',
  avatarUrl:   s.avatar_url || '',
  isActive:    Boolean(s.is_active),
})

const list = async ({ studentCode = '', fullName = '', page = 1, pageSize = 10 } = {}) => {
  const params = { page, pageSize }
  if (studentCode) params.student_code = studentCode
  if (fullName)    params.full_name    = fullName

  const res = await api.get(STUDENT_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const create = async (form) => {
  const body = {
    student_code: form.studentCode?.trim(),
    full_name:    form.fullName?.trim(),
    email:        form.email?.trim()     || undefined,
    dob:          form.dob?.trim()       || undefined,
    class_name:   form.className?.trim() || undefined,
    major:        form.major?.trim()     || undefined,
    phone:        form.phone?.trim()     || undefined,
    avatar_url:   form.avatarUrl?.trim() || undefined,
  }
  const res = await api.post(STUDENT_EP.CREATE, body)
  return res.data
}

const importStudents = async (students) => {
  const body = students.map((form) => ({
    student_code: String(form.studentCode || '').trim(),
    full_name:    String(form.fullName || '').trim(),
    email:        form.email?.trim()     || undefined,
    dob:          form.dob?.trim()       || undefined,
    class_name:   form.className?.trim() || undefined,
    major:        form.major?.trim()     || undefined,
    phone:        form.phone?.trim()     || undefined,
    avatar_url:   form.avatarUrl?.trim() || undefined,
  }))
  const res = await api.post(STUDENT_EP.IMPORT, body)
  return res.data.data // { total, successCount, errorCount, errors }
}

const update = async (id, form) => {
  const body = {
    student_code: form.studentCode?.trim(),
    full_name:    form.fullName?.trim(),
    email:        form.email?.trim()     || undefined,
    dob:          form.dob?.trim()       || undefined,
    class_name:   form.className?.trim() || undefined,
    major:        form.major?.trim()     || undefined,
    phone:        form.phone?.trim()     || undefined,
    avatar_url:   form.avatarUrl?.trim() || undefined,
    is_active:    form.isActive,
  }
  const res = await api.put(`${STUDENT_EP.UPDATE}/${id}`, body)
  return res.data
}

const lockAccount = async (id, action = 'lock') => {
  const res = await api.post(`${STUDENT_EP.LIST}/${id}/lock`, { action })
  return res.data
}

const lockAccounts = async (studentIds = [], action = 'lock') => {
  const res = await api.post(STUDENT_EP.LOCK_BATCH, { studentIds, action })
  return res.data
}

const resetPassword = async (id, newPassword = '12345678') => {
  const res = await api.post(`${STUDENT_EP.LIST}/${id}/reset-password`, { newPassword })
  return res.data
}

export default { list, create, importStudents, update, lockAccount, lockAccounts, resetPassword }
