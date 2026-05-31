import api from '../api/axios'
import FACULTY_EP from '../constants/endpoints/faculty.endpoints'

const toFrontend = (f) => ({
  id:          f.id,
  facultyName: f.faculty_name,
  createdAt:   f.created_at || null,
})

const list = async () => {
  const res = await api.get(FACULTY_EP.LIST)
  return res.data.data.map(toFrontend)
}

const create = async ({ facultyName }) => {
  const res = await api.post(FACULTY_EP.CREATE, { faculty_name: facultyName?.trim() })
  return res.data
}

const update = async (id, { facultyName }) => {
  const res = await api.put(`${FACULTY_EP.UPDATE}/${id}`, { faculty_name: facultyName?.trim() })
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(`${FACULTY_EP.DELETE}/${id}`)
  return res.data
}

const importFaculties = async (records) => {
  const res = await api.post(FACULTY_EP.IMPORT, records)
  return res.data.data
}

export default { list, create, update, remove, importFaculties }
