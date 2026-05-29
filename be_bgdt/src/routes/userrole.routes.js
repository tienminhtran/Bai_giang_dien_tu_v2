const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const userRoleController = require('../controllers/userrole.controller');

// GET /api/user-roles/roles  — lấy toàn bộ danh sách role
router.get('/roles', authenticate, authorize('admin'), userRoleController.listAllRoles);

// lấy danh sách giảng viên kèm vai trò của họ, có tìm kiếm và phân trang
// GET /api/user-roles/lecturers?lecturer_code=&full_name=&page=&pageSize=
router.get('/lecturers', authenticate, authorize('admin'), userRoleController.listLecturerRoles);

// PUT /api/user-roles/lecturers/:lecturerId  — cập nhật quyền
router.put('/lecturers/:lecturerId', authenticate, authorize('admin'), userRoleController.updateLecturerRoles);

module.exports = router;
