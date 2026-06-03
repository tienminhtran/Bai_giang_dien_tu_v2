const { Op } = require('sequelize');
const {
  GradingTeam,
  GradingGroup,
  GradingGroupMember,
  GradingRound,
  Lecturer,
  Faculty,
} = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_MEMBER_ROLES = ['chair', 'member', 'secretary'];
const MEMBER_ROLE_LABEL   = { chair: 'Chủ tịch', secretary: 'Thư ký', member: 'Ủy viên' };

const MEMBER_INCLUDE = [
  {
    model: Lecturer,
    as: 'lecturer',
    attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id'],
    include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'], required: false }],
    required: false,
  },
];

const TEAM_INCLUDE = [
  { model: GradingGroupMember, as: 'members', include: MEMBER_INCLUDE, required: false },
];

// ── Helper: id giảng viên đã thuộc nhóm/hội đồng nào đó trong vòng ───────────────
const getOccupiedLecturerIds = async (roundId) => {
  const [teams, groups] = await Promise.all([
    GradingTeam.findAll({ where: { round_id: roundId }, attributes: ['id'] }),
    GradingGroup.findAll({ where: { round_id: roundId }, attributes: ['id'] }),
  ]);
  const teamIds  = teams.map((t) => t.id);
  const groupIds = groups.map((g) => g.id);

  const or = [];
  if (teamIds.length)  or.push({ team_id:  { [Op.in]: teamIds } });
  if (groupIds.length) or.push({ group_id: { [Op.in]: groupIds } });
  if (or.length === 0) return new Set();

  const members = await GradingGroupMember.findAll({
    where: { [Op.or]: or },
    attributes: ['lecturer_id'],
  });
  return new Set(members.map((m) => String(m.lecturer_id)));
};

const getTeam = async (id) => {
  const team = await GradingTeam.findByPk(id, { include: TEAM_INCLUDE });
  if (!team) throw ApiError.notFound('Không tìm thấy nhóm chấm');
  return team;
};

// ── Danh sách nhóm chấm theo vòng ────────────────────────────────────────────────
//   Mỗi nhóm là 1 "khuôn" GV (members có group_id NULL). Khi gán vào hội đồng sẽ
//   COPY khuôn này thành thành viên của hội đồng (group_id set) → 1 nhóm dùng cho
//   nhiều hội đồng. `members` trả về chỉ là khuôn; `assignedCount` = số hội đồng đã gán.
const listTeams = async ({ round_id } = {}) => {
  if (!round_id) throw ApiError.badRequest('round_id là bắt buộc');

  const teams = await GradingTeam.findAll({
    where: { round_id },
    include: TEAM_INCLUDE,
    order: [['created_at', 'ASC']],
  });

  return teams.map((t) => {
    const json = t.toJSON();
    const all = json.members || [];
    const template = all.filter((m) => m.group_id == null);
    const assignedGroupIds = [...new Set(all.filter((m) => m.group_id != null).map((m) => String(m.group_id)))];
    return { ...json, members: template, assignedCount: assignedGroupIds.length };
  });
};

// ── Tạo nhóm chấm ────────────────────────────────────────────────────────────────
//   Body: { round_id, team_name, note?, members: [{ lecturer_id, member_role, position_title? }] }
const createTeam = async (payload = {}, createdByUserId) => {
  const roundId  = payload.round_id == null || payload.round_id === '' ? null : String(payload.round_id).trim();
  const teamName = payload.team_name == null ? '' : String(payload.team_name).trim();
  const note     = payload.note == null || payload.note === '' ? null : String(payload.note).trim();
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  if (!roundId)  throw ApiError.badRequest('round_id là bắt buộc');
  if (!teamName) throw ApiError.badRequest('team_name là bắt buộc');

  const round = await GradingRound.findByPk(roundId, { attributes: ['id'] });
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm (round_id)');

  // Chuẩn hóa member
  const members = rawMembers.map((m) => ({
    lecturer_id:    m.lecturer_id == null || m.lecturer_id === '' ? null : String(m.lecturer_id).trim(),
    member_role:    m.member_role == null || m.member_role === '' ? 'member' : String(m.member_role).trim().toLowerCase(),
    position_title: m.position_title == null || m.position_title === '' ? null : String(m.position_title).trim(),
  }));

  if (members.some((m) => !m.lecturer_id)) throw ApiError.badRequest('Mỗi thành viên phải có lecturer_id');
  if (members.some((m) => !VALID_MEMBER_ROLES.includes(m.member_role)))
    throw ApiError.badRequest(`member_role phải là một trong: ${VALID_MEMBER_ROLES.join(', ')}`);

  // Không trùng giảng viên trong cùng nhóm
  const lecturerIds = members.map((m) => m.lecturer_id);
  if (new Set(lecturerIds).size !== lecturerIds.length)
    throw ApiError.badRequest('Một giảng viên chỉ được chọn 1 lần trong nhóm');

  // Đủ 3 vai trò: đúng 1 Chủ tịch, đúng 1 Thư ký, ít nhất 1 Ủy viên
  const counts = members.reduce((acc, m) => { acc[m.member_role] = (acc[m.member_role] || 0) + 1; return acc; }, {});
  if ((counts.chair || 0) !== 1)     throw ApiError.badRequest('Nhóm phải có đúng 1 Chủ tịch');
  if ((counts.secretary || 0) !== 1) throw ApiError.badRequest('Nhóm phải có đúng 1 Thư ký');
  if ((counts.member || 0) < 1)      throw ApiError.badRequest('Nhóm phải có ít nhất 1 Ủy viên');

  // Giảng viên đã thuộc nhóm/hội đồng khác trong vòng thì không cho thêm
  const occupied = await getOccupiedLecturerIds(roundId);
  const clash = lecturerIds.filter((id) => occupied.has(String(id)));
  if (clash.length) {
    const names = await Lecturer.findAll({ where: { id: { [Op.in]: clash } }, attributes: ['lecturer_code', 'full_name'] });
    const label = names.map((n) => `${n.lecturer_code} - ${n.full_name}`).join(', ') || clash.join(', ');
    throw ApiError.conflict(`Giảng viên đã có trong nhóm/hội đồng khác của vòng này: ${label}`);
  }

  // Xác thực giảng viên tồn tại
  const found = await Lecturer.findAll({ where: { id: { [Op.in]: lecturerIds } }, attributes: ['id'] });
  if (found.length !== lecturerIds.length) throw ApiError.notFound('Có giảng viên không tồn tại');

  const team = await GradingTeam.create({
    round_id:   roundId,
    team_name:  teamName,
    note,
    created_by: createdByUserId,
  });

  await GradingGroupMember.bulkCreate(members.map((m) => ({
    group_id:       null,
    team_id:        team.id,
    lecturer_id:    m.lecturer_id,
    member_role:    m.member_role,
    position_title: m.position_title,
    assigned_by:    createdByUserId,
    is_active:      true,
  })));

  return getTeam(team.id);
};

// ── Gán nhóm vào 1 hội đồng (COPY khuôn GV vào hội đồng) ──────────────────────────
//   1 nhóm có thể gán cho nhiều hội đồng; mỗi lần gán tạo bản sao thành viên.
const assignTeamToGroup = async (teamId, groupId) => {
  if (!groupId) throw ApiError.badRequest('group_id là bắt buộc');

  const team = await GradingTeam.findByPk(teamId, { attributes: ['id', 'round_id'] });
  if (!team) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  const group = await GradingGroup.findByPk(groupId, { attributes: ['id', 'round_id'] });
  if (!group) throw ApiError.notFound('Không tìm thấy hội đồng');
  if (String(group.round_id) !== String(team.round_id))
    throw ApiError.badRequest('Nhóm và hội đồng không cùng vòng chấm');

  const existing = await GradingGroupMember.count({ where: { group_id: groupId } });
  if (existing > 0) throw ApiError.conflict('Hội đồng đã được phân công');

  // Khuôn GV của nhóm (group_id NULL)
  const template = await GradingGroupMember.findAll({ where: { team_id: teamId, group_id: null } });
  if (template.length === 0) throw ApiError.badRequest('Nhóm chưa có thành viên');

  await GradingGroupMember.bulkCreate(template.map((m) => ({
    group_id:       groupId,
    team_id:        teamId,
    lecturer_id:    m.lecturer_id,
    member_role:    m.member_role,
    position_title: m.position_title,
    assigned_by:    m.assigned_by,
    is_active:      true,
  })));

  return getTeam(teamId);
};

// ── Gỡ nhóm khỏi tất cả hội đồng (xóa các bản sao đã gán) ─────────────────────────
const unassignTeam = async (teamId) => {
  const team = await GradingTeam.findByPk(teamId, { attributes: ['id'] });
  if (!team) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  await GradingGroupMember.destroy({ where: { team_id: teamId, group_id: { [Op.ne]: null } } });
  return getTeam(teamId);
};

// ── Xóa nhóm (chỉ khi chưa gán hội đồng nào) ─────────────────────────────────────
const deleteTeam = async (teamId) => {
  const team = await GradingTeam.findByPk(teamId, {
    include: [{ model: GradingGroupMember, as: 'members', attributes: ['group_id'], required: false }],
  });
  if (!team) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  if ((team.members || []).some((m) => m.group_id != null))
    throw ApiError.badRequest('Nhóm đã được gán hội đồng, hãy gỡ gán trước khi xóa');

  await GradingGroupMember.destroy({ where: { team_id: teamId } });
  await GradingTeam.destroy({ where: { id: teamId } });
};

module.exports = {
  listTeams,
  getTeam,
  createTeam,
  assignTeamToGroup,
  unassignTeam,
  deleteTeam,
  getOccupiedLecturerIds,
};
