const { Op } = require('sequelize');
const {
  AssessmentSession,
  AcademicTerm,
  GradingCriteriaTemplate,
  GradingRound,
  User,
  Lecturer,
} = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_STATUSES = ['draft', 'active', 'closed'];

const SESSION_INCLUDE = [
  { model: AcademicTerm, as: 'academicTerm', attributes: ['id', 'academic_year', 'semester'], required: false },
  { model: GradingCriteriaTemplate, as: 'criteriaTemplate', attributes: ['id', 'template_name', 'total_max_score', 'pass_score'], required: false },
  {
    model: User, as: 'creator', attributes: ['id', 'username'], required: false,
    include: [{ model: Lecturer, attributes: ['lecturer_code', 'full_name'], required: false }],
  },
];

const normalizePayload = (payload = {}) => ({
  session_name:         payload.session_name         == null ? '' : String(payload.session_name).trim(),
  description:          payload.description          == null || payload.description          === '' ? null : String(payload.description).trim(),
  academic_term_id:     payload.academic_term_id     == null || payload.academic_term_id     === '' ? null : String(payload.academic_term_id).trim(),
  criteria_template_id: payload.criteria_template_id == null || payload.criteria_template_id === '' ? null : String(payload.criteria_template_id).trim(),
  start_date:           payload.start_date           == null || payload.start_date           === '' ? null : String(payload.start_date).trim(),
  end_date:             payload.end_date             == null || payload.end_date             === '' ? null : String(payload.end_date).trim(),
  status:               payload.status               == null || payload.status               === '' ? 'draft' : String(payload.status).trim().toLowerCase(),
});

// ── Danh sách (phân trang + lọc) ──────────────────────────────────────────────
const listSessions = async ({ session_name, academic_term_id, status, page = 1, pageSize = 20 }) => {
  const where = {};
  if (session_name)     where.session_name     = { [Op.like]: `%${session_name}%` };
  if (academic_term_id) where.academic_term_id = academic_term_id;
  if (status)           where.status           = status;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    AssessmentSession.count({ where }),
    AssessmentSession.findAll({
      where, limit, offset,
      order: [['created_at', 'DESC']],
      include: SESSION_INCLUDE,
    }),
  ]);

  return { total, rows };
};

// ── Chi tiết 1 đợt ────────────────────────────────────────────────────────────
const getSession = async (id) => {
  const session = await AssessmentSession.findByPk(id, { include: SESSION_INCLUDE });
  if (!session) throw ApiError.notFound('Không tìm thấy đợt kiểm định');
  return session;
};

// ── Validate FK & enum dùng chung cho create/update ──────────────────────────
const assertValid = async (data) => {
  if (!data.session_name)         throw ApiError.badRequest('session_name là bắt buộc');
  if (!data.academic_term_id)     throw ApiError.badRequest('academic_term_id là bắt buộc');
  if (!data.criteria_template_id) throw ApiError.badRequest('criteria_template_id là bắt buộc');
  if (!data.start_date)           throw ApiError.badRequest('start_date là bắt buộc');
  if (!data.end_date)             throw ApiError.badRequest('end_date là bắt buộc');

  if (new Date(data.end_date) < new Date(data.start_date))
    throw ApiError.badRequest('end_date phải >= start_date');

  if (!VALID_STATUSES.includes(data.status))
    throw ApiError.badRequest(`status phải là một trong: ${VALID_STATUSES.join(', ')}`);

  const [term, template] = await Promise.all([
    AcademicTerm.findByPk(data.academic_term_id, { attributes: ['id'] }),
    GradingCriteriaTemplate.findByPk(data.criteria_template_id, { attributes: ['id'] }),
  ]);
  if (!term)     throw ApiError.notFound('Không tìm thấy học kỳ (academic_term_id)');
  if (!template) throw ApiError.notFound('Không tìm thấy mẫu tiêu chí (criteria_template_id)');
};

// ── Tạo mới ──────────────────────────────────────────────────────────────────
const createSession = async (payload = {}, createdByUserId) => {
  const data = normalizePayload(payload);
  await assertValid(data);

  const created = await AssessmentSession.create({
    ...data,
    created_by: createdByUserId,
  });

  return getSession(created.id);
};

// ── Cập nhật ─────────────────────────────────────────────────────────────────
const updateSession = async (id, payload = {}) => {
  const session = await AssessmentSession.findByPk(id);
  if (!session) throw ApiError.notFound('Không tìm thấy đợt kiểm định');

  const data = normalizePayload({ ...session.toJSON(), ...payload });
  await assertValid(data);

  await session.update({ ...data, updated_at: new Date() });
  return getSession(id);
};

// ── Xóa ──────────────────────────────────────────────────────────────────────
const deleteSession = async (id) => {
  const session = await AssessmentSession.findByPk(id);
  if (!session) throw ApiError.notFound('Không tìm thấy đợt kiểm định');

  const roundCount = await GradingRound.count({ where: { session_id: id } });
  if (roundCount > 0)
    throw ApiError.conflict(`Không thể xóa: đợt đang có ${roundCount} vòng chấm`);

  await session.destroy();
};

module.exports = { listSessions, getSession, createSession, updateSession, deleteSession };
