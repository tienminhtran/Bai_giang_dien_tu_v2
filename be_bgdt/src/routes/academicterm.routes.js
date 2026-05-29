const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const termController = require('../controllers/academicterm.controller');

// GET /api/academic-terms?academic_year=&semester=&is_active=&page=&pageSize=
router.get('/', authenticate, authorize('admin'), termController.list);

// POST /api/academic-terms
// Body: { academic_year, semester, start_date?, end_date?, is_active? }
router.post('/', authenticate, authorize('admin'), termController.create);

// PUT /api/academic-terms/:id
router.put('/:id', authenticate, authorize('admin'), termController.update);

module.exports = router;
