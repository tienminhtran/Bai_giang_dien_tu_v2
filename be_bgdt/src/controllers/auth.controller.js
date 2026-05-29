const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Dữ liệu không hợp lệ', 400, errors.array());
    }

    const { username, password, client_id } = req.body;
    const data = await authService.login({ username, password, client_id });

    return success(res, data, 'Đăng nhập thành công');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — trả thông tin user từ token (dùng cho cả 4 role)
const getMe = async (req, res, next) => {
  try {
    // req.user được gán bởi middleware authenticate (chứa id decode từ JWT)
    const data = await authService.getMe(req.user.id);
    return success(res, data, 'Lấy thông tin thành công');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe };
