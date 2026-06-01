import api from '../api/axios'
import { GRADING_GROUP_EP } from '../constants'

// ── Mapping BE → FE ───────────────────────────────────────────────────────────
const toLecturer = (l) => ({
  id:             l.id,
  lecturerCode:   l.lecturer_code,
  fullName:       l.full_name,
  email:          l.email || '',
  facultyId:      l.faculty_id || '',
  facultyName:    l.faculty?.faculty_name || '',
  academicDegree: l.academic_degree || '',
})

const toMember = (m) => ({
  id:            m.id,
  groupId:       m.group_id,
  lecturerId:    m.lecturer_id,
  memberRole:    m.member_role,
  positionTitle: m.position_title || '',
  isActive:      Boolean(m.is_active),
  assignedAt:    m.assigned_at || '',
  lecturerCode:  m.lecturer?.lecturer_code || '',
  lecturerName:  m.lecturer?.full_name || '',
  lecturerEmail: m.lecturer?.email || '',
})

const toGroup = (g) => ({
  id:          g.id,
  roundId:     g.round_id || '',
  roundName:   g.round?.round_name || '',
  groupName:   g.group_name,
  groupCode:   g.group_code || '',
  facultyId:   g.faculty_id || '',
  facultyName: g.faculty?.faculty_name || '',
  status:      g.status,
  note:        g.note || '',
  createdAt:   g.created_at || '',
  members:     Array.isArray(g.members) ? g.members.map(toMember) : [],
})

const toFaculty = (f) => ({ id: f.id, facultyName: f.faculty_name })

const toRound = (r) => ({
  id:               r.id,
  roundName:        r.round_name,
  roundNumber:      r.round_number ?? 1,
  status:           r.status,
  facultyScopeId:   r.faculty_scope_id || '',
  facultyScopeName: r.facultyScope?.faculty_name || '',
})

// ── Setup theo 1 vòng chấm (nhóm + thành viên + giảng viên + khoa) ────────────
const getRoundSetup = async (roundId) => {
  const res = await api.get(GRADING_GROUP_EP.ROUND_SETUP(roundId))
  const d = res.data.data
  return {
    round:     d.round ? toRound(d.round) : null,
    groups:    (d.groups || []).map(toGroup),
    faculties: (d.faculties || []).map(toFaculty),
    lecturers: (d.lecturers || []).map(toLecturer),
  }
}

// ── Danh sách nhóm theo vòng ──────────────────────────────────────────────────
const list = async ({ roundId = '', facultyId = '', status = '', page = 1, pageSize = 200 } = {}) => {
  const params = { page, pageSize }
  if (roundId)   params.round_id   = roundId
  if (facultyId) params.faculty_id = facultyId
  if (status)    params.status     = status
  const res = await api.get(GRADING_GROUP_EP.LIST, { params })
  const { data, total } = res.data
  return { rows: data.map(toGroup), total }
}

const getOne = async (id) => {
  const res = await api.get(GRADING_GROUP_EP.DETAIL(id))
  return toGroup(res.data.data)
}

// ── Tạo nhóm theo nhiều khoa ──────────────────────────────────────────────────
const bulkCreate = async ({ roundId, facultyIds, groupName = '', status = 'forming', note = '' }) => {
  const res = await api.post(GRADING_GROUP_EP.BULK, {
    round_id:    roundId,
    faculty_ids: facultyIds,
    group_name:  groupName?.trim() || undefined,
    status,
    note:        note?.trim() || undefined,
  })
  return res.data // { success, message, data: { ...setup, createdCount, skipped } }
}

const update = async (id, form) => {
  const res = await api.put(GRADING_GROUP_EP.UPDATE(id), {
    group_name: form.groupName?.trim(),
    group_code: form.groupCode?.trim() || undefined,
    faculty_id: form.facultyId || undefined,
    status:     form.status,
    note:       form.note?.trim() || undefined,
  })
  return toGroup(res.data.data)
}

const remove = async (id) => {
  const res = await api.delete(GRADING_GROUP_EP.DELETE(id))
  return res.data
}

// ── Thành viên ────────────────────────────────────────────────────────────────
const addMember = async (groupId, { lecturerId, memberRole = 'member', positionTitle = '' }) => {
  const res = await api.post(GRADING_GROUP_EP.MEMBERS(groupId), {
    lecturer_id:    lecturerId,
    member_role:    memberRole,
    position_title: positionTitle?.trim() || undefined,
  })
  return toGroup(res.data.data)
}

const updateMember = async (groupId, memberId, { memberRole, positionTitle, isActive }) => {
  const res = await api.put(GRADING_GROUP_EP.MEMBER(groupId, memberId), {
    member_role:    memberRole,
    position_title: positionTitle?.trim() || undefined,
    is_active:      isActive,
  })
  return toGroup(res.data.data)
}

const removeMember = async (groupId, memberId) => {
  const res = await api.delete(GRADING_GROUP_EP.MEMBER(groupId, memberId))
  return toGroup(res.data.data)
}

export default {
  getRoundSetup, list, getOne, bulkCreate, update, delete: remove,
  addMember, updateMember, removeMember,
}
