const { Op } = require('sequelize');
const { sequelize, CourseLecturer, Course, Lecturer, CourseRole, User, Faculty, Major } = require('../models');
const ApiError = require('../utils/ApiError');
const { assertManagerLimit } = require('../helpers/courseHelpers');

const ALLOWED_ROLES = ['manager', 'member'];

//  Helper: tìm course_role_id theo role_name 
const findRoleOrFail = async (role_name) => {
  if (!ALLOWED_ROLES.includes(role_name))
    throw ApiError.badRequest(`Quyền không hợp lệ. Chỉ chấp nhận: ${ALLOWED_ROLES.join(', ')}`);
  const role = await CourseRole.findOne({ where: { role_name } });
  if (!role) throw ApiError.notFound(`Không tìm thấy quyền "${role_name}" trong hệ thống`);
  return role;
};

//  1. Danh sách phân công 
const listCourseLecturers = async ({
  lecturer_code, lecturer_name,
  role_name,
  course_code, course_name,
  assigned_by_code, assigned_by_name,
  is_active,
  page = 1, pageSize = 20,
}) => {
  const lecturerWhere = {};
  if (lecturer_code) lecturerWhere.lecturer_code = { [Op.like]: `%${lecturer_code}%` };
  if (lecturer_name) lecturerWhere.full_name      = { [Op.like]: `%${lecturer_name}%` };

  const courseWhere = {};
  if (course_code) courseWhere.course_code = { [Op.like]: `%${course_code}%` };
  if (course_name) courseWhere.course_name = { [Op.like]: `%${course_name}%` };

  const roleWhere = {};
  if (role_name) roleWhere.role_name = role_name;

  const assignerWhere = {};
  if (assigned_by_code) assignerWhere.lecturer_code = { [Op.like]: `%${assigned_by_code}%` };
  if (assigned_by_name) assignerWhere.full_name      = { [Op.like]: `%${assigned_by_name}%` };

  const topWhere = {};
  if (is_active !== undefined && is_active !== '') topWhere.is_active = is_active === 'true' || is_active === true;

  const hasLecturerFilter  = Object.keys(lecturerWhere).length  > 0;
  const hasCourseFilter    = Object.keys(courseWhere).length    > 0;
  const hasRoleFilter      = Object.keys(roleWhere).length      > 0;
  const hasAssignerFilter  = Object.keys(assignerWhere).length  > 0;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const includeConfig = [
    {
      model: Lecturer,
      attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id', 'major_id', 'academic_degree'],
      where: hasLecturerFilter ? lecturerWhere : undefined,
      required: hasLecturerFilter,
      include: [
        { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'], required: false },
        { model: Major,   as: 'major',   attributes: ['id', 'major_name'],   required: false },
      ],
    },
    {
      model: Course,
      attributes: ['id', 'course_code', 'course_name', 'is_active'],
      where: hasCourseFilter ? courseWhere : undefined,
      required: hasCourseFilter,
    },
    {
      model: CourseRole,
      attributes: ['id', 'role_name', 'description'],
      where: hasRoleFilter ? roleWhere : undefined,
      required: hasRoleFilter,
    },
    {
      model: User,
      as: 'assignedByUser',
      attributes: ['id', 'username'],
      required: hasAssignerFilter,
      include: [{
        model: Lecturer,
        attributes: ['lecturer_code', 'full_name'],
        where: hasAssignerFilter ? assignerWhere : undefined,
        required: hasAssignerFilter,
      }],
    },
  ];

  const { count, rows } = await CourseLecturer.findAndCountAll({
    where: topWhere,
    include: includeConfig,
    limit,
    offset,
    order: [['assigned_at', 'DESC']],
    distinct: true,
  });

  return { total: count, rows };
};

//  2. Phân công giảng viên 
const assignLecturer = async ({ course_code, lecturer_code, role_name, assigned_by_user_id }) => {
  if (!course_code)   throw ApiError.badRequest('course_code là bắt buộc');
  if (!lecturer_code) throw ApiError.badRequest('lecturer_code là bắt buộc');
  if (!role_name)     throw ApiError.badRequest('role_name là bắt buộc');

  const normalizedCourseCode    = String(course_code).trim().toUpperCase();
  const normalizedLecturerCode  = String(lecturer_code).trim();

  const [course, lecturer, role] = await Promise.all([
    Course.findOne({ where: { course_code: normalizedCourseCode } }),
    Lecturer.findOne({ where: { lecturer_code: normalizedLecturerCode } }),
    findRoleOrFail(role_name),
  ]);

  if (!course)           throw ApiError.notFound(`Không tìm thấy môn học "${normalizedCourseCode}"`);
  if (!course.is_active) throw ApiError.badRequest(`Môn học "${normalizedCourseCode}" đã đóng, không thể phân công`);
  if (!lecturer)         throw ApiError.notFound(`Không tìm thấy giảng viên "${normalizedLecturerCode}"`);

  const existing = await CourseLecturer.findOne({
    where: { course_id: course.id, lecturer_id: lecturer.id },
  });
  if (existing) throw ApiError.conflict('Giảng viên này đã được phân công vào môn học');

  if (role_name === 'manager') await assertManagerLimit(course.id);

  return CourseLecturer.create({
    course_id:      course.id,
    lecturer_id:    lecturer.id,
    course_role_id: role.id,
    assigned_by:    assigned_by_user_id,
    assigned_at:    sequelize.literal('GETDATE()'),
    is_active:      true,
  });
};

//  3. Chỉ cập nhật quyền (manager ↔ member) 
const updateRole = async (id, role_name) => {
  const record = await CourseLecturer.findByPk(id);
  if (!record) throw ApiError.notFound('Không tìm thấy bản ghi phân công');

  // Kiểm tra giới hạn manager trước khi đổi lên 'manager'
  // excludeId = record.id để không đếm bản thân nếu đang là manager
  if (role_name === 'manager') await assertManagerLimit(record.course_id, record.id);

  const role = await findRoleOrFail(role_name);
  await record.update({ course_role_id: role.id });
  return record;
};

//  4. Chỉ cập nhật trạng thái is_active 
const updateStatus = async (id, is_active) => {
  const record = await CourseLecturer.findByPk(id);
  if (!record) throw ApiError.notFound('Không tìm thấy bản ghi phân công');
  await record.update({ is_active: Boolean(is_active) });
  return record;
};

//  5. Import hàng loạt phân công 
// Body: [{ course_code, lecturer_code, role_name }, ...]
// Cache course/lecturer/role để tránh query DB lặp khi nhiều dòng giống nhau
const bulkAssignLecturers = async (rows, assigned_by_user_id) => {
  if (!Array.isArray(rows) || rows.length === 0)
    throw ApiError.badRequest('Body phải là mảng không rỗng');

  const courseCache   = new Map(); // course_code   → Course | null
  const lecturerCache = new Map(); // lecturer_code → Lecturer | null
  const roleCache     = new Map(); // role_name     → CourseRole | null

  let successCount = 0;
  let errorCount   = 0;
  const errors     = [];

  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const rowNum = i + 2; // tương ứng dòng Excel (header = 1)

    try {
      const { course_code, lecturer_code, role_name } = row;

      if (!course_code)   throw new Error('Thiếu mã môn học');
      if (!lecturer_code) throw new Error('Thiếu mã giảng viên');
      if (!ALLOWED_ROLES.includes(role_name))
        throw new Error(`Quyền không hợp lệ: "${role_name}". Hợp lệ: ${ALLOWED_ROLES.join(', ')}`);

      const normalizedCourse   = String(course_code).trim().toUpperCase();
      const normalizedLecturer = String(lecturer_code).trim();

      //  Lookup course (cached) 
      if (!courseCache.has(normalizedCourse))
        courseCache.set(normalizedCourse, await Course.findOne({ where: { course_code: normalizedCourse } }));
      const course = courseCache.get(normalizedCourse);
      if (!course)           throw new Error(`Không tìm thấy môn học "${normalizedCourse}"`);
      if (!course.is_active) throw new Error(`Môn học "${normalizedCourse}" đã đóng`);

      //  Lookup lecturer (cached) 
      if (!lecturerCache.has(normalizedLecturer))
        lecturerCache.set(normalizedLecturer, await Lecturer.findOne({ where: { lecturer_code: normalizedLecturer } }));
      const lecturer = lecturerCache.get(normalizedLecturer);
      if (!lecturer) throw new Error(`Không tìm thấy giảng viên "${normalizedLecturer}"`);

      //  Lookup role (cached) 
      if (!roleCache.has(role_name))
        roleCache.set(role_name, await CourseRole.findOne({ where: { role_name } }));
      const role = roleCache.get(role_name);
      if (!role) throw new Error(`Không tìm thấy quyền "${role_name}" trong hệ thống`);

      //  Kiểm tra giới hạn manager 
      if (role_name === 'manager') await assertManagerLimit(course.id);

      //  Kiểm tra trùng & tạo 
      await sequelize.transaction(async (t) => {
        const existing = await CourseLecturer.findOne({
          where: { course_id: course.id, lecturer_id: lecturer.id },
          transaction: t,
        });
        if (existing) throw new Error('Giảng viên đã được phân công vào môn học này');

        await CourseLecturer.create({
          course_id:      course.id,
          lecturer_id:    lecturer.id,
          course_role_id: role.id,
          assigned_by:    assigned_by_user_id,
          assigned_at:    sequelize.literal('GETDATE()'),
          is_active:      true,
        }, { transaction: t });
      });

      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({
        row:           rowNum,
        course_code:   row.course_code   ?? null,
        lecturer_code: row.lecturer_code ?? null,
        reason:        err.message,
      });
    }
  }

  return { total: rows.length, successCount, errorCount, errors };
};

module.exports = { listCourseLecturers, assignLecturer, updateRole, updateStatus, bulkAssignLecturers };
