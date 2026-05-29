const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const studentController = require('../controllers/student.controller');

/**
 * Lấy danh sách sinh viên với tùy chọn tìm kiếm theo student_code và full_name, có phân trang
 * GET /api/students?student_code=&full_name=&page=&pageSize=
 */
router.get('/', authenticate, authorize('admin', 'lecturer', 'council'), studentController.list);

// POST /api/students  (admin only)
router.post('/', authenticate, authorize('admin'), studentController.create);

// POST /api/students/import  (admin only)
router.post('/import', authenticate, authorize('admin'), studentController.importStudents);

// POST /api/students/lock-batch  (admin only) - khóa/mở khóa bằng mảng studentIds
router.post('/lock-batch', authenticate, authorize('admin'), studentController.lockAccountsBulk);

// PUT /api/students/:id  (admin only) - chỉnh sửa thông tin sinh viên
router.put('/:id', authenticate, authorize('admin'), studentController.update);

// POST /api/students/:id/lock  (admin only) - khóa hoặc mở khóa tài khoản sinh viên
router.post('/:id/lock', authenticate, authorize('admin'), studentController.lockAccount);

// POST /api/students/:id/reset-password  (admin only) - reset password to default or provided
router.post('/:id/reset-password', authenticate, authorize('admin'), studentController.resetPassword);

module.exports = router;
