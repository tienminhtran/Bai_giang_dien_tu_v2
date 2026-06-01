import api from '../api/axios'
import { GRADING_ROUND_EP } from '../constants'

const toFrontend = (r) => ({
  id:                 r.id,
  roundName:          r.round_name,
  councilType:        r.council_type,
  status:            r.status,
  note:              r.note || '',
  courseId:          r.course_id || '',
  courseCode:        r.Course?.course_code || '',
  courseName:        r.Course?.course_name || '',
  criteriaTemplateId: r.criteria_template_id || '',
  criteriaTemplateName: r.criteriaTemplate?.template_name || '',
  parentRoundId:     r.parent_round_id || '',
  parentRoundName:   r.parentRound?.round_name || '',
  createdAt:         r.created_at || '',
  startedAt:         r.started_at || '',
  closedAt:          r.closed_at || '',
})

const list = async ({ roundName = '', courseId = '', councilType = '', status = '', page = 1, pageSize = 20 } = {}) => {
  const params = { page, pageSize }
  if (roundName)   params.round_name   = roundName
  if (courseId)    params.course_id    = courseId
  if (councilType) params.council_type = councilType
  if (status)      params.status       = status

  const res = await api.get(GRADING_ROUND_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const getOne = async (id) => {
  const res = await api.get(GRADING_ROUND_EP.DETAIL(id))
  return toFrontend(res.data.data)
}

const buildBody = (form) => ({
  course_id:            form.courseId || undefined,
  round_name:          String(form.roundName || '').trim(),
  council_type:        form.councilType,
  criteria_template_id: form.criteriaTemplateId || undefined,
  status:              form.status || 'forming',
  parent_round_id:     form.parentRoundId || undefined,
  note:                form.note?.trim() || undefined,
})

const create = async (form) => {
  const res = await api.post(GRADING_ROUND_EP.CREATE, buildBody(form))
  return res.data
}

const update = async (id, form) => {
  const res = await api.put(GRADING_ROUND_EP.UPDATE(id), buildBody(form))
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(GRADING_ROUND_EP.DELETE(id))
  return res.data
}

// Danh sách mẫu tiêu chí (cho dropdown)
const listTemplates = async ({ activeOnly = false } = {}) => {
  const res = await api.get(GRADING_ROUND_EP.TEMPLATES, { params: activeOnly ? { activeOnly: true } : {} })
  return (res.data.data || []).map((t) => ({
    id:           t.id,
    templateName: t.template_name,
    totalMaxScore: t.total_max_score,
    passScore:    t.pass_score,
    isActive:     Boolean(t.is_active),
  }))
}

export default { list, getOne, create, update, remove, listTemplates }
