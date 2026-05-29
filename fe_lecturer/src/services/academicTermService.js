import api from '../api/axios'
import { ACADEMIC_TERM_EP } from '../constants'

const toFrontend = (t) => ({
  id:           t.id,
  academicYear: t.academic_year,
  semester:     t.semester,
  startDate:    t.start_date || '',
  endDate:      t.end_date   || '',
  isActive:     Boolean(t.is_active),
})

const list = async ({ academicYear = '', semester = '', isActive = '', page = 1, pageSize = 20 } = {}) => {
  const params = { page, pageSize }
  if (academicYear) params.academic_year = academicYear
  if (semester)     params.semester      = semester
  if (isActive !== '') params.is_active  = isActive

  const res = await api.get(ACADEMIC_TERM_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const create = async (form) => {
  const body = {
    academic_year: String(form.academicYear || '').replace(/\s*-\s*/g, '-').trim(),
    semester:      Number(form.semester),
    start_date:    form.startDate || undefined,
    end_date:      form.endDate   || undefined,
    is_active:     Boolean(form.isActive),
  }
  const res = await api.post(ACADEMIC_TERM_EP.CREATE, body)
  return res.data
}

const update = async (id, form) => {
  const body = {
    academic_year: String(form.academicYear || '').replace(/\s*-\s*/g, '-').trim(),
    semester:      Number(form.semester),
    start_date:    form.startDate || undefined,
    end_date:      form.endDate   || undefined,
    is_active:     Boolean(form.isActive),
  }
  const res = await api.put(`${ACADEMIC_TERM_EP.UPDATE}/${id}`, body)
  return res.data
}

export default { list, create, update }
