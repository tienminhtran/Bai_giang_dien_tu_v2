const { Op } = require('sequelize');
const {
  GradingGroup,
  GradingGroupMember,
  GradingRound,
  Faculty,
  Lecturer,
} = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_GROUP_STATUSES = ['forming', 'active', 'closed'];
const VALID_MEMBER_ROLES   = ['chair', 'member', 'secretary'];
const MEMBER_ROLE_LABEL    = { chair: 'Chủ tịch', secretary: 'Thư ký', member: 'Ủy viên' };

const MEMBER_INCLUDE = [
  { model: Lecturer, as: 'lecturer', attributes: ['id', 'lecturer_code', 'full_name', 'email'], required: false },
];

const GROUP_INCLUDE = [
  { model: GradingRound, as: 'round', attributes: ['id', 'round_name', 'round_number'], required: false },
  { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'], required: false },
  { model: GradingGroupMember, as: 'members', include: MEMBER_INCLUDE, required: false },
];

const normalizeGroup = (payload = {}) => ({
  round_id:   payload.round_id   == null || payload.round_id   === '' ? null : String(payload.round_id).trim(),
  group_name: payload.group_name == null ? '' : String(payload.group_name).trim(),
  group_code: payload.group_code == null || payload.group_code === '' ? null : String(payload.group_code).trim(),
  faculty_id: payload.faculty_id == null || payload.faculty_id === '' ? null : String(payload.faculty_id).trim(),
  status:     payload.status     == null || payload.status     === '' ? 'forming' : String(payload.status).trim().toLowerCase(),
  note:       payload.note       == null || payload.note       === '' ? null : String(payload.note).trim(),
});

// ── Danh sách nhóm (lọc theo round/faculty/status) ───────────────────────────
const listGroups = async ({ round_id, faculty_id, status, page = 1, pageSize = 20 }) => {
  const where = {};
  if (round_id)   where.round_id   = round_id;
  if (faculty_id) where.faculty_id = faculty_id;
  if (status)     where.status     = status;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    GradingGroup.count({ where }),
    GradingGroup.findAll({
      where, limit, offset,
      order: [['created_at', 'DESC']],
      include: GROUP_INCLUDE,
    }),
  ]);

  return { total, rows };
};

// ── Chi tiết 1 nhóm ───────────────────────────────────────────────────────────
const getGroup = async (id) => {
  const group = await GradingGroup.findByPk(id, { include: GROUP_INCLUDE });
  if (!group) throw ApiError.notFound('Không tìm thấy nhóm chấm');
  return group;
};

// ── Validate FK & enum cho nhóm ──────────────────────────────────────────────
const assertValidGroup = async (data) => {
  if (!data.group_name) throw ApiError.badRequest('group_name là bắt buộc');
  if (!data.round_id)   throw ApiError.badRequest('round_id là bắt buộc');
  if (!data.faculty_id) throw ApiError.badRequest('faculty_id là bắt buộc');

  if (!VALID_GROUP_STATUSES.includes(data.status))
    throw ApiError.badRequest(`status phải là một trong: ${VALID_GROUP_STATUSES.join(', ')}`);

  const [round, faculty] = await Promise.all([
    GradingRound.findByPk(data.round_id, { attributes: ['id'] }),
    Faculty.findByPk(data.faculty_id, { attributes: ['id'] }),
  ]);
  if (!round)   throw ApiError.notFound('Không tìm thấy vòng chấm (round_id)');
  if (!faculty) throw ApiError.notFound('Không tìm thấy khoa (faculty_id)');
};

// ── Tạo nhóm ──────────────────────────────────────────────────────────────────
const createGroup = async (payload = {}, createdByUserId) => {
  const data = normalizeGroup(payload);
  await assertValidGroup(data);

  const created = await GradingGroup.create({ ...data, created_by: createdByUserId });
  return getGroup(created.id);
};

// ── Cập nhật nhóm ─────────────────────────────────────────────────────────────
const updateGroup = async (id, payload = {}) => {
  const group = await GradingGroup.findByPk(id);
  if (!group) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  const data = normalizeGroup({ ...group.toJSON(), ...payload });
  await assertValidGroup(data);

  await group.update(data);
  return getGroup(id);
};

// ── Xóa nhóm ──────────────────────────────────────────────────────────────────
const deleteGroup = async (id) => {
  const group = await GradingGroup.findByPk(id);
  if (!group) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  // Xóa kèm các thành viên của nhóm
  await GradingGroupMember.destroy({ where: { group_id: id } });
  await group.destroy();
};

// ── Dữ liệu thiết lập hội đồng theo 1 vòng chấm ──────────────────────────────
//   Trả về: vòng chấm + nhóm (kèm thành viên) + danh sách khoa + danh sách giảng viên
//   Nếu vòng có phạm vi khoa (faculty_scope_id) thì khoa & giảng viên được lọc theo khoa đó.
const getRoundSetup = async (roundId) => {
  const round = await GradingRound.findByPk(roundId, {
    attributes: ['id', 'round_name', 'round_number', 'faculty_scope_id', 'status'],
    include: [{ model: Faculty, as: 'facultyScope', attributes: ['id', 'faculty_name'], required: false }],
  });
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm');

  const groups = await GradingGroup.findAll({
    where: { round_id: roundId },
    include: GROUP_INCLUDE,
    order: [['created_at', 'ASC']],
  });

  const facultyWhere = round.faculty_scope_id ? { id: round.faculty_scope_id } : {};
  const lecturerWhere = { is_active: true };
  if (round.faculty_scope_id) lecturerWhere.faculty_id = round.faculty_scope_id;

  const teamService = require('./gradingteam.service');

  const [faculties, lecturers, teams] = await Promise.all([
    Faculty.findAll({ where: facultyWhere, attributes: ['id', 'faculty_name'], order: [['faculty_name', 'ASC']] }),
    Lecturer.findAll({
      where: lecturerWhere,
      attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id', 'academic_degree'],
      include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'], required: false }],
      order: [['full_name', 'ASC']],
    }),
    // Nhóm chấm của vòng (khuôn GV, dùng lại cho nhiều hội đồng qua kéo-thả)
    teamService.listTeams({ round_id: roundId }),
  ]);

  return { round, groups, faculties, lecturers, teams };
};

// ── Tạo nhóm hàng loạt theo nhiều khoa ───────────────────────────────────────
//   Body: { round_id, faculty_ids: [...], group_name?, status?, note? }
//   Mỗi khoa tạo 1 nhóm. Bỏ qua khoa đã có nhóm trong vòng này.
const createGroupsByFaculties = async (payload = {}, createdByUserId) => {
  const roundId    = payload.round_id == null || payload.round_id === '' ? null : String(payload.round_id).trim();
  const facultyIds = Array.isArray(payload.faculty_ids)
    ? [...new Set(payload.faculty_ids.filter(Boolean).map((x) => String(x).trim()))]
    : [];
  const status   = payload.status == null || payload.status === '' ? 'forming' : String(payload.status).trim().toLowerCase();
  const baseName = payload.group_name == null ? '' : String(payload.group_name).trim();
  const note     = payload.note == null || payload.note === '' ? null : String(payload.note).trim();

  if (!roundId)          throw ApiError.badRequest('round_id là bắt buộc');
  if (!facultyIds.length) throw ApiError.badRequest('faculty_ids phải có ít nhất 1 khoa');
  if (!VALID_GROUP_STATUSES.includes(status))
    throw ApiError.badRequest(`status phải là một trong: ${VALID_GROUP_STATUSES.join(', ')}`);

  const round = await GradingRound.findByPk(roundId, { attributes: ['id'] });
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm (round_id)');

  const faculties  = await Faculty.findAll({ where: { id: { [Op.in]: facultyIds } }, attributes: ['id', 'faculty_name'] });
  const facultyMap = new Map(faculties.map((f) => [String(f.id), f.faculty_name]));
  const missing    = facultyIds.filter((fid) => !facultyMap.has(fid));
  if (missing.length) throw ApiError.notFound(`Không tìm thấy khoa: ${missing.join(', ')}`);

  // Bỏ qua khoa đã có nhóm trong vòng này
  const existing    = await GradingGroup.findAll({
    where: { round_id: roundId, faculty_id: { [Op.in]: facultyIds } },
    attributes: ['faculty_id'],
  });
  const existingSet = new Set(existing.map((g) => String(g.faculty_id)));

  const toCreate = [];
  const skipped  = [];
  for (const fid of facultyIds) {
    const fname = facultyMap.get(fid);
    if (existingSet.has(fid)) { skipped.push(fname); continue; }
    toCreate.push({
      round_id:   roundId,
      faculty_id: fid,
      group_name: baseName ? `${baseName} - ${fname}` : `Hội đồng chấm - ${fname}`,
      group_code: null,
      status,
      note,
      created_by: createdByUserId,
    });
  }

  if (toCreate.length) await GradingGroup.bulkCreate(toCreate);

  const setup = await getRoundSetup(roundId);
  return { ...setup, createdCount: toCreate.length, skipped };
};

// ── Thành viên nhóm ───────────────────────────────────────────────────────────
const assertValidMember = async (groupId, data, { excludeMemberId = null } = {}) => {
  if (!data.lecturer_id) throw ApiError.badRequest('lecturer_id là bắt buộc');
  if (!VALID_MEMBER_ROLES.includes(data.member_role))
    throw ApiError.badRequest(`member_role phải là một trong: ${VALID_MEMBER_ROLES.join(', ')}`);

  const lecturer = await Lecturer.findByPk(data.lecturer_id, { attributes: ['id'] });
  if (!lecturer) throw ApiError.notFound('Không tìm thấy giảng viên (lecturer_id)');

  // Một giảng viên chỉ tham gia 1 lần trong cùng nhóm
  const dupWhere = { group_id: groupId, lecturer_id: data.lecturer_id };
  if (excludeMemberId) dupWhere.id = { [Op.ne]: excludeMemberId };
  const dup = await GradingGroupMember.count({ where: dupWhere });
  if (dup > 0) throw ApiError.conflict('Giảng viên đã có trong nhóm này');

  // Hội đồng phải có đủ 3 vai trò; Chủ tịch & Thư ký mỗi nhóm 1 người, Ủy viên có thể nhiều người
  const SINGLE_ROLES = ['chair', 'secretary'];
  if (SINGLE_ROLES.includes(data.member_role)) {
    const roleWhere = { group_id: groupId, member_role: data.member_role };
    if (excludeMemberId) roleWhere.id = { [Op.ne]: excludeMemberId };
    const roleCount = await GradingGroupMember.count({ where: roleWhere });
    if (roleCount > 0)
      throw ApiError.conflict(`Nhóm đã có ${MEMBER_ROLE_LABEL[data.member_role] || data.member_role}`);
  }
};

const normalizeMember = (payload = {}) => ({
  lecturer_id:    payload.lecturer_id    == null || payload.lecturer_id    === '' ? null : String(payload.lecturer_id).trim(),
  member_role:    payload.member_role    == null || payload.member_role    === '' ? 'member' : String(payload.member_role).trim().toLowerCase(),
  position_title: payload.position_title == null || payload.position_title === '' ? null : String(payload.position_title).trim(),
  is_active:      payload.is_active      == null ? true : Boolean(payload.is_active),
});

const addMember = async (groupId, payload = {}, assignedByUserId) => {
  const group = await GradingGroup.findByPk(groupId, { attributes: ['id'] });
  if (!group) throw ApiError.notFound('Không tìm thấy nhóm chấm');

  const data = normalizeMember(payload);
  await assertValidMember(groupId, data);

  await GradingGroupMember.create({
    ...data,
    group_id: groupId,
    assigned_by: assignedByUserId,
  });

  return getGroup(groupId);
};

const removeMember = async (groupId, memberId) => {
  const member = await GradingGroupMember.findOne({ where: { id: memberId, group_id: groupId } });
  if (!member) throw ApiError.notFound('Không tìm thấy thành viên trong nhóm');

  // Hội đồng phải luôn đủ 3 vai trò → không cho xóa nếu là người duy nhất của vai trò đó
  const sameRoleCount = await GradingGroupMember.count({
    where: { group_id: groupId, member_role: member.member_role },
  });
  if (sameRoleCount <= 1)
    throw ApiError.badRequest(
      `Không thể xóa: hội đồng phải còn ít nhất 1 ${MEMBER_ROLE_LABEL[member.member_role] || member.member_role}`,
    );

  await member.destroy();
  return getGroup(groupId);
};

module.exports = {
  listGroups,
  getGroup,
  getRoundSetup,
  createGroup,
  createGroupsByFaculties,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
