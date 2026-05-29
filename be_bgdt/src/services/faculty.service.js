const { Faculty, Lecturer } = require('../models');

const listFaculties = async () => {
  return Faculty.findAll({ order: [['faculty_name', 'ASC']] });
};

const createFaculty = async ({ faculty_name }) => {
  if (!faculty_name || !String(faculty_name).trim()) {
    const err = new Error('faculty_name là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const name = String(faculty_name).trim();
  const existing = await Faculty.findOne({ where: { faculty_name: name } });
  if (existing) {
    const err = new Error('Tên khoa đã tồn tại');
    err.statusCode = 409;
    throw err;
  }

  return Faculty.create({ faculty_name: name });
};

const updateFaculty = async (id, { faculty_name }) => {
  const faculty = await Faculty.findByPk(id);
  if (!faculty) {
    const err = new Error('Không tìm thấy khoa');
    err.statusCode = 404;
    throw err;
  }

  if (!faculty_name || !String(faculty_name).trim()) {
    const err = new Error('faculty_name là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const name = String(faculty_name).trim();
  if (name !== faculty.faculty_name) {
    const existing = await Faculty.findOne({ where: { faculty_name: name } });
    if (existing) {
      const err = new Error('Tên khoa đã tồn tại');
      err.statusCode = 409;
      throw err;
    }
  }

  await Faculty.update({ faculty_name: name }, { where: { id } });
  return Faculty.findByPk(id);
};

const deleteFaculty = async (id) => {
  const faculty = await Faculty.findByPk(id);
  if (!faculty) {
    const err = new Error('Không tìm thấy khoa');
    err.statusCode = 404;
    throw err;
  }

  const lecturerCount = await Lecturer.count({ where: { faculty_id: id } });
  if (lecturerCount > 0) {
    const err = new Error(`Không thể xóa khoa vì có ${lecturerCount} giảng viên thuộc khoa này`);
    err.statusCode = 409;
    throw err;
  }

  await Faculty.destroy({ where: { id } });
  return { success: true };
};

const importFaculties = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    const err = new Error('Danh sách khoa không hợp lệ hoặc rỗng');
    err.statusCode = 400;
    throw err;
  }

  let successCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      await createFaculty({ faculty_name: record.faculty_name });
      successCount++;
    } catch (err) {
      errors.push({
        row: i + 1,
        faculty_name: record.faculty_name || null,
        message: err.message || 'Lỗi không xác định',
      });
    }
  }

  return { successCount, errorCount: errors.length, errors };
};

module.exports = { listFaculties, createFaculty, updateFaculty, deleteFaculty, importFaculties };
