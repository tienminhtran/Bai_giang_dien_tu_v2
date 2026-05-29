const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/departmentHead.controller');

/**
 * GET /api/department-head/lecturers
 * Danh sách giảng viên thuộc khoa của trưởng khoa đang đăng nhập
 * Query: lecturer_code, full_name, page, pageSize
 */
router.get('/lecturers', authenticate, authorize('department_head', 'admin'), ctrl.listMyLecturers);

module.exports = router;
