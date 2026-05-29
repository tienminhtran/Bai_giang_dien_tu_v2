const { Op } = require('sequelize');
const { Lecturer, Faculty } = require('../models');

/**
 * Lấy danh sách giảng viên thuộc cùng khoa với trưởng khoa đang đăng nhập.
 * @param {string} lecturerId - profile_id của trưởng khoa (từ JWT)
 */
const getMyFacultyLecturers = async (lecturerId, { lecturer_code, full_name, page = 1, pageSize = 20 } = {}) => {
  const me = await Lecturer.findByPk(lecturerId, { attributes: ['id', 'faculty_id'] });
  if (!me) {
    const err = new Error('Không tìm thấy hồ sơ giảng viên');
    err.statusCode = 404;
    throw err;
  }

  if (!me.faculty_id) {
    const err = new Error('Tài khoản chưa được gán vào khoa nào');
    err.statusCode = 422;
    throw err;
  }

  const where = { faculty_id: me.faculty_id };
  if (lecturer_code) where.lecturer_code = { [Op.like]: `%${lecturer_code}%` };
  if (full_name)     where.full_name     = { [Op.like]: `%${full_name}%` };

  const limit  = Number(pageSize) || 20;
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    Lecturer.count({ where }),
    Lecturer.findAll({
      where,
      limit,
      offset,
      order: [['lecturer_code', 'ASC']],
      include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
    }),
  ]);

  return { faculty_id: me.faculty_id, total, rows };
};

module.exports = { getMyFacultyLecturers };
