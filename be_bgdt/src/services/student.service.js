const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Role, UserRole, Student } = require('../models');
const { toDateOnly, dateLiteral } = require('../utils/dateHelper');
const ApiError = require('../utils/ApiError');


/**
 * Lấy danh sách sinh viên với tùy chọn tìm kiếm theo student_code và full_name, có phân trang
 * @param {*} param0 
 * @returns 
 */
const listStudents = async ({ student_code, full_name, page = 1, pageSize = 20 }) => {
  const where = {};
  if (student_code) where.student_code = { [Op.like]: `%${student_code}%` };
  if (full_name)    where.full_name    = { [Op.like]: `%${full_name}%` };

  const limit  = Number(pageSize) || 20;
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    Student.count({ where }),
    Student.findAll({ where, limit, offset, order: [['student_code', 'ASC']] }),
  ]);

  return { total, rows };
};


/**
* Tạo mới một sinh viên
 * - Tạo một user với username = student_code, password mặc định là ngày sinh (DDMMYYYY) hoặc student_code nếu không có ngày sinh
 * @param {*} param0 
 * @returns 
 */
const createStudent = async ({ student_code, full_name, email, dob, class_name, major, phone, avatar_url }) => {
  if (!student_code || !full_name)
    throw ApiError.badRequest('student_code và full_name là bắt buộc');

  const code = String(student_code).trim();

  const [existing, existingUser] = await Promise.all([
    Student.findOne({ where: { student_code: code } }),
    User.findOne({ where: { username: code } }),
  ]);

  if (existing)     throw ApiError.conflict('Mã số sinh viên đã tồn tại');
  if (existingUser) throw ApiError.conflict('Tên đăng nhập đã tồn tại');

  const dobFormatted = toDateOnly(dob); // 'YYYY-MM-DD'
  // Password default: DDMMYYYY (e.g. '22112003'), fallback to student_code
  const rawPassword = dobFormatted
    ? dobFormatted.split('-').reverse().join('')
    : code;
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  return sequelize.transaction(async (t) => {
    const user = await User.create(
      { username: code, password_hash: passwordHash, status: 'active' },
      { transaction: t },
    );

    const role = await Role.findOne({ where: { role_name: 'student' }, transaction: t });
    if (role) await UserRole.create({ user_id: user.id, role_id: role.id }, { transaction: t });

    const student = await Student.create({
      user_id:      user.id,
      student_code: code,
      full_name:    String(full_name).trim(),
      email:        email      ? String(email).trim()      : null,
      dob:          dobFormatted,
      class_name:   class_name ? String(class_name).trim() : null,
      major:        major      ? String(major).trim()      : null,
      phone:        phone      ? String(phone).trim()      : null,
      avatar_url:   avatar_url ? String(avatar_url).trim() : null,
      is_active:    true,
    }, { transaction: t });

    return { user, student };
  });
};

/**
 * Import nhiều sinh viên, trả về kết quả thành công và danh sách lỗi theo từng dòng
 * @param {Array} records - mảng payload sinh viên
 * @returns {{ successCount, errorCount, errors: [{row, student_code, message}] }}
 */
const importStudents = async (records) => {
  if (!Array.isArray(records) || records.length === 0)
    throw ApiError.badRequest('Danh sách sinh viên không hợp lệ hoặc rỗng');

  let successCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await createStudent(record);
      successCount++;
    } catch (err) {
      errors.push({
        row: i + 1,
        student_code: record.student_code || null,
        message: err.message || 'Lỗi không xác định',
      });
    }
  }

  return { successCount, errorCount: errors.length, errors };
};

/**
 * Khóa hoặc mở khóa tài khoản sinh viên
 * - action='lock'   => user.status='banned', student.is_active=false
 * - action='unlock' => user.status='active', student.is_active=true
 * @param {string} studentId - Student.id (UUID)
 * @param {'lock'|'unlock'} action
 */
const lockStudentAccount = async (studentId, action = 'lock') => {
  const student = await Student.findByPk(studentId);
  if (!student) throw ApiError.notFound('Không tìm thấy sinh viên');

  const normalizedAction = String(action || 'lock').toLowerCase();
  if (!['lock', 'unlock'].includes(normalizedAction))
    throw ApiError.badRequest("action không hợp lệ, chỉ nhận 'lock' hoặc 'unlock'");

  const userStatus = normalizedAction === 'lock' ? 'banned' : 'active';
  const isActive = normalizedAction !== 'lock';

  return sequelize.transaction(async (t) => {
    await User.update({ status: userStatus }, { where: { id: student.user_id }, transaction: t });
    await Student.update({ is_active: isActive }, { where: { id: studentId }, transaction: t });
    const updatedStudent = await Student.findByPk(studentId, { transaction: t });
    return updatedStudent;
  });
};

/**
 * Khóa/mở khóa nhiều tài khoản sinh viên bằng mảng id
 * Tận dụng lockStudentAccount cho từng phần tử
 * @param {string[]} studentIds
 * @param {'lock'|'unlock'} action
 */
const lockStudentAccountsBulk = async (studentIds = [], action = 'lock') => {
  if (!Array.isArray(studentIds) || studentIds.length === 0)
    throw ApiError.badRequest('studentIds phải là mảng và không được rỗng');

  const tasks = studentIds.map(async (studentId) => {
    try {
      const student = await lockStudentAccount(studentId, action);
      return { studentId, success: true, student };
    } catch (error) {
      return { studentId, success: false, message: error.message || 'Lỗi không xác định' };
    }
  });

  const results = await Promise.all(tasks);
  const successItems = results.filter((item) => item.success);
  const failedItems = results.filter((item) => !item.success);

  return {
    total: studentIds.length,
    successCount: successItems.length,
    errorCount: failedItems.length,
    errors: failedItems,
    data: successItems,
  };
};

/**
 * Reset mật khẩu sinh viên về giá trị mặc định (12345678)
 * @param {string} studentId
 * @param {string} newPassword
 */
const resetStudentPassword = async (studentId, newPassword = '12345678') => {
  const student = await Student.findByPk(studentId);
  if (!student) throw ApiError.notFound('Không tìm thấy sinh viên');

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await User.update({ password_hash: passwordHash }, { where: { id: student.user_id } });
  return { success: true };
};

/**
 * Cập nhật thông tin sinh viên (admin)
 * Nếu thay đổi student_code thì cập nhật cả username của user tương ứng
 * @param {string} studentId
 * @param {object} payload
 */
const updateStudent = async (studentId, payload) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw ApiError.notFound('Không tìm thấy sinh viên');

  return sequelize.transaction(async (t) => {
    const updates = {};
    if (payload.student_code !== undefined) {
      const nextCode = String(payload.student_code).trim();
      if (!nextCode) throw ApiError.badRequest('student_code không hợp lệ');

      if (nextCode !== student.student_code) {
        const existedStudent = await Student.findOne({ where: { student_code: nextCode }, transaction: t });
        const existedUser    = await User.findOne({ where: { username: nextCode }, transaction: t });

        if (existedStudent) throw ApiError.conflict('Mã số sinh viên đã tồn tại');
        if (existedUser)    throw ApiError.conflict('Tên đăng nhập đã tồn tại');

        updates.student_code = nextCode;
        await User.update({ username: nextCode }, { where: { id: student.user_id }, transaction: t });
      }
    }

    if (payload.full_name !== undefined) updates.full_name = String(payload.full_name).trim();
    if (payload.email !== undefined) updates.email = payload.email ? String(payload.email).trim() : null;
    if (payload.dob !== undefined) updates.dob = toDateOnly(payload.dob) || null;
    if (payload.class_name !== undefined) updates.class_name = payload.class_name ? String(payload.class_name).trim() : null;
    if (payload.major !== undefined) updates.major = payload.major ? String(payload.major).trim() : null;
    if (payload.phone !== undefined) updates.phone = payload.phone ? String(payload.phone).trim() : null;
    if (payload.avatar_url !== undefined) updates.avatar_url = payload.avatar_url ? String(payload.avatar_url).trim() : null;
    if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active);

    if (Object.keys(updates).length > 0) {
      await Student.update(updates, { where: { id: studentId }, transaction: t });
    }

    const updated = await Student.findByPk(studentId, { transaction: t });
    return updated;
  });
};

module.exports = { listStudents, createStudent, importStudents, lockStudentAccount, lockStudentAccountsBulk, resetStudentPassword, updateStudent };
