const facultyService = require('../services/faculty.service');

const list = async (req, res) => {
  try {
    const faculties = await facultyService.listFaculties();
    return res.json({ success: true, data: faculties });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const create = async (req, res) => {
  try {
    const faculty = await facultyService.createFaculty(req.body || {});
    return res.status(201).json({ success: true, message: 'Tạo khoa thành công', data: faculty });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await facultyService.updateFaculty(id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật khoa thành công', data: faculty });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await facultyService.deleteFaculty(id);
    return res.json({ success: true, message: 'Xóa khoa thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const importFaculties = async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Body phải là một mảng khoa' });
    }
    const { successCount, errorCount, errors } = await facultyService.importFaculties(records);
    return res.status(207).json({
      success: true,
      data: { total: records.length, successCount, errorCount, errors },
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, create, update, remove, importFaculties };
