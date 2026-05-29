const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const clController = require('../controllers/courselecturer.controller');

/**
 * GET /api/course-lecturers
 * Danh sách phân công giảng viên (admin)
 * Query: lecturer_code, lecturer_name, role_name, course_code, course_name,
 *        assigned_by_code, assigned_by_name, is_active, page, pageSize
 */
router.get('/', authenticate, authorize('admin'), clController.list);

/**
 * POST /api/course-lecturers
 * Phân công giảng viên vào môn học (admin)
 * Body: { course_code, lecturer_code, role_name: "manager"|"member" }
 */
router.post('/', authenticate, authorize('admin'), clController.assign);

/**
 * POST /api/course-lecturers/bulk
 * Import hàng loạt phân công giảng viên (admin)
 * Body: [{ course_code, lecturer_code, role_name }, ...]
 */
router.post('/bulk', authenticate, authorize('admin'), clController.bulkAssign);

/**
 * PATCH /api/course-lecturers/:id/role
 * Chỉ cập nhật quyền (manager ↔ member)
 * Body: { role_name: "manager"|"member" }
 */
router.patch('/:id/role', authenticate, authorize('admin'), clController.updateRole);

/**
 * PATCH /api/course-lecturers/:id/status
 * Chỉ cập nhật trạng thái is_active
 * Body: { is_active: true|false }
 */
router.patch('/:id/status', authenticate, authorize('admin'), clController.updateStatus);

module.exports = router;
