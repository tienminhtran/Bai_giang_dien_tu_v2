const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const { CourseRole } = require('../models');

// GET /api/course-roles - lấy toàn bộ danh sách quyền môn học cho admin
router.get('/', authenticate, authorize('admin'), async (req, res) => {
	try {
		const courseRoles = await CourseRole.findAll({
			order: [['role_name', 'ASC']],
		});

		return res.json({
			success: true,
			data: courseRoles,
		});
	} catch (err) {
		console.error(err);
		return res.status(err.statusCode || 500).json({
			success: false,
			message: err.message || 'Lỗi server',
		});
	}
});

module.exports = router;
