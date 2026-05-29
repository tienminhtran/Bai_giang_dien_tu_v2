const studentService = require('../services/student.service');

const list = async (req, res) => {
  try {
    const { student_code, full_name, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await studentService.listStudents({ student_code, full_name, page: pageNum, pageSize: size });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

/**
 * Tạo một sinh viên
 * Kiểm tra payload hợp lệ, tạo user và student trong transaction
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const create = async (req, res) => {
  try {
    const payload = req.body || {};
    const { user, student } = await studentService.createStudent(payload);

    return res.status(201).json({ success: true, data: { user: { id: user.id, username: user.username }, student } });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

/**
 * Import nhiều sinh viên từ file Excel
 * - Payload: [{ student_code, full_name, email, dob, class_name, major, phone, avatar_url }, ...]
 * - Trả về số lượng thành công, lỗi và chi tiết lỗi
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const importStudents = async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Cấu trúc Body phải là một mảng sinh viên' });
    }

    const { successCount, errorCount, errors } = await studentService.importStudents(records);

    return res.status(207).json({
      success: true,
      // message: `Đã xử lý ${records.length} sinh viên: ${successCount} thành công, ${errorCount} lỗi`,
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
    const updated = await studentService.lockStudentAccount(id, action);
    const message = String(action).toLowerCase() === 'unlock'
      ? 'Mở khóa tài khoản sinh viên thành công'
      : 'Khóa tài khoản sinh viên thành công';
    return res.json({ success: true, message, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const lockAccountsBulk = async (req, res) => {
  try {
    const { studentIds, action = 'lock' } = req.body || {};
    const result = await studentService.lockStudentAccountsBulk(studentIds, action);
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
    await studentService.resetStudentPassword(id, newPassword || '12345678');
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
    const updated = await studentService.updateStudent(id, payload);
    return res.json({ 
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công',
      data: updated 
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, create, importStudents, lockAccount, lockAccountsBulk, resetPassword, update };
