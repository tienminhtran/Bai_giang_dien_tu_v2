const { Op } = require('sequelize');
const { sequelize, Enrollment, EnrollmentRequest, Student, Course, AcademicTerm, Lecturer } = require('../models');
const ApiError = require('../utils/ApiError');

const ENROLLMENT_TYPES = ['new', 'retake', 'improve'];

// Chuẩn hoá "2023 - 2024" → "2023-2024"
const normalizeAcademicYear = (raw) => String(raw).replace(/\s*-\s*/g, '-').trim();

const listEnrollments = async ({ student_code, full_name, course_code, course_name, academic_year, semester, page = 1, pageSize = 20 }) => {
  const studentWhere = {};
  if (student_code) studentWhere.student_code = { [Op.like]: `%${student_code}%` };
  if (full_name)    studentWhere.full_name    = { [Op.like]: `%${full_name}%` };

  const courseWhere = {};
  if (course_code) courseWhere.course_code = { [Op.like]: `%${course_code}%` };
  if (course_name) courseWhere.course_name = { [Op.like]: `%${course_name}%` };

  const termWhere = {};
  if (academic_year) termWhere.academic_year = { [Op.like]: `%${academic_year}%` };
  if (semester)      termWhere.semester      = Number(semester);

  const hasStudentFilter = Object.keys(studentWhere).length > 0;
  const hasCourseFilter  = Object.keys(courseWhere).length  > 0;
  const hasTermFilter    = Object.keys(termWhere).length    > 0;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const { count, rows } = await Enrollment.findAndCountAll({
    include: [
      {
        model: Student,
        attributes: ['id', 'student_code', 'full_name', 'email', 'class_name', 'major'],
        where: hasStudentFilter ? studentWhere : undefined,
        required: hasStudentFilter,
      },
      {
        model: Course,
        attributes: ['id', 'course_code', 'course_name', 'credits'],
        where: hasCourseFilter ? courseWhere : undefined,
        required: hasCourseFilter,
      },
      {
        model: AcademicTerm,
        attributes: ['id', 'academic_year', 'semester', 'start_date', 'end_date'],
        where: hasTermFilter ? termWhere : undefined,
        required: hasTermFilter,
      },
    ],
    limit,
    offset,
    order: [['enrolled_at', 'DESC']],
    distinct: true,
  });

  return { total: count, rows };
};

const listEnrollmentRequests = async ({
  student_code, full_name,
  course_code, course_name,
  academic_year, semester,
  lecturer_code, lecturer_name,
  page = 1, pageSize = 20,
}) => {
  const studentWhere = {};
  if (student_code) studentWhere.student_code = { [Op.like]: `%${student_code}%` };
  if (full_name)    studentWhere.full_name    = { [Op.like]: `%${full_name}%` };

  const courseWhere = {};
  if (course_code) courseWhere.course_code = { [Op.like]: `%${course_code}%` };
  if (course_name) courseWhere.course_name = { [Op.like]: `%${course_name}%` };

  const termWhere = {};
  if (academic_year) termWhere.academic_year = { [Op.like]: `%${academic_year}%` };
  if (semester)      termWhere.semester      = Number(semester);

  const lecturerWhere = {};
  if (lecturer_code) lecturerWhere.lecturer_code = { [Op.like]: `%${lecturer_code}%` };
  if (lecturer_name) lecturerWhere.full_name      = { [Op.like]: `%${lecturer_name}%` };

  const hasStudentFilter  = Object.keys(studentWhere).length  > 0;
  const hasCourseFilter   = Object.keys(courseWhere).length   > 0;
  const hasTermFilter     = Object.keys(termWhere).length     > 0;
  const hasLecturerFilter = Object.keys(lecturerWhere).length > 0;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const { count, rows } = await EnrollmentRequest.findAndCountAll({
    include: [
      {
        model: Student,
        attributes: ['id', 'student_code', 'full_name', 'email', 'class_name', 'major'],
        where: hasStudentFilter ? studentWhere : undefined,
        required: hasStudentFilter,
      },
      {
        model: Course,
        attributes: ['id', 'course_code', 'course_name', 'credits'],
        where: hasCourseFilter ? courseWhere : undefined,
        required: hasCourseFilter,
      },
      {
        model: AcademicTerm,
        attributes: ['id', 'academic_year', 'semester', 'start_date', 'end_date'],
        where: hasTermFilter ? termWhere : undefined,
        required: hasTermFilter,
      },
      {
        model: Lecturer,
        as: 'requestedByLecturer',
        attributes: ['id', 'lecturer_code', 'full_name', 'email', 'faculty_id'],
        where: hasLecturerFilter ? lecturerWhere : undefined,
        required: hasLecturerFilter,
      },
    ],
    limit,
    offset,
    order: [['requested_at', 'DESC']],
    distinct: true,
  });

  return { total: count, rows };
};

/**
 * Thêm 1 sinh viên vào khóa học (trong transaction cho sẵn).
 * Trả về enrollment vừa tạo hoặc ném lỗi với message mô tả lý do.
 */
const addOneEnrollment = async ({ student_id, course_id, academic_term_id, enrollment_type }, transaction) => {
  const student = await Student.findByPk(student_id, { transaction });
  if (!student) throw new Error('Sinh viên không tồn tại');

  const existing = await Enrollment.findOne({
    where: { student_id, course_id, academic_term_id },
    transaction,
  });
  if (existing) throw new Error('Sinh viên đã được ghi danh vào khóa học trong học kỳ này');

  return Enrollment.create({
    student_id,
    course_id,
    academic_term_id,
    enrollment_type,
    status: 'active',
    enrolled_at: sequelize.literal('GETDATE()'),
    source_request_id: null,
  }, { transaction });
};

/**
 * Admin ghi danh hàng loạt theo từng dòng như Excel.
 * Body: [{ student_code, course_code, academic_year, semester, enrollment_type }, ...]
 * Cache course và term để tránh query lặp khi nhiều dòng cùng môn/học kỳ.
 */
const bulkAddEnrollments = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0)
    throw ApiError.badRequest('Body phải là mảng không rỗng');

  const courseCache  = new Map(); // course_code        → Course | null
  const termCache    = new Map(); // "year|semester"     → AcademicTerm | null
  const studentCache = new Map(); // student_code        → Student | null

  let successCount = 0;
  let errorCount   = 0;
  const errors     = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // tương ứng dòng Excel (header = 1)

    try {
      const { student_code, course_code, academic_year, semester, enrollment_type } = row;

      if (!student_code)  throw new Error('Thiếu mã số sinh viên');
      if (!course_code)   throw new Error('Thiếu mã môn học');
      if (!academic_year) throw new Error('Thiếu năm học');
      if (!semester)      throw new Error('Thiếu kỳ học');
      if (!ENROLLMENT_TYPES.includes(enrollment_type))
        throw new Error(`Loại đăng ký không hợp lệ: "${enrollment_type}". Hợp lệ: ${ENROLLMENT_TYPES.join(', ')}`);

      const normalizedYear    = normalizeAcademicYear(academic_year);
      const normalizedCode    = String(course_code).trim().toUpperCase();
      const normalizedStudent = String(student_code).trim();
      const termKey           = `${normalizedYear}|${semester}`;

      // ── Lookup course (cached) ──────────────────────────────────
      if (!courseCache.has(normalizedCode)) {
        courseCache.set(normalizedCode, await Course.findOne({ where: { course_code: normalizedCode } }));
      }
      const course = courseCache.get(normalizedCode);
      if (!course)           throw new Error(`Không tìm thấy môn học "${normalizedCode}"`);
      if (!course.is_active) throw new Error(`Môn học "${normalizedCode}" đã đóng`);

      // ── Lookup academic term (cached) ───────────────────────────
      if (!termCache.has(termKey)) {
        termCache.set(termKey, await AcademicTerm.findOne({
          where: { academic_year: normalizedYear, semester: Number(semester) },
        }));
      }
      const term = termCache.get(termKey);
      if (!term)           throw new Error(`Không tìm thấy học kỳ ${semester} năm học ${normalizedYear}`);
      if (!term.is_active) throw new Error(`Học kỳ ${semester} năm học ${normalizedYear} đã đóng`);

      // ── Lookup student (cached) ─────────────────────────────────
      if (!studentCache.has(normalizedStudent)) {
        studentCache.set(normalizedStudent, await Student.findOne({ where: { student_code: normalizedStudent } }));
      }
      const student = studentCache.get(normalizedStudent);
      if (!student) throw new Error(`Không tìm thấy sinh viên "${normalizedStudent}"`);

      // ── Tạo enrollment ──────────────────────────────────────────
      await sequelize.transaction(async (t) => {
        const existing = await Enrollment.findOne({
          where: { student_id: student.id, course_id: course.id, academic_term_id: term.id },
          transaction: t,
        });
        if (existing) throw new Error('Sinh viên đã được ghi danh vào môn học này trong học kỳ này');

        await Enrollment.create({
          student_id:       student.id,
          course_id:        course.id,
          academic_term_id: term.id,
          enrollment_type,
          status:           'active',
          enrolled_at:      sequelize.literal('GETDATE()'),
          source_request_id: null,
        }, { transaction: t });
      });

      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({
        row:          rowNum,
        student_code: row.student_code  ?? null,
        course_code:  row.course_code   ?? null,
        reason:       err.message,
      });
    }
  }

  return { total: rows.length, successCount, errorCount, errors };
};

module.exports = { listEnrollments, listEnrollmentRequests, addOneEnrollment, bulkAddEnrollments };
