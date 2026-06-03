const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradingteam.controller');

// GET /api/grading-teams?round_id=&only_unassigned=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/grading-teams/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/grading-teams
// Body: { round_id, team_name, note?, members: [{ lecturer_id, member_role, position_title? }] }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// POST /api/grading-teams/:id/assign   Body: { group_id }
router.post('/:id/assign', authenticate, authorize('admin'), ctrl.assign);

// POST /api/grading-teams/:id/unassign
router.post('/:id/unassign', authenticate, authorize('admin'), ctrl.unassign);

// DELETE /api/grading-teams/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
