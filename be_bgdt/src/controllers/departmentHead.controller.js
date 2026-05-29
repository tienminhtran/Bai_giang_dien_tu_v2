const service = require('../services/departmentHead.service');

const listMyLecturers = async (req, res) => {
  try {
    const lecturerId = req.user?.profile_id;
    if (!lecturerId) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ giảng viên trong token' });
    }

    const { lecturer_code, full_name, page = 1, pageSize = 20 } = req.query;
    const result = await service.getMyFacultyLecturers(lecturerId, {
      lecturer_code,
      full_name,
      page: Math.max(Number(page) || 1, 1),
      pageSize: Math.max(Number(pageSize) || 20, 1),
    });

    return res.json({
      success: true,
      data:     result.rows,
      total:    result.total,
      page:     Math.max(Number(page) || 1, 1),
      pageSize: Math.max(Number(pageSize) || 20, 1),
      faculty_id: result.faculty_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { listMyLecturers };
