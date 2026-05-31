
const { Op } = require('sequelize');
const { CourseLecturer, CourseRole, Course } = require('../models');
const ApiError = require('../utils/ApiError');

// Kiểm tra môn học chỉ thuộc 1 khoa chủ quản
// Nếu course đã có faculty_id khác với newFacultyId → từ chối
const checkSingleFaculty = (existingCourse, newFacultyId) => {
  if (
    existingCourse.faculty_id &&
    newFacultyId &&
    String(existingCourse.faculty_id) !== String(newFacultyId)
  ) {
    const err = new Error('Môn học đã thuộc khoa khác, không thể gán vào nhiều khoa chủ quản');
    err.statusCode = 409;
    throw err;
  }
};

/**
 * Kiểm tra số manager hiện tại của môn học chưa đạt giới hạn course.count_manager.
 * excludeId: id bản ghi CourseLecturer đang được cập nhật (tránh tự đếm chính nó).
 * Ném 409 nếu đã đạt hoặc vượt giới hạn.
 */
const assertManagerLimit = async (courseId, excludeId = null) => {
  const [course, managerRole] = await Promise.all([
    Course.findByPk(courseId, { attributes: ['id', 'count_manager'] }),
    CourseRole.findOne({ where: { role_name: 'manager' }, attributes: ['id'] }),
  ]);

  if (!course) throw ApiError.notFound('Không tìm thấy môn học');
  if (!managerRole) return; // chưa có role 'manager' trong hệ thống, bỏ qua

  const where = { course_id: courseId, course_role_id: managerRole.id };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const currentCount = await CourseLecturer.count({ where });

  if (currentCount >= course.count_manager) {
    throw ApiError.conflict(
      `Môn học chỉ cho phép tối đa ${course.count_manager} manager (hiện có ${currentCount})`
    );
  }
};

module.exports = { checkSingleFaculty, assertManagerLimit };
