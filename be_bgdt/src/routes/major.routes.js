const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/major.controller');

// Chỉ nhận file vào bộ nhớ, không lưu disk
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .xlsx'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Template & Import (phải đứng trước /:id để không bị nhầm) 
// GET  /api/majors/import/template — Admin tải file Excel mẫu
router.get('/import/template', authenticate, authorize('admin'), ctrl.getTemplate);

// POST /api/majors/import — Admin import hàng loạt từ Excel
router.post('/import', authenticate, authorize('admin'), upload.single('file'), ctrl.importExcel);

// ── CRUD chuyên ngành 
// GET /api/majors — Admin lấy tất cả chuyên ngành
router.get('/', authenticate, authorize('admin'), ctrl.listAll);

// GET /api/majors/faculty/:facultyId — Admin lấy chuyên ngành theo khoa (kèm chủ nhiệm ngành)
router.get('/faculty/:facultyId', authenticate, authorize('admin'), ctrl.listByFaculty);

// GET /api/majors/my-faculty — Trưởng khoa lấy chuyên ngành trong khoa mình
router.get('/my-faculty', authenticate, authorize('department_head'), ctrl.listMyFaculty);

// POST /api/majors — Admin tạo chuyên ngành (chỉ định faculty_id bất kỳ)
router.post('/', authenticate, authorize('admin'), ctrl.create);

// POST /api/majors/my-faculty — Trưởng khoa tạo chuyên ngành trong khoa mình
router.post('/my-faculty', authenticate, authorize('department_head'), ctrl.createByDeptHead);

// PUT /api/majors/:id — Admin cập nhật chuyên ngành
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// PUT /api/majors/my-faculty/:id — Trưởng khoa cập nhật chuyên ngành trong khoa mình
router.put('/my-faculty/:id', authenticate, authorize('department_head'), ctrl.updateMine);

// DELETE /api/majors/:id — Admin xóa chuyên ngành
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

// PATCH /api/majors/lock-all — Admin khóa / mở khóa toàn bộ (phải đứng trước /:id/lock)
router.patch('/lock-all', authenticate, authorize('admin'), ctrl.lockAll);

// PATCH /api/majors/:id/lock — Admin khóa / mở khóa chuyên ngành
router.patch('/:id/lock', authenticate, authorize('admin'), ctrl.toggleLock);

// ── Thêm giảng viên vào chuyên ngành 
// POST /api/majors/:id/add-lecturer — Admin thêm bất kỳ giảng viên vào chuyên ngành
router.post('/:id/add-lecturer', authenticate, authorize('admin'), ctrl.addLecturer);

// POST /api/majors/:id/add-my-lecturer — Trưởng khoa thêm giảng viên khoa mình vào chuyên ngành
router.post('/:id/add-my-lecturer', authenticate, authorize('department_head'), ctrl.addMyLecturer);

module.exports = router;
