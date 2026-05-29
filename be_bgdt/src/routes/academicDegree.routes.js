const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/academicDegree.controller');

// GET /api/academic-degrees
router.get('/', authenticate, authorize('admin', 'lecturer', 'council'), ctrl.list);

// POST /api/academic-degrees  (admin only)
router.post('/', authenticate, authorize('admin'), ctrl.create);

// DELETE /api/academic-degrees/:id  (admin only)
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
