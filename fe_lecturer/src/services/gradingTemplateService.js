import api from '../api/axios'
import { GRADING_TEMPLATE_EP } from '../constants'

// ── Mapping BE → FE ───────────────────────────────────────────────────────────
const toItem = (i) => ({
  id:           i.id,
  templateId:   i.template_id,
  code:         i.code,
  criteriaName: i.criteria_name,
  description:  i.description || '',
  maxScore:     i.max_score == null ? '' : Number(i.max_score),
  weight:       i.weight == null ? '' : Number(i.weight),
  displayOrder: i.display_order ?? 0,
  isRequired:   Boolean(i.is_required),
})

const toTemplate = (t) => ({
  id:            t.id,
  templateName:  t.template_name,
  description:   t.description || '',
  totalMaxScore: t.total_max_score == null ? '' : Number(t.total_max_score),
  passScore:     t.pass_score == null ? '' : Number(t.pass_score),
  isActive:      Boolean(t.is_active),
  createdAt:     t.created_at || '',
  createdById:   t.created_by || '',
  createdByName: t.creator?.Lecturer?.full_name || t.creator?.username || '',
  createdByCode: t.creator?.Lecturer?.lecturer_code || '',
  items:         Array.isArray(t.items) ? t.items.map(toItem) : [],
})

// ── Mapping FE → BE ───────────────────────────────────────────────────────────
const buildTemplateBody = (form) => ({
  template_name:   String(form.templateName || '').trim(),
  description:     form.description?.trim() || undefined,
  total_max_score: form.totalMaxScore === '' || form.totalMaxScore == null ? undefined : Number(form.totalMaxScore),
  pass_score:      form.passScore === '' || form.passScore == null ? undefined : Number(form.passScore),
  is_active:       form.isActive,
})

const buildItemBody = (form) => ({
  code:          String(form.code || '').trim(),
  criteria_name: String(form.criteriaName || '').trim(),
  description:   form.description?.trim() || undefined,
  max_score:     form.maxScore === '' || form.maxScore == null ? undefined : Number(form.maxScore),
  weight:        form.weight === '' || form.weight == null ? undefined : Number(form.weight),
  display_order: form.displayOrder === '' || form.displayOrder == null ? undefined : Number(form.displayOrder),
  is_required:   form.isRequired == null ? true : Boolean(form.isRequired),
})

// ── Templates ─────────────────────────────────────────────────────────────────
const list = async ({ activeOnly = false } = {}) => {
  const res = await api.get(GRADING_TEMPLATE_EP.LIST, { params: activeOnly ? { activeOnly: true } : {} })
  return (res.data.data || []).map(toTemplate)
}

const getOne = async (id) => {
  const res = await api.get(GRADING_TEMPLATE_EP.DETAIL(id))
  return toTemplate(res.data.data)
}

const create = async (form) => {
  const body = buildTemplateBody(form)
  if (Array.isArray(form.items) && form.items.length) body.items = form.items.map(buildItemBody)
  const res = await api.post(GRADING_TEMPLATE_EP.CREATE, body)
  return res.data
}

const update = async (id, form) => {
  const res = await api.put(GRADING_TEMPLATE_EP.UPDATE(id), buildTemplateBody(form))
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(GRADING_TEMPLATE_EP.DELETE(id))
  return res.data
}

// ── Items ─────────────────────────────────────────────────────────────────────
// Thêm 1 hoặc nhiều tiêu chí (append)
const addItems = async (templateId, items) => {
  const arr = Array.isArray(items) ? items : [items]
  const res = await api.post(GRADING_TEMPLATE_EP.ITEMS(templateId), { items: arr.map(buildItemBody) })
  return toTemplate(res.data.data)
}

// Import nhiều tiêu chí từ Excel — mode 'append' | 'replace'
const importItems = async (templateId, items, mode = 'append') => {
  const res = await api.post(GRADING_TEMPLATE_EP.ITEMS_IMPORT(templateId), {
    items: items.map(buildItemBody),
    mode,
  })
  return toTemplate(res.data.data)
}

const updateItem = async (templateId, itemId, form) => {
  const res = await api.put(GRADING_TEMPLATE_EP.ITEM(templateId, itemId), buildItemBody(form))
  return toTemplate(res.data.data)
}

const removeItem = async (templateId, itemId) => {
  const res = await api.delete(GRADING_TEMPLATE_EP.ITEM(templateId, itemId))
  return toTemplate(res.data.data)
}

export default { list, getOne, create, update, delete: remove, addItems, importItems, updateItem, removeItem }
