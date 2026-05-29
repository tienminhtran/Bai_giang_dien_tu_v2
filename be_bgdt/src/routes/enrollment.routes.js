const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const enrollmentController = require('../controllers/enrollment.controller');

/**
 * GET /api/enrollments
 * Danh sách sinh viên đã ghi danh (admin)
 * Query: student_code, full_name, course_code, course_name, academic_year, semester, page, pageSize
 */
router.get('/', authenticate, authorize('admin'), enrollmentController.listEnrollments);

/**
 * GET /api/enrollments/requests
 * Danh sách yêu cầu ghi danh (admin)
 * Query: student_code, full_name, course_code, course_name, academic_year, semester,
 *        lecturer_code, lecturer_name, page, pageSize
 */
router.get('/requests', authenticate, authorize('admin'), enrollmentController.listEnrollmentRequests);

/**
 * POST /api/enrollments/bulk
 * Admin thêm nhiều sinh viên vào khóa học
 * Body: { course_id, academic_year, semester, enrollment_type, student_ids[] }
 * enrollment_type: "new" | "retake" | "improve"
 */
router.post('/bulk', authenticate, authorize('admin'), enrollmentController.bulkAddEnrollments);

module.exports = router;
