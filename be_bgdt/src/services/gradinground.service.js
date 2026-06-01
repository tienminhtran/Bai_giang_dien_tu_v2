const { Op } = require('sequelize');
const {
  GradingRound,
  AssessmentSession,
  Faculty,
  GradingGroup,
} = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_STATUSES = ['forming', 'active', 'finalizing', 'closed'];

// include dùng chung cho mọi truy vấn trả về 1 vòng chấm
const ROUND_INCLUDE = [
  { model: AssessmentSession, as: 'session', attributes: ['id', 'session_name', 'status'], required: false },
  { model: Faculty, as: 'facultyScope', attributes: ['id', 'faculty_name'], required: false },
  { model: GradingRound, as: 'parentRound', attributes: ['id', 'round_name'], required: false },
];

const normalizePayload = (payload = {}) => ({
  session_id:       payload.session_id       == null || payload.session_id       === '' ? null : String(payload.session_id).trim(),
  round_name:       payload.round_name       == null ? '' : String(payload.round_name).trim(),
  round_number:     payload.round_number     == null || payload.round_number     === '' ? 1 : Number(payload.round_number),
  faculty_scope_id: payload.faculty_scope_id == null || payload.faculty_scope_id === '' ? null : String(payload.faculty_scope_id).trim(),
  status:           payload.status           == null || payload.status           === '' ? 'forming' : String(payload.status).trim().toLowerCase(),
  parent_round_id:  payload.parent_round_id  == null || payload.parent_round_id  === '' ? null : String(payload.parent_round_id).trim(),
  note:             payload.note             == null || payload.note             === '' ? null : String(payload.note).trim(),
});

// ── Danh sách (phân trang + lọc) ──────────────────────────────────────────────
const listRounds = async ({ round_name, session_id, faculty_scope_id, status, page = 1, pageSize = 20 }) => {
  const where = {};
  if (round_name)       where.round_name       = { [Op.like]: `%${round_name}%` };
  if (session_id)       where.session_id       = session_id;
  if (faculty_scope_id) where.faculty_scope_id = faculty_scope_id;
  if (status)           where.status           = status;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    GradingRound.count({ where }),
    GradingRound.findAll({
      where, limit, offset,
      order: [['created_at', 'DESC']],
      include: ROUND_INCLUDE,
    }),
  ]);

  return { total, rows };
};

// ── Chi tiết 1 vòng ───────────────────────────────────────────────────────────
const getRound = async (id) => {
  const round = await GradingRound.findByPk(id, { include: ROUND_INCLUDE });
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm');
  return round;
};

// ── Validate FK & enum dùng chung cho create/update ──────────────────────────
const assertValid = async (data, { selfId = null } = {}) => {
  if (!data.round_name) throw ApiError.badRequest('round_name là bắt buộc');
  if (!Number.isInteger(data.round_number) || data.round_number < 1)
    throw ApiError.badRequest('round_number phải là số nguyên >= 1');

  if (!VALID_STATUSES.includes(data.status))
    throw ApiError.badRequest(`status phải là một trong: ${VALID_STATUSES.join(', ')}`);

  if (data.session_id) {
    const session = await AssessmentSession.findByPk(data.session_id, { attributes: ['id'] });
    if (!session) throw ApiError.notFound('Không tìm thấy đợt kiểm định (session_id)');
  }

  if (data.faculty_scope_id) {
    const faculty = await Faculty.findByPk(data.faculty_scope_id, { attributes: ['id'] });
    if (!faculty) throw ApiError.notFound('Không tìm thấy khoa (faculty_scope_id)');
  }

  if (data.parent_round_id) {
    if (selfId && String(data.parent_round_id) === String(selfId))
      throw ApiError.badRequest('parent_round_id không thể trỏ tới chính nó');
    const parent = await GradingRound.findByPk(data.parent_round_id, { attributes: ['id'] });
    if (!parent) throw ApiError.notFound('Không tìm thấy vòng cha (parent_round_id)');
  }
};

// ── Tạo mới ──────────────────────────────────────────────────────────────────
const createRound = async (payload = {}, createdByUserId) => {
  const data = normalizePayload(payload);
  await assertValid(data);

  const created = await GradingRound.create({
    ...data,
    created_by: createdByUserId,
    started_at: data.status === 'active' ? new Date() : null,
    closed_at:  data.status === 'closed' ? new Date() : null,
  });

  return getRound(created.id);
};

// ── Cập nhật ─────────────────────────────────────────────────────────────────
const updateRound = async (id, payload = {}) => {
  const round = await GradingRound.findByPk(id);
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm');

  const data = normalizePayload({ ...round.toJSON(), ...payload });
  await assertValid(data, { selfId: id });

  // Cập nhật mốc thời gian theo chuyển trạng thái
  const patch = { ...data };
  if (data.status === 'active' && !round.started_at) patch.started_at = new Date();
  if (data.status === 'closed' && !round.closed_at)  patch.closed_at  = new Date();

  await round.update(patch);
  return getRound(id);
};

// ── Xóa ──────────────────────────────────────────────────────────────────────
const deleteRound = async (id) => {
  const round = await GradingRound.findByPk(id);
  if (!round) throw ApiError.notFound('Không tìm thấy vòng chấm');

  // Chặn xóa nếu vòng đã có nhóm chấm / vòng con (phúc khảo)
  const [groupCount, childCount] = await Promise.all([
    GradingGroup.count({ where: { round_id: id } }),
    GradingRound.count({ where: { parent_round_id: id } }),
  ]);
  if (groupCount > 0)
    throw ApiError.conflict(`Không thể xóa: vòng đang có ${groupCount} nhóm chấm`);
  if (childCount > 0)
    throw ApiError.conflict(`Không thể xóa: vòng đang có ${childCount} vòng con (phúc khảo)`);

  await round.destroy();
};

module.exports = { listRounds, getRound, createRound, updateRound, deleteRound };
