import api from '../api/axios'
import { SECTION_EP } from '../constants'

const toFrontend = (s) => ({
  id:          s.id,
  courseId:    s.course_id,
  title:       s.section_title,
  order:       s.section_order,
  description: s.description || '',
  isActive:    Boolean(s.is_active),
  videoCount:  Number(s.video_count) || 0,
  createdAt:   s.created_at || '',
})

const list = async (courseId) => {
  const res = await api.get(SECTION_EP.LIST, { params: { course_id: courseId } })
  return (res.data.data || []).map(toFrontend)
}

const create = async ({ courseId, title, description = '', order }) => {
  const res = await api.post(SECTION_EP.CREATE, {
    course_id:     courseId,
    section_title: title?.trim(),
    description:   description?.trim() || undefined,
    section_order: order === '' || order == null ? undefined : Number(order),
  })
  return res.data
}

const update = async (id, { title, description, order, isActive } = {}) => {
  const body = {}
  if (title !== undefined)       body.section_title = title?.trim()
  if (description !== undefined)  body.description   = description?.trim() || null
  if (order !== undefined && order !== '') body.section_order = Number(order)
  if (isActive !== undefined)    body.is_active      = isActive
  const res = await api.put(SECTION_EP.UPDATE(id), body)
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(SECTION_EP.DELETE(id))
  return res.data
}

export default { list, create, update, delete: remove }
