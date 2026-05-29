const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const facultyController = require('../controllers/faculty.controller');

// GET /api/faculties  (admin, lecturer, council)
router.get('/', authenticate, authorize('admin', 'lecturer', 'council'), facultyController.list);

// POST /api/faculties  (admin only)
router.post('/', authenticate, authorize('admin'), facultyController.create);

// POST /api/faculties/import  (admin only)
router.post('/import', authenticate, authorize('admin'), facultyController.importFaculties);

// PUT /api/faculties/:id  (admin only)
router.put('/:id', authenticate, authorize('admin'), facultyController.update);

// DELETE /api/faculties/:id  (admin only)
router.delete('/:id', authenticate, authorize('admin'), facultyController.remove);

module.exports = router;
