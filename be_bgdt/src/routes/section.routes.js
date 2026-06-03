const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/section.controller');

// GET /api/sections?course_id=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// POST /api/sections   Body: { course_id, section_title, description?, section_order? }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/sections/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/sections/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
