
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const courseController = require('../controllers/course.controller');

// GET /api/courses - lấy danh sách môn học có tìm kiếm và phân trang (admin)
router.get('/', authenticate, authorize('admin'), courseController.list);

// POST /api/courses - tạo một môn học (admin)
router.post('/', authenticate, authorize('admin'), courseController.create);

// POST /api/courses/import - import nhiều môn học (admin)
router.post('/import', authenticate, authorize('admin'), courseController.importCourses);

module.exports = router;