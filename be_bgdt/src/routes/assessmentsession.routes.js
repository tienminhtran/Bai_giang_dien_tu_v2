const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/assessmentsession.controller');

// GET /api/assessment-sessions?session_name=&academic_term_id=&status=&page=&pageSize=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/assessment-sessions/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/assessment-sessions
// Body: { session_name, description?, academic_term_id, criteria_template_id, start_date, end_date, status? }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/assessment-sessions/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/assessment-sessions/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
