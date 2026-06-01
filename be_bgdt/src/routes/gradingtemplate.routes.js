const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradingtemplate.controller');

//  Mẫu tiêu chí (grading_criteria_templates) 
// GET /api/grading-criteria-templates?activeOnly=true
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/grading-criteria-templates/:id  (kèm danh sách tiêu chí con)
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/grading-criteria-templates
// Body: { template_name, description?, total_max_score?, pass_score?, is_active?, items?: [...] }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/grading-criteria-templates/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/grading-criteria-templates/:id  (chỉ khi chưa có tiêu chí & chưa gắn đợt)
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

//  Tiêu chí con (grading_criteria_items) 
// POST /api/grading-criteria-templates/:id/items  (thêm 1 hoặc nhiều)
// Body: { code, criteria_name, max_score, ... }  | [ {...}, {...} ]  | { items: [...] }
router.post('/:id/items', authenticate, authorize('admin'), ctrl.addItems);

// POST /api/grading-criteria-templates/:id/items/import  (import Excel)
// Body: { items: [...], mode?: 'append' | 'replace' }
router.post('/:id/items/import', authenticate, authorize('admin'), ctrl.importItems);

// PUT /api/grading-criteria-templates/:id/items/:itemId
router.put('/:id/items/:itemId', authenticate, authorize('admin'), ctrl.updateItem);

// DELETE /api/grading-criteria-templates/:id/items/:itemId  (chỉ khi chưa gắn đợt)
router.delete('/:id/items/:itemId', authenticate, authorize('admin'), ctrl.removeItem);

module.exports = router;
