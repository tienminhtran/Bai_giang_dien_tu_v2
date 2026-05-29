const lectureService = require('../services/lecture.service');

const list = async (req, res) => {
  try {
    const { lecturer_code, full_name, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await lectureService.listLecturers({ lecturer_code, full_name, page: pageNum, pageSize: size });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const create = async (req, res) => {
  try {
    const payload = req.body || {};
    const { user, lecturer } = await lectureService.createLecturer(payload);

    return res.status(201).json({ 
        success: true, 
        message: 'Tạo giảng viên thành công - mật khẩu mặc định là MSGV',
        data: { user: { id: user.id, username: user.username }, lecturer } });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const importLecturers = async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Cấu trúc Body phải là một mảng giảng viên' });
    }

    const { successCount, errorCount, errors } = await lectureService.importLecturers(records);

    return res.status(207).json({
      success: true,
      data: { total: records.length, successCount, errorCount, errors },
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const lockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body?.action || 'lock';
    const updated = await lectureService.lockLecturerAccount(id, action);
    const message = String(action).toLowerCase() === 'unlock'
      ? 'Mở khóa tài khoản giảng viên thành công'
      : 'Khóa tài khoản giảng viên thành công';
    return res.json({ success: true, message, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const lockAccountsBulk = async (req, res) => {
  try {
    const { lecturerIds, action = 'lock' } = req.body || {};
    const result = await lectureService.lockLecturerAccountsBulk(lecturerIds, action);
    const actionLabel = String(action).toLowerCase() === 'unlock' ? 'mở khóa' : 'khóa';
    return res.status(result.errorCount > 0 ? 207 : 200).json({
      success: true,
      message: `Đã ${actionLabel} ${result.successCount}/${result.total} tài khoản`,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    await lectureService.resetLecturerPassword(id, newPassword || '12345678');
    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await lectureService.updateLecturer(id, payload);
    return res.json({ success: true, message: 'Cập nhật thông tin giảng viên thành công', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const updateDegree = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_degree } = req.body || {};
    const updated = await lectureService.updateLecturerDegree(id, academic_degree ?? null);
    return res.json({ success: true, message: 'Cập nhật học vị thành công', data: updated });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const listDegrees = async (req, res) => {
  return res.json({ success: true });
};

module.exports = { list, create, importLecturers, lockAccount, lockAccountsBulk, resetPassword, update, updateDegree, listDegrees };