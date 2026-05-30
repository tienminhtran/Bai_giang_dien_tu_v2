const service = require('../services/departmentHead.service');

// GET /api/department-head/lecturers
const listMyLecturers = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }

    const { lecturer_code, full_name, page = 1, pageSize = 20 } = req.query;
    const result = await service.getMyFacultyLecturers(lecturerId, req.user?.id, {
      lecturer_code,
      full_name,
      page:     Math.max(Number(page)     || 1,  1),
      pageSize: Math.max(Number(pageSize) || 20, 1),
    });

    return res.json({
      success:    true,
      data:       result.rows,
      total:      result.total,
      page:       Math.max(Number(page) || 1, 1),
      pageSize:   Math.max(Number(pageSize) || 20, 1),
      faculty_id: result.faculty_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// GET /api/department-head/majors/:majorId/lecturers
const listLecturersByMajor = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }

    const { majorId } = req.params;
    const { lecturer_code, full_name, page = 1, pageSize = 20 } = req.query;

    const result = await service.getLecturersByMajor(lecturerId, req.user?.id, majorId, {
      lecturer_code,
      full_name,
      page:     Math.max(Number(page)     || 1,  1),
      pageSize: Math.max(Number(pageSize) || 20, 1),
    });

    return res.json({
      success:    true,
      data:       result.rows,
      total:      result.total,
      page:       Math.max(Number(page) || 1, 1),
      pageSize:   Math.max(Number(pageSize) || 20, 1),
      faculty_id: result.faculty_id,
      major_id:   result.major_id,
      major_name: result.major_name,
      is_lock:    result.is_lock,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { listMyLecturers, listLecturersByMajor };
