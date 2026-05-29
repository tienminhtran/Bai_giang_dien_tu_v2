const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('username là bắt buộc'),
  body('password')
    .notEmpty().withMessage('password là bắt buộc'),
  body('client_id')
    .notEmpty().withMessage('client_id là bắt buộc')
    .isIn(['student_portal', 'staff_portal']).withMessage('client_id không hợp lệ'),
];

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// GET /api/auth/me — lấy thông tin user hiện tại (dùng cho cả 4 role)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
