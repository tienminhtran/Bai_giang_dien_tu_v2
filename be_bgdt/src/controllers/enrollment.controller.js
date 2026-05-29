const enrollmentService = require('../services/enrollment.service');

const listEnrollments = async (req, res) => {
  try {
    const {
      student_code, full_name,
      course_code, course_name,
      academic_year, semester,
      page = 1, pageSize = 20,
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await enrollmentService.listEnrollments({
      student_code, full_name,
      course_code, course_name,
      academic_year, semester,
      page: pageNum, pageSize: size,
    });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const listEnrollmentRequests = async (req, res) => {
  try {
    const {
      student_code, full_name,
      course_code, course_name,
      academic_year, semester,
      lecturer_code, lecturer_name,
      page = 1, pageSize = 20,
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await enrollmentService.listEnrollmentRequests({
      student_code, full_name,
      course_code, course_name,
      academic_year, semester,
      lecturer_code, lecturer_name,
      page: pageNum, pageSize: size,
    });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const bulkAddEnrollments = async (req, res) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows))
      return res.status(400).json({ success: false, message: 'Body phải là mảng JSON' });

    const result = await enrollmentService.bulkAddEnrollments(rows);

    const status = result.errorCount > 0 ? 207 : 201;
    return res.status(status).json({
      success: true,
      message: `Đã xử lý ${result.total} sinh viên: ${result.successCount} thành công, ${result.errorCount} thất bại`,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { listEnrollments, listEnrollmentRequests, bulkAddEnrollments };
