const bcrypt = require('bcryptjs');
const { User, Role, Student, Lecturer } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const ALLOWED_CLIENT_IDS = ['student_portal', 'staff_portal'];
const STUDENT_ROLE  = 'student';
const STAFF_ROLES   = ['admin', 'lecturer', 'council', 'department_head', 'major_head'];

const login = async ({ username, password, client_id }) => {
  // 1. Kiểm tra client_id hợp lệ
  if (!ALLOWED_CLIENT_IDS.includes(client_id)) {
    const err = new Error('client_id không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  // 2. Tìm user kèm roles
  const user = await User.findOne({
    where: { username },
    include: [{ model: Role, through: { attributes: [] }, attributes: ['role_name'] }],
  });

  if (!user) {
    const err = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    err.statusCode = 401;
    throw err;
  }

  // 3. Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    err.statusCode = 401;
    throw err;
  }

  // 4. Kiểm tra trạng thái tài khoản
  if (user.status !== 'active') {
    const err = new Error('Tài khoản đã bị khoá hoặc chưa kích hoạt');
    err.statusCode = 403;
    throw err;
  }

  // 5. Lấy danh sách role
  const roles = user.Roles.map((r) => r.role_name);

  // 6. Kiểm tra quyền theo client_id
  if (client_id === 'student_portal') {
    if (!roles.includes(STUDENT_ROLE)) {
      const err = new Error('Tài khoản không có quyền truy cập cổng sinh viên');
      err.statusCode = 403;
      throw err;
    }
  } else {
    // staff_portal
    const hasStaffRole = roles.some((r) => STAFF_ROLES.includes(r));
    if (!hasStaffRole) {
      const err = new Error('Tài khoản không có quyền truy cập cổng nhân sự');
      err.statusCode = 403;
      throw err;
    }
  }

  // 7. Lấy hồ sơ (student hoặc lecturer)
  let profile = null;
  if (roles.includes(STUDENT_ROLE)) {
    profile = await Student.findOne({
      where: { user_id: user.id },
      attributes: ['id', 'student_code', 'full_name', 'email', 'class_name', 'major', 'avatar_url'],
    });
  } else {
    profile = await Lecturer.findOne({
      where: { user_id: user.id },
      attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id', 'avatar_url'],
    });
  }

  // 8. Tạo token
  const payload = {
    id:         user.id,
    username:   user.username,
    roles,
    profile_id: profile?.id ?? null,
  };

  return {
    access_token:  generateAccessToken(payload),
    refresh_token: generateRefreshToken(payload),
    user: {
      // id:       user.id,
      // username: user.username,
      roles,
      // profile:  profile?.toJSON() ?? null,
    },
  };
};

// lấy thông tin user từ userId (dùng cho GET /api/auth/me)
const getMe = async (userId) => {
  const user = await User.findOne({
    where: { id: userId },
    include: [{ model: Role, through: { attributes: [] }, attributes: ['role_name'] }],
    attributes: ['id', 'username', 'status'],
  });

  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }

  const roles = user.Roles.map((r) => r.role_name);

  // Lấy hồ sơ dựa theo role
  let profile = null;
  if (roles.includes(STUDENT_ROLE)) {
    profile = await Student.findOne({
      where: { user_id: userId },
      attributes: ['id', 'student_code', 'full_name', 'email', 'dob', 'class_name', 'major', 'phone', 'avatar_url', 'is_active'],
    });
  } else {
    // lecturer, council, admin
    profile = await Lecturer.findOne({
      where: { user_id: userId },
      attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id', 'phone', 'avatar_url', 'is_active'],
    });
  }

  return {
    id:       user.id,
    username: user.username,
    status:   user.status,
    roles,
    profile:  profile?.toJSON() ?? null,
  };
};

module.exports = { login, getMe };
