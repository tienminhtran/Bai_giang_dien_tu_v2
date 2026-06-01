import api from '../api/axios'
import { GRADING_ROUND_EP } from '../constants'

const toFrontend = (r) => ({
  id:               r.id,
  sessionId:        r.session_id || '',
  sessionName:      r.session?.session_name || '',
  roundName:        r.round_name,
  roundNumber:      r.round_number ?? 1,
  facultyScopeId:   r.faculty_scope_id || '',
  facultyScopeName: r.facultyScope?.faculty_name || '',
  status:           r.status,
  parentRoundId:    r.parent_round_id || '',
  parentRoundName:  r.parentRound?.round_name || '',
  note:             r.note || '',
  createdAt:        r.created_at || '',
  startedAt:        r.started_at || '',
  closedAt:         r.closed_at || '',
})

const buildBody = (form) => ({
  session_id:       form.sessionId || undefined,
  round_name:       String(form.roundName || '').trim(),
  round_number:     form.roundNumber === '' || form.roundNumber == null ? undefined : Number(form.roundNumber),
  faculty_scope_id: form.facultyScopeId || undefined,
  status:           form.status || 'forming',
  parent_round_id:  form.parentRoundId || undefined,
  note:             form.note?.trim() || undefined,
})

const list = async ({ roundName = '', sessionId = '', facultyScopeId = '', status = '', page = 1, pageSize = 50 } = {}) => {
  const params = { page, pageSize }
  if (roundName)      params.round_name       = roundName
  if (sessionId)      params.session_id       = sessionId
  if (facultyScopeId) params.faculty_scope_id = facultyScopeId
  if (status)         params.status           = status

  const res = await api.get(GRADING_ROUND_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toFrontend), total }
}

const getOne = async (id) => {
  const res = await api.get(GRADING_ROUND_EP.DETAIL(id))
  return toFrontend(res.data.data)
}

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

export default { list, getOne, create, update, delete: remove }
