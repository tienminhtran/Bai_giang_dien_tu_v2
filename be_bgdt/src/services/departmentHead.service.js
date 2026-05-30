const { Op } = require('sequelize');
const { Lecturer, Faculty, Major } = require('../models');
const { assertDepartmentHead, resolveHeadFaculty, assertMajorInFaculty } = require('../helpers/departmentHead');

/**
 * Lấy danh sách giảng viên thuộc khoa của trưởng khoa.
 * Hỗ trợ tìm theo mã GV, họ tên, phân trang.
 */
const getMyFacultyLecturers = async (lecturerId, userId, { lecturer_code, full_name, page = 1, pageSize = 20 } = {}) => {
  await assertDepartmentHead(userId);
  const facultyId = await resolveHeadFaculty(lecturerId);

  const where = { faculty_id: facultyId };
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
      order: [
        [{ model: Major, as: 'major' }, 'major_name', 'ASC'],
        ['lecturer_code', 'ASC'],
      ],
      include: [
        { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
        { model: Major,   as: 'major',   attributes: ['id', 'major_name'] },
      ],
    }),
  ]);

  return { faculty_id: facultyId, total, rows };
};

/**
 * Lấy danh sách giảng viên thuộc một chuyên ngành cụ thể trong khoa của trưởng khoa.
 * Kiểm tra: chuyên ngành phải thuộc khoa của trưởng khoa.
 * Hỗ trợ tìm theo mã GV, họ tên, phân trang.
 */
const getLecturersByMajor = async (lecturerId, userId, majorId, { lecturer_code, full_name, page = 1, pageSize = 20 } = {}) => {
  await assertDepartmentHead(userId);
  const facultyId = await resolveHeadFaculty(lecturerId);
  const major     = await assertMajorInFaculty(majorId, facultyId);

  const where = { major_id: majorId };
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
      include: [
        { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
        { model: Major,   as: 'major',   attributes: ['id', 'major_name'] },
      ],
    }),
  ]);

  return {
    faculty_id: facultyId,
    major_id:   major.id,
    major_name: major.major_name,
    is_lock:    major.is_lock,
    total,
    rows,
  };
};

module.exports = { getMyFacultyLecturers, getLecturersByMajor };
