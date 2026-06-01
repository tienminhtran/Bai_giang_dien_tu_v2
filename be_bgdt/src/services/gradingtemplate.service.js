const { GradingCriteriaTemplate } = require('../models');

// Danh sách mẫu tiêu chí (dùng cho dropdown khi tạo đợt kiểm định)
const listTemplates = async ({ activeOnly = false } = {}) => {
  const where = {};
  if (activeOnly === true || activeOnly === 'true') where.is_active = true;

  return GradingCriteriaTemplate.findAll({
    where,
    attributes: ['id', 'template_name', 'total_max_score', 'pass_score', 'is_active'],
    order: [['is_active', 'DESC'], ['template_name', 'ASC']],
  });
};

module.exports = { listTemplates };
