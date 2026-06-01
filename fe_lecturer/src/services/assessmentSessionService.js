import api from '../api/axios'
import { ASSESSMENT_SESSION_EP } from '../constants'

const toFrontend = (s) => ({
  id:                   s.id,
  sessionName:          s.session_name,
  description:          s.description || '',
  academicTermId:       s.academic_term_id || '',
  academicTermLabel:    s.academicTerm ? `${s.academicTerm.academic_year} - HK${s.academicTerm.semester}` : '',
  criteriaTemplateId:   s.criteria_template_id || '',
  criteriaTemplateName: s.criteriaTemplate?.template_name || '',
  startDate:            s.start_date || '',
  endDate:              s.end_date || '',
  status:               s.status,
  createdAt:            s.created_at || '',
  createdByName:        s.creator?.Lecturer?.full_name || s.creator?.username || '',
  createdByCode:        s.creator?.Lecturer?.lecturer_code || '',
})

const buildBody = (form) => ({
  session_name:         String(form.sessionName || '').trim(),
  description:          form.description?.trim() || undefined,
  academic_term_id:     form.academicTermId || undefined,
  criteria_template_id: form.criteriaTemplateId || undefined,
  start_date:           form.startDate || undefined,
  end_date:             form.endDate || undefined,
  status:               form.status || 'draft',
})

const list = async ({ sessionName = '', academicTermId = '', status = '', page = 1, pageSize = 50 } = {}) => {
  const params = { page, pageSize }
  if (sessionName)    params.session_name     = sessionName
  if (academicTermId) params.academic_term_id = academicTermId
  if (status)         params.status           = status

  const res = await api.get(ASSESSMENT_SESSION_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const getOne = async (id) => {
  const res = await api.get(ASSESSMENT_SESSION_EP.DETAIL(id))
  return toFrontend(res.data.data)
}

const create = async (form) => {
  const res = await api.post(ASSESSMENT_SESSION_EP.CREATE, buildBody(form))
  return res.data
}

const update = async (id, form) => {
  const res = await api.put(ASSESSMENT_SESSION_EP.UPDATE(id), buildBody(form))
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(ASSESSMENT_SESSION_EP.DELETE(id))
  return res.data
}

export default { list, getOne, create, update, delete: remove }
