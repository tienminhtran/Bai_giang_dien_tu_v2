const { Op } = require('sequelize');
const { GradingCriteriaTemplate, GradingCriteriaItem, AssessmentSession } = require('../models');
const ApiError = require('../utils/ApiError');

const EPS = 1e-6;

// ── Lấy mẫu tiêu chí hoặc báo 404 ─────────────────────────────────────────────
const getTemplateOrFail = async (templateId) => {
  const template = await GradingCriteriaTemplate.findByPk(templateId);
  if (!template) throw ApiError.notFound('Không tìm thấy mẫu tiêu chí');
  return template;
};

// ── Mẫu có đang được dùng trong đợt kiểm định nào không ────────────────────────
const countSessionsUsingTemplate = async (templateId) =>
  AssessmentSession.count({ where: { criteria_template_id: templateId } });

// Chặn thao tác nếu mẫu đã gắn với đợt kiểm định
const assertTemplateNotUsedInSession = async (templateId, action = 'thao tác') => {
  const n = await countSessionsUsingTemplate(templateId);
  if (n > 0)
    throw ApiError.conflict(`Không thể ${action}: mẫu tiêu chí đang được dùng trong ${n} đợt kiểm định`);
};

// ── Đếm số tiêu chí (câu hỏi) của mẫu ─────────────────────────────────────────
const countItems = async (templateId) =>
  GradingCriteriaItem.count({ where: { template_id: templateId } });

// ── Tổng điểm max_score hiện có (có thể loại trừ một số item đang sửa) ─────────
const sumItemScores = async (templateId, { excludeItemIds = [] } = {}) => {
  const where = { template_id: templateId };
  if (excludeItemIds.length) where.id = { [Op.notIn]: excludeItemIds };
  const total = await GradingCriteriaItem.sum('max_score', { where });
  return Number(total) || 0;
};

// ── Chuẩn hóa 1 tiêu chí từ payload thô (kể cả dữ liệu import Excel) ───────────
const normalizeItem = (raw = {}) => ({
  code:          raw.code          == null ? '' : String(raw.code).trim(),
  criteria_name: raw.criteria_name == null ? '' : String(raw.criteria_name).trim(),
  description:   raw.description   == null || raw.description === '' ? null : String(raw.description).trim(),
  max_score:     raw.max_score     == null || raw.max_score === '' ? NaN : Number(raw.max_score),
  weight:        raw.weight        == null || raw.weight === '' ? null : Number(raw.weight),
  display_order: raw.display_order == null || raw.display_order === '' ? 0 : parseInt(raw.display_order, 10),
  is_required:   raw.is_required   == null ? true : Boolean(raw.is_required),
});

// ── Validate hình thức 1 tiêu chí (khớp các CHECK constraint trong DB) ─────────
const validateItemShape = (item, idx = null) => {
  const at = idx == null ? '' : ` (dòng ${idx + 1})`;
  if (!item.code)               throw ApiError.badRequest(`code là bắt buộc${at}`);
  if (item.code.length > 20)    throw ApiError.badRequest(`code tối đa 20 ký tự${at}`);
  if (!item.criteria_name)      throw ApiError.badRequest(`criteria_name là bắt buộc${at}`);
  if (!Number.isFinite(item.max_score) || item.max_score <= 0)
    throw ApiError.badRequest(`max_score phải là số > 0${at}`);
  if (item.weight !== null && (!Number.isFinite(item.weight) || item.weight <= 0 || item.weight > 1))
    throw ApiError.badRequest(`weight phải nằm trong khoảng (0, 1]${at}`);
  if (!Number.isInteger(item.display_order))
    throw ApiError.badRequest(`display_order phải là số nguyên${at}`);
};

// ── Validate cả lô: từng item + chặn trùng code trong chính danh sách ──────────
const validateItemsBatch = (items) => {
  if (!Array.isArray(items) || items.length === 0)
    throw ApiError.badRequest('Cần ít nhất 1 tiêu chí');
  const seen = new Set();
  items.forEach((item, idx) => {
    validateItemShape(item, idx);
    const key = item.code.toLowerCase();
    if (seen.has(key)) throw ApiError.badRequest(`Trùng code "${item.code}" trong danh sách (dòng ${idx + 1})`);
    seen.add(key);
  });
};

// ── Chặn trùng code với các tiêu chí đã có trong mẫu (UQ template_id + code) ───
const assertCodesNotExisting = async (templateId, codes, { excludeItemIds = [] } = {}) => {
  if (!codes.length) return;
  const where = { template_id: templateId, code: { [Op.in]: codes } };
  if (excludeItemIds.length) where.id = { [Op.notIn]: excludeItemIds };
  const existing = await GradingCriteriaItem.findAll({ where, attributes: ['code'] });
  if (existing.length)
    throw ApiError.conflict(`code đã tồn tại trong mẫu: ${existing.map((e) => e.code).join(', ')}`);
};

// ── Chặn tổng điểm tiêu chí vượt quá total_max_score của mẫu ───────────────────
//   addedScore: tổng max_score sẽ được thêm vào (hoặc giá trị mới khi sửa)
//   baseScore : nếu truyền, dùng làm tổng nền thay cho việc truy vấn DB
const assertWithinTotalScore = async (template, addedScore, { excludeItemIds = [], baseScore = null } = {}) => {
  const current = baseScore != null ? baseScore : await sumItemScores(template.id, { excludeItemIds });
  const limit   = Number(template.total_max_score);
  if (current + addedScore > limit + EPS)
    throw ApiError.badRequest(
      `Tổng điểm tiêu chí (${(current + addedScore).toFixed(2)}) vượt quá điểm tối đa của mẫu (${limit})`
    );
};

const sumScores = (items) => items.reduce((s, i) => s + (Number(i.max_score) || 0), 0);

module.exports = {
  getTemplateOrFail,
  countSessionsUsingTemplate,
  assertTemplateNotUsedInSession,
  countItems,
  sumItemScores,
  sumScores,
  normalizeItem,
  validateItemShape,
  validateItemsBatch,
  assertCodesNotExisting,
  assertWithinTotalScore,
};
