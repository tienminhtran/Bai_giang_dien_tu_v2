import api from '../api/axios'
import { GRADING_TEAM_EP } from '../constants'

// ── Mapping BE → FE ───────────────────────────────────────────────────────────
const toMember = (m) => ({
  id:            m.id,
  groupId:       m.group_id || '',
  teamId:        m.team_id || '',
  lecturerId:    m.lecturer_id,
  memberRole:    m.member_role,
  positionTitle: m.position_title || '',
  lecturerCode:  m.lecturer?.lecturer_code || '',
  lecturerName:  m.lecturer?.full_name || '',
  facultyName:   m.lecturer?.faculty?.faculty_name || '',
})

const toTeam = (t) => ({
  id:            t.id,
  roundId:       t.round_id || '',
  teamName:      t.team_name,
  note:          t.note || '',
  assignedCount: Number(t.assignedCount) || 0,
  createdAt:     t.created_at || '',
  members:       Array.isArray(t.members) ? t.members.map(toMember) : [],
})

// ── API ───────────────────────────────────────────────────────────────────────
const listTeams = async ({ roundId, onlyUnassigned = false } = {}) => {
  const params = {}
  if (roundId) params.round_id = roundId
  if (onlyUnassigned) params.only_unassigned = 'true'
  const res = await api.get(GRADING_TEAM_EP.LIST, { params })
  return (res.data.data || []).map(toTeam)
}

const createTeam = async ({ roundId, teamName, note = '', members }) => {
  const res = await api.post(GRADING_TEAM_EP.CREATE, {
    round_id:  roundId,
    team_name: teamName?.trim(),
    note:      note?.trim() || undefined,
    members:   members.map((m) => ({
      lecturer_id:    m.lecturerId,
      member_role:    m.memberRole,
      position_title: m.positionTitle?.trim() || undefined,
    })),
  })
  return res.data // { success, message, data }
}

const assignTeam = async (teamId, groupId) => {
  const res = await api.post(GRADING_TEAM_EP.ASSIGN(teamId), { group_id: groupId })
  return res.data
}

const unassignTeam = async (teamId) => {
  const res = await api.post(GRADING_TEAM_EP.UNASSIGN(teamId))
  return res.data
}

const removeTeam = async (teamId) => {
  const res = await api.delete(GRADING_TEAM_EP.DELETE(teamId))
  return res.data
}

export default { listTeams, createTeam, assignTeam, unassignTeam, delete: removeTeam }
