const { Op } = require('sequelize');
const { GradingRound, Course, GradingCriteriaTemplate, GradingRoundMember } = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_COUNCIL_TYPES = ['evaluator', 'secretary'];
const VALID_STATUSES      = ['forming', 'active', 'finalizing', 'closed'];

// include dùng chung cho mọi truy vấn trả về 1 đợt kiểm định
const ROUND_INCLUDE = [
  { model: Course, attributes: ['id', 'course_code', 'course_name'] },
  { model: GradingCriteriaTemplate, as: 'criteriaTemplate', attributes: ['id', 'template_name', 'total_max_score', 'pass_score'] },
  { model: GradingRound, as: 'parentRound', attributes: ['id', 'round_name'], required: false },
];

const normalizePayload = (payload = {}) => ({
  course_id:            payload.course_id            == null || payload.course_id            === '' ? null : String(payload.course_id).trim(),
  round_name:           payload.round_name           == null ? '' : String(payload.round_name).trim(),
  council_type:         payload.council_type         == null ? '' : String(payload.council_type).trim().toLowerCase(),
  criteria_template_id: payload.criteria_template_id == null || payload.criteria_template_id === '' ? null : String(payload.criteria_template_id).trim(),
  status:               payload.status               == null || payload.status               === '' ? 'forming' : String(payload.status).trim().toLowerCase(),
  parent_round_id:      payload.parent_round_id      == null || payload.parent_round_id      === '' ? null : String(payload.parent_round_id).trim(),
  note:                 payload.note                 == null || payload.note                 === '' ? null : String(payload.note).trim(),
});

// ── Danh sách (phân trang + lọc) ──────────────────────────────────────────────
const listRounds = async ({ round_name, course_id, council_type, status, page = 1, pageSize = 20 }) => {
  const where = {};
  if (round_name)   where.round_name   = { [Op.like]: `%${round_name}%` };
  if (course_id)    where.course_id    = course_id;
  if (council_type) where.council_type = council_type;
  if (status)       where.status       = status;

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

// ── Chi tiết 1 đợt ────────────────────────────────────────────────────────────
const getRound = async (id) => {
  const round = await GradingRound.findByPk(id, { include: ROUND_INCLUDE });
  if (!round) throw ApiError.notFound('Không tìm thấy đợt kiểm định');
  return round;
};

// ── Validate FK & enum dùng chung cho create/update ──────────────────────────
const assertValid = async (data, { selfId = null } = {}) => {
  if (!data.round_name)   throw ApiError.badRequest('round_name là bắt buộc');
  if (!data.course_id)    throw ApiError.badRequest('course_id là bắt buộc');
  if (!data.criteria_template_id) throw ApiError.badRequest('criteria_template_id là bắt buộc');

  if (!VALID_COUNCIL_TYPES.includes(data.council_type))
    throw ApiError.badRequest(`council_type phải là một trong: ${VALID_COUNCIL_TYPES.join(', ')}`);
  if (!VALID_STATUSES.includes(data.status))
    throw ApiError.badRequest(`status phải là một trong: ${VALID_STATUSES.join(', ')}`);

  const [course, template] = await Promise.all([
    Course.findByPk(data.course_id, { attributes: ['id'] }),
    GradingCriteriaTemplate.findByPk(data.criteria_template_id, { attributes: ['id'] }),
  ]);
  if (!course)   throw ApiError.notFound('Không tìm thấy môn học (course_id)');
  if (!template) throw ApiError.notFound('Không tìm thấy mẫu tiêu chí (criteria_template_id)');

  if (data.parent_round_id) {
    if (selfId && String(data.parent_round_id) === String(selfId))
      throw ApiError.badRequest('parent_round_id không thể trỏ tới chính nó');
    const parent = await GradingRound.findByPk(data.parent_round_id, { attributes: ['id'] });
    if (!parent) throw ApiError.notFound('Không tìm thấy đợt cha (parent_round_id)');
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
  if (!round) throw ApiError.notFound('Không tìm thấy đợt kiểm định');

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
  if (!round) throw ApiError.notFound('Không tìm thấy đợt kiểm định');

  // Chặn xóa nếu đã có thành viên hội đồng / đợt con
  const [memberCount, childCount] = await Promise.all([
    GradingRoundMember.count({ where: { round_id: id } }),
    GradingRound.count({ where: { parent_round_id: id } }),
  ]);
  if (memberCount > 0)
    throw ApiError.conflict(`Không thể xóa: đợt đang có ${memberCount} thành viên hội đồng`);
  if (childCount > 0)
    throw ApiError.conflict(`Không thể xóa: đợt đang có ${childCount} đợt con (phúc khảo)`);

  await round.destroy();
};

module.exports = { listRounds, getRound, createRound, updateRound, deleteRound };
