const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradinground.controller');

// GET /api/grading-rounds?round_name=&course_id=&council_type=&status=&page=&pageSize=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/grading-rounds/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/grading-rounds
// Body: { course_id, round_name, council_type, criteria_template_id, status?, parent_round_id?, note? }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/grading-rounds/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/grading-rounds/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;

/**
 * API Endpoints
Method	URL	Mô tả
GET	/api/grading-rounds?round_name=&course_id=&council_type=&status=&page=&pageSize=	Danh sách (phân trang + lọc)
GET	/api/grading-rounds/:id	Chi tiết 1 đợt
POST	/api/grading-rounds	Tạo mới
PUT	/api/grading-rounds/:id	Cập nhật
DELETE	/api/grading-rounds/:id	Xóa
Điểm nghiệp vụ đã xử lý
Validate enum: council_type ∈ evaluator|secretary, status ∈ forming|active|finalizing|closed
Validate FK: kiểm tra tồn tại course_id, criteria_template_id, parent_round_id (và chặn parent_round_id trỏ chính nó)
created_by lấy từ req.user.id (giống cách assigned_by ở course-lecturer)
Mốc thời gian tự động: chuyển sang active → set started_at; sang closed → set closed_at
Chặn xóa nếu đợt đã có thành viên hội đồng hoặc đợt con (phúc khảo)
Trả về kèm thông tin Course, criteriaTemplate, parentRound qua include
Bạn có muốn tôi viết tiếp frontend (service + endpoints + trang quản lý grading-rounds) không?
 */