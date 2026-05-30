const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/departmentHead.controller');

// GET /api/department-head/lecturers
// Danh sách giảng viên thuộc khoa của trưởng khoa
// Query: lecturer_code, full_name, page, pageSize
router.get('/lecturers', authenticate, authorize('department_head', 'admin'), ctrl.listMyLecturers);

// GET /api/department-head/majors/:majorId/lecturers
// Danh sách giảng viên thuộc 1 chuyên ngành cụ thể trong khoa của trưởng khoa
// Query: lecturer_code, full_name, page, pageSize
router.get('/majors/:majorId/lecturers', authenticate, authorize('department_head'), ctrl.listLecturersByMajor);

module.exports = router;
