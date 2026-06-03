const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradinggroup.controller');

// GET /api/grading-groups?round_id=&faculty_id=&status=&page=&pageSize=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/grading-groups/round/:roundId/setup  (nhóm + thành viên + giảng viên + khoa theo vòng chấm)
router.get('/round/:roundId/setup', authenticate, authorize('admin'), ctrl.roundSetup);

// POST /api/grading-groups/bulk  — tạo nhóm theo nhiều khoa
// Body: { round_id, faculty_ids: [...], group_name?, status?, note? }
router.post('/bulk', authenticate, authorize('admin'), ctrl.bulkCreate);

// GET /api/grading-groups/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/grading-groups
// Body: { round_id, group_name, group_code?, faculty_id, status?, note? }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/grading-groups/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/grading-groups/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

//  Thành viên nhóm 
// POST /api/grading-groups/:id/members
// Body: { lecturer_id, member_role?, position_title?, is_active? }
router.post('/:id/members', authenticate, authorize('admin'), ctrl.addMember);

// DELETE /api/grading-groups/:id/members/:memberId
router.delete('/:id/members/:memberId', authenticate, authorize('admin'), ctrl.removeMember);

module.exports = router;
