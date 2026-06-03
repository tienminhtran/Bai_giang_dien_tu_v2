const sectionService = require('../services/section.service');

const handleError = (res, err) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
};

// GET /api/sections?course_id=
const list = async (req, res) => {
  try {
    const sections = await sectionService.listByCourse(req.query.course_id);
    return res.json({ success: true, data: sections });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/sections   Body: { course_id, section_title, description?, section_order? }
const create = async (req, res) => {
  try {
    const section = await sectionService.createSection(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo phần thành công', data: section });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /api/sections/:id
const update = async (req, res) => {
  try {
    const section = await sectionService.updateSection(req.params.id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật phần thành công', data: section });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/sections/:id
const remove = async (req, res) => {
  try {
    await sectionService.deleteSection(req.params.id);
    return res.json({ success: true, message: 'Xóa phần thành công' });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = { list, create, update, remove };
