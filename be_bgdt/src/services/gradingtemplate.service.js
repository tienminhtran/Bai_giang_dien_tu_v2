const { sequelize, GradingCriteriaTemplate, GradingCriteriaItem, User, Lecturer } = require('../models');
const ApiError = require('../utils/ApiError');
const H = require('../helpers/gradingCriteria.helper');

const ITEM_ATTRS = [
  'id', 'template_id', 'code', 'criteria_name', 'description',
  'max_score', 'weight', 'display_order', 'is_required',
];

const ITEM_INCLUDE = {
  model: GradingCriteriaItem,
  as: 'items',
  attributes: ITEM_ATTRS,
};

// Người tạo: lấy username + tên/mã giảng viên (nếu có hồ sơ giảng viên)
const CREATOR_INCLUDE = {
  model: User,
  as: 'creator',
  attributes: ['id', 'username'],
  required: false,
  include: [{ model: Lecturer, attributes: ['lecturer_code', 'full_name'], required: false }],
};

// ════════════════════════════════ TEMPLATES ════════════════════════════════

const normalizeTemplate = (payload = {}) => ({
  template_name:   payload.template_name   == null ? '' : String(payload.template_name).trim(),
  description:     payload.description      == null || payload.description      === '' ? null : String(payload.description).trim(),
  total_max_score: payload.total_max_score == null || payload.total_max_score === '' ? 100 : Number(payload.total_max_score),
  pass_score:      payload.pass_score       == null || payload.pass_score       === '' ? 70  : Number(payload.pass_score),
  is_active:       payload.is_active        == null ? true : Boolean(payload.is_active),
});

const assertValidTemplate = (data) => {
  if (!data.template_name) throw ApiError.badRequest('template_name là bắt buộc');
  if (!Number.isFinite(data.total_max_score) || data.total_max_score <= 0)
    throw ApiError.badRequest('total_max_score phải là số > 0');
  if (!Number.isFinite(data.pass_score) || data.pass_score < 0)
    throw ApiError.badRequest('pass_score phải là số >= 0');
  if (data.pass_score > data.total_max_score)
    throw ApiError.badRequest('pass_score không được lớn hơn total_max_score');
};

// Danh sách mẫu tiêu chí (dùng cho dropdown + trang quản lý admin)
const listTemplates = async ({ activeOnly = false } = {}) => {
  const where = {};
  if (activeOnly === true || activeOnly === 'true') where.is_active = true;

  return GradingCriteriaTemplate.findAll({
    where,
    attributes: ['id', 'template_name', 'description', 'total_max_score', 'pass_score', 'is_active', 'created_by', 'created_at'],
    include: [CREATOR_INCLUDE],
    order: [['is_active', 'DESC'], ['template_name', 'ASC']],
  });
};

// Chi tiết 1 mẫu kèm danh sách tiêu chí con (grading_criteria_items)
const getTemplate = async (id) => {
  const template = await GradingCriteriaTemplate.findByPk(id, {
    include: [ITEM_INCLUDE, CREATOR_INCLUDE],
    order: [[{ model: GradingCriteriaItem, as: 'items' }, 'display_order', 'ASC']],
  });
  if (!template) throw ApiError.notFound('Không tìm thấy mẫu tiêu chí');
  return template;
};

// Tạo mẫu (cho phép kèm luôn danh sách tiêu chí con trong cùng request)
const createTemplate = async (payload = {}, createdByUserId) => {
  const data = normalizeTemplate(payload);
  assertValidTemplate(data);

  // items (tùy chọn) — nếu có thì validate & tạo cùng lúc
  const rawItems = Array.isArray(payload.items) ? payload.items : null;
  let items = null;
  if (rawItems) {
    items = rawItems.map(H.normalizeItem);
    H.validateItemsBatch(items);
    const addedScore = H.sumScores(items);
    if (addedScore > Number(data.total_max_score) + 1e-6)
      throw ApiError.badRequest(`Tổng điểm tiêu chí (${addedScore}) vượt quá điểm tối đa của mẫu (${data.total_max_score})`);
  }

  const created = await sequelize.transaction(async (t) => {
    const tpl = await GradingCriteriaTemplate.create({ ...data, created_by: createdByUserId }, { transaction: t });
    if (items) {
      await GradingCriteriaItem.bulkCreate(
        items.map((i) => ({ ...i, template_id: tpl.id })),
        { transaction: t },
      );
    }
    return tpl;
  });

  return getTemplate(created.id);
};

// Cập nhật mẫu (chỉ các trường của mẫu, không đụng items)
const updateTemplate = async (id, payload = {}) => {
  const template = await H.getTemplateOrFail(id);

  const data = normalizeTemplate({ ...template.toJSON(), ...payload });
  assertValidTemplate(data);

  // Không cho hạ total_max_score xuống dưới tổng điểm tiêu chí hiện có
  const currentSum = await H.sumItemScores(id);
  if (currentSum > Number(data.total_max_score) + 1e-6)
    throw ApiError.badRequest(
      `total_max_score (${data.total_max_score}) nhỏ hơn tổng điểm tiêu chí hiện có (${currentSum})`,
    );

  await template.update({ ...data, updated_at: sequelize.literal('SYSUTCDATETIME()') });
  return getTemplate(id);
};

// Xóa mẫu — chỉ khi CHƯA có tiêu chí con VÀ CHƯA gắn đợt kiểm định
const deleteTemplate = async (id) => {
  const template = await H.getTemplateOrFail(id);

  const itemCount = await H.countItems(id);
  if (itemCount > 0)
    throw ApiError.conflict(`Không thể xóa: mẫu đang có ${itemCount} tiêu chí. Hãy xóa tiêu chí trước.`);

  await H.assertTemplateNotUsedInSession(id, 'xóa mẫu');

  await template.destroy();
};

// ════════════════════════════════ ITEMS ════════════════════════════════════

// Nhận về mảng item dù body là 1 object, mảng, hay { items: [...] }
const extractItems = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.items)) return body.items;
  if (body && typeof body === 'object' && Object.keys(body).length) return [body];
  return [];
};

// Thêm 1 hoặc nhiều tiêu chí (append)
const addItems = async (templateId, body) => {
  const template = await H.getTemplateOrFail(templateId);

  const items = extractItems(body).map(H.normalizeItem);
  H.validateItemsBatch(items);

  const codes = items.map((i) => i.code);
  await H.assertCodesNotExisting(templateId, codes);
  await H.assertWithinTotalScore(template, H.sumScores(items));

  await GradingCriteriaItem.bulkCreate(items.map((i) => ({ ...i, template_id: templateId })));
  return getTemplate(templateId);
};

// Import nhiều tiêu chí (Excel) — mode 'append' (mặc định) hoặc 'replace'
const importItems = async (templateId, body = {}) => {
  const template = await H.getTemplateOrFail(templateId);
  const mode  = String(body.mode || 'append').toLowerCase();
  const items = extractItems(body.items != null ? body.items : body).map(H.normalizeItem);

  H.validateItemsBatch(items);

  if (mode === 'replace') {
    // Ghi đè toàn bộ — chỉ cho phép khi mẫu chưa gắn đợt kiểm định
    await H.assertTemplateNotUsedInSession(templateId, 'ghi đè tiêu chí');
    const addedScore = H.sumScores(items);
    if (addedScore > Number(template.total_max_score) + 1e-6)
      throw ApiError.badRequest(`Tổng điểm tiêu chí (${addedScore}) vượt quá điểm tối đa của mẫu (${template.total_max_score})`);

    await sequelize.transaction(async (t) => {
      await GradingCriteriaItem.destroy({ where: { template_id: templateId }, transaction: t });
      await GradingCriteriaItem.bulkCreate(items.map((i) => ({ ...i, template_id: templateId })), { transaction: t });
    });
    return getTemplate(templateId);
  }

  // append
  await H.assertCodesNotExisting(templateId, items.map((i) => i.code));
  await H.assertWithinTotalScore(template, H.sumScores(items));
  await GradingCriteriaItem.bulkCreate(items.map((i) => ({ ...i, template_id: templateId })));
  return getTemplate(templateId);
};

// Sửa 1 tiêu chí
const updateItem = async (templateId, itemId, payload = {}) => {
  const template = await H.getTemplateOrFail(templateId);

  const item = await GradingCriteriaItem.findOne({ where: { id: itemId, template_id: templateId } });
  if (!item) throw ApiError.notFound('Không tìm thấy tiêu chí trong mẫu');

  const data = H.normalizeItem({ ...item.toJSON(), ...payload });
  H.validateItemShape(data);

  await H.assertCodesNotExisting(templateId, [data.code], { excludeItemIds: [itemId] });
  await H.assertWithinTotalScore(template, data.max_score, { excludeItemIds: [itemId] });

  await item.update(data);
  return getTemplate(templateId);
};

// Xóa 1 tiêu chí — chỉ khi mẫu CHƯA gắn đợt kiểm định
const deleteItem = async (templateId, itemId) => {
  await H.getTemplateOrFail(templateId);

  const item = await GradingCriteriaItem.findOne({ where: { id: itemId, template_id: templateId } });
  if (!item) throw ApiError.notFound('Không tìm thấy tiêu chí trong mẫu');

  await H.assertTemplateNotUsedInSession(templateId, 'xóa tiêu chí');

  await item.destroy();
  return getTemplate(templateId);
};

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addItems,
  importItems,
  updateItem,
  deleteItem,
};
