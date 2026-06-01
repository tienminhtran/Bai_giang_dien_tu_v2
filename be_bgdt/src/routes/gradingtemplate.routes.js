const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradingtemplate.controller');

// GET /api/grading-criteria-templates?activeOnly=true
router.get('/', authenticate, authorize('admin'), ctrl.list);

module.exports = router;
