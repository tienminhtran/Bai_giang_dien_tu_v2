const templateService = require('../services/gradingtemplate.service');

const handleError = (res, err) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
};

// GET /api/grading-criteria-templates?activeOnly=true
const list = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const rows = await templateService.listTemplates({ activeOnly });
    return res.json({ success: true, data: rows });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/grading-criteria-templates/:id  (kèm danh sách tiêu chí con)
const getOne = async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.id);
    return res.json({ success: true, data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-criteria-templates  (có thể kèm items[])
const create = async (req, res) => {
  try {
    const template = await templateService.createTemplate(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo mẫu tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /api/grading-criteria-templates/:id
const update = async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật mẫu tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/grading-criteria-templates/:id
const remove = async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    return res.json({ success: true, message: 'Xóa mẫu tiêu chí thành công' });
  } catch (err) {
    return handleError(res, err);
  }
};

// ── Tiêu chí con (grading_criteria_items) ─────────────────────────────────────

// POST /api/grading-criteria-templates/:id/items  (1 object, mảng, hoặc { items: [] })
const addItems = async (req, res) => {
  try {
    const template = await templateService.addItems(req.params.id, req.body || {});
    return res.status(201).json({ success: true, message: 'Thêm tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-criteria-templates/:id/items/import  ({ items: [], mode?: 'append'|'replace' })
const importItems = async (req, res) => {
  try {
    const template = await templateService.importItems(req.params.id, req.body || {});
    return res.status(201).json({ success: true, message: 'Import tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /api/grading-criteria-templates/:id/items/:itemId
const updateItem = async (req, res) => {
  try {
    const template = await templateService.updateItem(req.params.id, req.params.itemId, req.body || {});
    return res.json({ success: true, message: 'Cập nhật tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/grading-criteria-templates/:id/items/:itemId
const removeItem = async (req, res) => {
  try {
    const template = await templateService.deleteItem(req.params.id, req.params.itemId);
    return res.json({ success: true, message: 'Xóa tiêu chí thành công', data: template });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = { list, getOne, create, update, remove, addItems, importItems, updateItem, removeItem };
