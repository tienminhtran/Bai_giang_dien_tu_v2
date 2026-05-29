const clService = require('../services/courselecturer.service');

const list = async (req, res) => {
  try {
    const {
      lecturer_code, lecturer_name,
      role_name,
      course_code, course_name,
      assigned_by_code, assigned_by_name,
      is_active,
      page = 1, pageSize = 20,
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await clService.listCourseLecturers({
      lecturer_code, lecturer_name,
      role_name,
      course_code, course_name,
      assigned_by_code, assigned_by_name,
      is_active,
      page: pageNum, pageSize: size,
    });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const assign = async (req, res) => {
  try {
    const { course_code, lecturer_code, role_name } = req.body || {};
    const assigned_by_user_id = req.user?.id;

    const record = await clService.assignLecturer({ course_code, lecturer_code, role_name, assigned_by_user_id });
    return res.status(201).json({ success: true, message: 'Phân công giảng viên thành công', data: record });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body || {};
    const record = await clService.updateRole(id, role_name);
    return res.json({ success: true, message: 'Cập nhật quyền thành công', data: record });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body || {};
    if (is_active === undefined)
      return res.status(400).json({ success: false, message: 'is_active là bắt buộc' });
    const record = await clService.updateStatus(id, is_active);
    return res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: record });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const bulkAssign = async (req, res) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows))
      return res.status(400).json({ success: false, message: 'Body phải là mảng JSON' });

    const assigned_by_user_id = req.user?.id;
    const result = await clService.bulkAssignLecturers(rows, assigned_by_user_id);

    const status = result.errorCount > 0 ? 207 : 201;
    return res.status(status).json({
      success: true,
      message: `Đã xử lý ${result.total} bản ghi: ${result.successCount} thành công, ${result.errorCount} thất bại`,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, assign, updateRole, updateStatus, bulkAssign };
