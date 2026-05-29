const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const lectureController = require('../controllers/lecture.controller');

/**
 * Lấy danh sách giảng viên có tìm kiếm và phân trang
 * GET /api/lectures?lecturer_code=&full_name=&page=&pageSize=
 */
router.get('/', authenticate, authorize('admin', 'lecturer', 'council'), lectureController.list);

// POST /api/lectures  (admin only)
router.post('/', authenticate, authorize('admin'), lectureController.create);

// POST /api/lectures/import  (admin only)
router.post('/import', authenticate, authorize('admin'), lectureController.importLecturers);

// POST /api/lectures/lock-batch  (admin only)
router.post('/lock-batch', authenticate, authorize('admin'), lectureController.lockAccountsBulk);

// PUT /api/lectures/:id  (admin only)
router.put('/:id', authenticate, authorize('admin'), lectureController.update);

// POST /api/lectures/:id/lock  (admin only)
router.post('/:id/lock', authenticate, authorize('admin'), lectureController.lockAccount);

// POST /api/lectures/:id/reset-password  (admin only)
router.post('/:id/reset-password', authenticate, authorize('admin'), lectureController.resetPassword);

// GET /api/lectures/degrees  — danh sách học vị hợp lệ
router.get('/degrees', authenticate, authorize('admin', 'lecturer', 'council'), lectureController.listDegrees);

// PATCH /api/lectures/:id/degree  (admin only)
router.patch('/:id/degree', authenticate, authorize('admin'), lectureController.updateDegree);

module.exports = router;
