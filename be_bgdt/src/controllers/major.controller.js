const majorService = require('../services/major.service');

// GET /api/majors — Admin lấy tất cả chuyên ngành
const listAll = async (req, res) => {
  try {
    const majors = await majorService.listAllMajors();
    return res.json({ success: true, data: majors });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// GET /api/majors/my-faculty — Trưởng khoa lấy chuyên ngành trong khoa mình
const listMyFaculty = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }
    const majors = await majorService.listMyFacultyMajors(lecturerId, req.user?.id);
    return res.json({ 
      success: true, data: majors 
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/majors — Admin tạo chuyên ngành
const create = async (req, res) => {
  try {
    const { major_name, faculty_id } = req.body || {};
    const major = await majorService.createMajor({ major_name, faculty_id });
    return res.status(201).json({ success: true, message: 'Tạo chuyên ngành thành công', data: major });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/majors/my-faculty — Trưởng khoa tạo chuyên ngành trong khoa mình
const createByDeptHead = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    console.log('createByDeptHead - lecturerId:', lecturerId, 'roles:', req.user?.roles);
    
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }
    const { major_name, faculty_id } = req.body || {};
    const major = await majorService.createMajorByDeptHead(lecturerId, req.user?.id, { major_name, faculty_id });
    return res.status(201).json({ success: true, message: 'Tạo chuyên ngành thành công', data: major });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/majors/:id/add-lecturer — Admin thêm bất kỳ giảng viên vào chuyên ngành
const addLecturer = async (req, res) => {
  try {
    const { id: majorId } = req.params;
    const { lecturer_id } = req.body || {};
    if (!lecturer_id) {
      return res.status(400).json({ success: false, message: 'lecturer_id là bắt buộc' });
    }
    const lecturer = await majorService.addLecturerToMajor(majorId, lecturer_id);
    return res.json({ success: true, message: 'Thêm giảng viên vào chuyên ngành thành công', data: lecturer });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/majors/:id/add-my-lecturer — Trưởng khoa thêm giảng viên khoa mình vào chuyên ngành
const addMyLecturer = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }
    const { id: majorId } = req.params;
    const { lecturer_id } = req.body || {};
    if (!lecturer_id) {
      return res.status(400).json({ success: false, message: 'lecturer_id là bắt buộc' });
    }
    const lecturer = await majorService.addMyLecturerToMajor(lecturerId, req.user?.id, lecturer_id, majorId);
    return res.json({ success: true, message: 'Thêm giảng viên vào chuyên ngành thành công', data: lecturer });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PUT /api/majors/:id — Admin cập nhật chuyên ngành
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { major_name, faculty_id } = req.body || {};
    const major = await majorService.updateMajor(id, { major_name, faculty_id });
    return res.json({ success: true, message: 'Cập nhật chuyên ngành thành công', data: major });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PUT /api/majors/my-faculty/:id — Trưởng khoa cập nhật chuyên ngành trong khoa mình
const updateMine = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }
    const { id } = req.params;
    const { major_name } = req.body || {};
    const major = await majorService.updateMyMajor(lecturerId, req.user?.id, id, { major_name });
    return res.json({ success: true, message: 'Cập nhật chuyên ngành thành công', data: major });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// DELETE /api/majors/:id — Admin xóa chuyên ngành
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await majorService.deleteMajor(id);
    return res.json({ success: true, message: 'Xóa chuyên ngành thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/majors/import — Admin import hàng loạt từ Excel
const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel (.xlsx)' });
    }
    const results = await majorService.importMajors(req.file.buffer);
    return res.json({ success: true, message: 'Import hoàn tất', data: results });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// GET /api/majors/import/template — Admin tải file Excel mẫu
const getTemplate = async (req, res) => {
  try {
    const buffer = await majorService.downloadTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename="major_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PATCH /api/majors/:id/lock — Admin khóa hoặc mở khóa chuyên ngành
const toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_lock } = req.body || {};
    if (is_lock === undefined || is_lock === null) {
      return res.status(400).json({ success: false, message: 'is_lock là bắt buộc (true/false)' });
    }
    const major = await majorService.toggleLockMajor(id, is_lock);
    const action = is_lock ? 'Khóa' : 'Mở khóa';
    return res.json({ success: true, message: `${action} chuyên ngành thành công`, data: major });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PATCH /api/majors/lock-all — Admin khóa hoặc mở khóa toàn bộ chuyên ngành
// Body: { is_lock: true|false, faculty_id?: uuid }
const lockAll = async (req, res) => {
  try {
    const { is_lock, faculty_id } = req.body || {};
    if (is_lock === undefined || is_lock === null) {
      return res.status(400).json({ success: false, message: 'is_lock là bắt buộc (true/false)' });
    }
    const { affectedCount } = await majorService.lockAllMajors({ is_lock, faculty_id });
    const action = is_lock ? 'Khóa' : 'Mở khóa';
    return res.json({ success: true, message: `${action} ${affectedCount} chuyên ngành thành công`, data: { affectedCount } });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { listAll, listMyFaculty, create, createByDeptHead, addLecturer, addMyLecturer, update, updateMine, remove, importExcel, getTemplate, toggleLock, lockAll };
