
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

// PUT /api/courses/:id - cập nhật môn học (admin)
router.put('/:id', authenticate, authorize('admin'), courseController.update);

// DELETE /api/courses/:id - xóa môn học (admin)
router.delete('/:id', authenticate, authorize('admin'), courseController.remove);

// PATCH /api/courses/:id/count-manager - cập nhật giới hạn số manager (admin)
router.patch('/:id/count-manager', authenticate, authorize('admin'), courseController.updateCountManager);

// GET /api/courses/my-faculty - trưởng khoa xem môn học của khoa mình (tự resolve từ JWT)
router.get('/my-faculty', authenticate, authorize('department_head'), courseController.listMyFaculty);

// GET lấy danh sách môn học của 1 khoa (admin xem tất cả, department_head chỉ xem khoa mình)
router.get('/faculty/:facultyId', authenticate, authorize('admin', 'department_head'), courseController.listByFaculty);

module.exports = router;
