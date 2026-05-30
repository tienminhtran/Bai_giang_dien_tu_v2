const { Op } = require('sequelize');
const XLSX = require('xlsx');
const { Major, Faculty, Lecturer } = require('../models');
const { assertDepartmentHead } = require('../helpers/departmentHead');
const { checkMajorBelongsToFaculty } = require('../helpers/majorHelpers');

// ── Lấy tất cả chuyên ngành (Admin) ──
const listAllMajors = async () => {
  return Major.findAll({
    order: [[{ model: Faculty, as: 'faculty' }, 'faculty_name', 'ASC'], ['major_name', 'ASC']],
    include: [
      { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      { model: Lecturer, as: 'lecturers', attributes: ['id'], required: false },
    ],
  });
};

// ── Lấy chuyên ngành trong khoa của trưởng khoa
const listMyFacultyMajors = async (lecturerId, userId) => {
  await assertDepartmentHead(userId);
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

  return Major.findAll({
    where: { faculty_id: me.faculty_id },
    order: [['major_name', 'ASC']],
    include: [
      { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      { model: Lecturer, as: 'lecturers', attributes: ['id'], required: false },
    ],
  });
};

// ── Tạo chuyên ngành (Admin hoặc Trưởng khoa) ──
const createMajor = async ({ major_name, faculty_id }) => {
  if (!major_name || !faculty_id) {
    const err = new Error('major_name và faculty_id là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const faculty = await Faculty.findByPk(faculty_id);
  if (!faculty) {
    const err = new Error('Không tìm thấy khoa');
    err.statusCode = 404;
    throw err;
  }

  const existed = await Major.findOne({ where: { major_name: String(major_name).trim() } });
  if (existed) {
    const err = new Error('Tên chuyên ngành đã tồn tại');
    err.statusCode = 409;
    throw err;
  }

  const major = await Major.create({
    major_name: String(major_name).trim(),
    faculty_id,
  });

  return Major.findByPk(major.id, {
    include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
  });
};

// ── Tạo chuyên ngành — Trưởng khoa (chỉ được tạo trong khoa của mình) ──
const createMajorByDeptHead = async (lecturerId, userId, { major_name, faculty_id }) => {
  await assertDepartmentHead(userId);
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

  const targetFacultyId = faculty_id || me.faculty_id;
  if (String(targetFacultyId) !== String(me.faculty_id)) {
    const err = new Error('Trưởng khoa chỉ được tạo chuyên ngành trong khoa của mình');
    err.statusCode = 403;
    throw err;
  }

  return createMajor({ major_name, faculty_id: me.faculty_id });
};

// ── Admin thêm bất kỳ giảng viên vào chuyên ngành ─
const addLecturerToMajor = async (majorId, lecturerId) => {
  const [major, lecturer] = await Promise.all([
    Major.findByPk(majorId, { attributes: ['id', 'major_name', 'faculty_id'] }),
    Lecturer.findByPk(lecturerId, { attributes: ['id', 'faculty_id'] }),
  ]);

  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  if (!lecturer) {
    const err = new Error('Không tìm thấy giảng viên');
    err.statusCode = 404;
    throw err;
  }

  if (lecturer.faculty_id) {
    checkMajorBelongsToFaculty(major, lecturer.faculty_id);
  }

  await Lecturer.update({ major_id: majorId }, { where: { id: lecturerId } });

  return Lecturer.findByPk(lecturerId, {
    include: [
      { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      { model: Major, as: 'major', attributes: ['id', 'major_name'] },
    ],
  });
};

// ── Trưởng khoa thêm giảng viên khoa mình vào chuyên ngành ─
const addMyLecturerToMajor = async (headLecturerId, userId, targetLecturerId, majorId) => {
  await assertDepartmentHead(userId);
  const [me, target, major] = await Promise.all([
    Lecturer.findByPk(headLecturerId, { attributes: ['id', 'faculty_id'] }),
    Lecturer.findByPk(targetLecturerId, { attributes: ['id', 'faculty_id'] }),
    // Phải lấy is_lock để kiểm tra trạng thái khóa
    Major.findByPk(majorId, { attributes: ['id', 'major_name', 'faculty_id', 'is_lock'] }),
  ]);

  if (!me) {
    const err = new Error('Không tìm thấy hồ sơ trưởng khoa');
    err.statusCode = 404;
    throw err;
  }
  if (!me.faculty_id) {
    const err = new Error('Tài khoản chưa được gán vào khoa nào');
    err.statusCode = 422;
    throw err;
  }
  if (!target) {
    const err = new Error('Không tìm thấy giảng viên');
    err.statusCode = 404;
    throw err;
  }
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  console.log('addMyLecturerToMajor - me:', me.id, 'target:', target.id, 'major:', major.id);
  if (major.is_lock) {
    const err = new Error('Chuyên ngành đang bị khóa, không thể thêm giảng viên');
    err.statusCode = 403;
    throw err;
  }
  if (String(target.faculty_id) !== String(me.faculty_id)) {
    const err = new Error('Giảng viên không thuộc khoa của bạn');
    err.statusCode = 403;
    throw err;
  }
  if (String(major.faculty_id) !== String(me.faculty_id)) {
    const err = new Error('Chuyên ngành không thuộc khoa của bạn');
    err.statusCode = 403;
    throw err;
  }

  await Lecturer.update({ major_id: majorId }, { where: { id: targetLecturerId } });

  return Lecturer.findByPk(targetLecturerId, {
    include: [
      { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      { model: Major, as: 'major', attributes: ['id', 'major_name'] },
    ],
  });
};

// ── Admin cập nhật chuyên ngành bất kỳ 
const updateMajor = async (majorId, { major_name, faculty_id }) => {
  const major = await Major.findByPk(majorId);
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }

  if (faculty_id) {
    const faculty = await Faculty.findByPk(faculty_id);
    if (!faculty) {
      const err = new Error('Không tìm thấy khoa');
      err.statusCode = 404;
      throw err;
    }
  }

  if (major_name) {
    const trimmed = String(major_name).trim();
    const dup = await Major.findOne({ where: { major_name: trimmed, id: { [Op.ne]: majorId } } });
    if (dup) {
      const err = new Error('Tên chuyên ngành đã tồn tại');
      err.statusCode = 409;
      throw err;
    }
    major.major_name = trimmed;
  }
  if (faculty_id) major.faculty_id = faculty_id;

  await major.save();
  return Major.findByPk(majorId, {
    include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
  });
};

// ── Trưởng khoa cập nhật chuyên ngành trong khoa mình
const updateMyMajor = async (lecturerId, userId, majorId, { major_name }) => {
  await assertDepartmentHead(userId);
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

  const major = await Major.findByPk(majorId);
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  if (String(major.faculty_id) !== String(me.faculty_id)) {
    const err = new Error('Chuyên ngành không thuộc khoa của bạn');
    err.statusCode = 403;
    throw err;
  }
  if (major.is_lock) {
    const err = new Error('Chuyên ngành đang bị khóa, không thể chỉnh sửa');
    err.statusCode = 403;
    throw err;
  }

  if (!major_name || !String(major_name).trim()) {
    const err = new Error('major_name là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const trimmed = String(major_name).trim();
  const dup = await Major.findOne({ where: { major_name: trimmed, id: { [Op.ne]: majorId } } });
  if (dup) {
    const err = new Error('Tên chuyên ngành đã tồn tại');
    err.statusCode = 409;
    throw err;
  }

  major.major_name = trimmed;
  await major.save();
  return Major.findByPk(majorId, {
    include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
  });
};

// ── Admin xóa chuyên ngành ─
const deleteMajor = async (majorId) => {
  const major = await Major.findByPk(majorId);
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  if (major.is_lock) {
    const err = new Error('Chuyên ngành đang bị khóa, không thể xóa');
    err.statusCode = 403;
    throw err;
  }
  // kiem tra xem có giảng viên nào đang thuộc chuyên ngành này không
  const hasLecturers = await Lecturer.findOne({ where: { major_id: majorId } });
  if (hasLecturers) {
    const err = new Error('Không thể xóa chuyên ngành đang có giảng viên');
    err.statusCode = 403;
    throw err;
  }
  await major.destroy();
};

// ── Admin import hàng loạt từ file Excel ─
// Mỗi sheet = tên khoa; mỗi dòng (cột A) = tên chuyên ngành
const importMajors = async (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Lấy tất cả khoa một lần
  const allFaculties = await Faculty.findAll({ attributes: ['id', 'faculty_name'] });
  const facultyMap = {};
  allFaculties.forEach((f) => { facultyMap[f.faculty_name.trim().toLowerCase()] = f; });

  const results = { created: [], skipped: [], errors: [] };

  for (const sheetName of workbook.SheetNames) {
    const faculty = facultyMap[sheetName.trim().toLowerCase()];
    if (!faculty) {
      results.errors.push({ sheet: sheetName, reason: `Không tìm thấy khoa "${sheetName}" trong hệ thống` });
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    // Bỏ qua dòng đầu (header)
    for (let i = 1; i < rows.length; i++) {
      const cellValue = rows[i][0];
      if (!cellValue || !String(cellValue).trim()) continue;
      const majorName = String(cellValue).trim();

      try {
        const existed = await Major.findOne({ where: { major_name: majorName } });
        if (existed) {
          results.skipped.push({ majorName, facultyName: faculty.faculty_name, reason: 'Đã tồn tại' });
          continue;
        }
        await Major.create({ major_name: majorName, faculty_id: faculty.id });
        results.created.push({ majorName, facultyName: faculty.faculty_name });
      } catch (e) {
        results.errors.push({ sheet: sheetName, majorName, reason: e.message });
      }
    }
  }

  return results;
};

// ── Admin tải file Excel mẫu (mỗi sheet = một khoa, có sẵn header) ──
const downloadTemplate = async () => {
  const allFaculties = await Faculty.findAll({ attributes: ['faculty_name'], order: [['faculty_name', 'ASC']] });

  const workbook = XLSX.utils.book_new();

  if (allFaculties.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['Tên chuyên ngành'], ['VD: Kỹ thuật phần mềm']]);
    XLSX.utils.book_append_sheet(workbook, ws, 'Khoa mẫu');
  } else {
    for (const faculty of allFaculties) {
      const sheetName = faculty.faculty_name.substring(0, 31); // Excel giới hạn 31 ký tự tên sheet
      const ws = XLSX.utils.aoa_to_sheet([['Tên chuyên ngành']]);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

// ── Admin khóa / mở khóa toàn bộ chuyên ngành (có thể lọc theo khoa) 
const lockAllMajors = async ({ is_lock, faculty_id }) => {
  const where = {};
  if (faculty_id) where.faculty_id = faculty_id;
  const [affectedCount] = await Major.update({ is_lock: Boolean(is_lock) }, { where });
  return { affectedCount };
};

// ── Admin khóa / mở khóa chuyên ngành ─
const toggleLockMajor = async (majorId, is_lock) => {
  const major = await Major.findByPk(majorId);
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  major.is_lock = Boolean(is_lock);
  await major.save();
  return Major.findByPk(majorId, {
    include: [
      { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      { model: Lecturer, as: 'lecturers', attributes: ['id'], required: false },
    ],
  });
};

module.exports = {
  listAllMajors,
  listMyFacultyMajors,
  createMajor,
  createMajorByDeptHead,
  addLecturerToMajor,
  addMyLecturerToMajor,
  updateMajor,
  updateMyMajor,
  deleteMajor,
  importMajors,
  downloadTemplate,
  toggleLockMajor,
  lockAllMajors,
};
