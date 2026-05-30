import api from '../api/axios'
import MAJOR_EP from '../constants/endpoints/major.endpoints'

const toFrontend = (m) => ({
  id: m.id,
  majorName: m.major_name,
  facultyId: m.faculty_id,
  facultyName: m.faculty?.faculty_name || '',
  lecturerCount: Array.isArray(m.lecturers) ? m.lecturers.length : 0,
  isLock: Boolean(m.is_lock),
  createdAt: m.created_at,
})

// Admin lấy tất cả chuyên ngành
const listAll = async () => {
  const res = await api.get(MAJOR_EP.LIST_ALL)
  return res.data.data.map(toFrontend)
}

// Trưởng khoa lấy chuyên ngành trong khoa mình
const listMine = async () => {
  const res = await api.get(MAJOR_EP.LIST_MINE)
  return res.data.data.map(toFrontend)
}

// Admin tạo chuyên ngành
const create = async ({ majorName, facultyId }) => {
  const res = await api.post(MAJOR_EP.CREATE, { major_name: majorName, faculty_id: facultyId })
  return res.data
}

// Trưởng khoa tạo chuyên ngành trong khoa mình
const createMine = async ({ majorName, facultyId }) => {
  const res = await api.post(MAJOR_EP.CREATE_MINE, { major_name: majorName, faculty_id: facultyId })
  return res.data
}

// Admin thêm bất kỳ giảng viên vào chuyên ngành
const addLecturer = async (majorId, lecturerId) => {
  const res = await api.post(MAJOR_EP.ADD_LECTURER(majorId), { lecturer_id: lecturerId })
  return res.data
}

// Trưởng khoa thêm giảng viên khoa mình vào chuyên ngành
const addMyLecturer = async (majorId, lecturerId) => {
  const res = await api.post(MAJOR_EP.ADD_MY_LECTURER(majorId), { lecturer_id: lecturerId })
  return res.data
}

// Admin cập nhật chuyên ngành bất kỳ
const update = async (majorId, { majorName, facultyId }) => {
  const res = await api.put(MAJOR_EP.UPDATE(majorId), { major_name: majorName, faculty_id: facultyId })
  return res.data
}

// Trưởng khoa cập nhật chuyên ngành trong khoa mình
const updateMine = async (majorId, { majorName }) => {
  const res = await api.put(MAJOR_EP.UPDATE_MINE(majorId), { major_name: majorName })
  return res.data
}

// Admin xóa chuyên ngành
const remove = async (majorId) => {
  const res = await api.delete(MAJOR_EP.DELETE(majorId))
  return res.data
}

// Admin import hàng loạt từ file Excel
const importExcel = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(MAJOR_EP.IMPORT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Admin tải file Excel mẫu
const downloadTemplate = async () => {
  const res = await api.get(MAJOR_EP.TEMPLATE, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'major_import_template.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// Admin khóa / mở khóa chuyên ngành
const toggleLock = async (majorId, isLock) => {
  const res = await api.patch(MAJOR_EP.TOGGLE_LOCK(majorId), { is_lock: isLock })
  return res.data
}

// Admin khóa / mở khóa toàn bộ (có thể lọc theo facultyId)
const lockAll = async (isLock, facultyId = null) => {
  const body = { is_lock: isLock }
  if (facultyId) body.faculty_id = facultyId
  const res = await api.patch(MAJOR_EP.LOCK_ALL, body)
  return res.data
}

export default { listAll, listMine, create, createMine, addLecturer, addMyLecturer, update, updateMine, remove, importExcel, downloadTemplate, toggleLock, lockAll }
