const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/gradinground.controller');

// GET /api/grading-rounds?round_name=&session_id=&faculty_scope_id=&status=&page=&pageSize=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/grading-rounds/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/grading-rounds
// Body: { session_id?, round_name, round_number?, faculty_scope_id?, status?, parent_round_id?, note? }
router.post('/', authenticate, authorize('admin'), ctrl.create);

// PUT /api/grading-rounds/:id
router.put('/:id', authenticate, authorize('admin'), ctrl.update);

// DELETE /api/grading-rounds/:id
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;

/**
 * API Endpoints
Method	URL	Mô tả
GET	/api/grading-rounds?round_name=&session_id=&faculty_scope_id=&status=&page=&pageSize=	Danh sách (phân trang + lọc)
GET	/api/grading-rounds/:id	Chi tiết 1 vòng
POST	/api/grading-rounds	Tạo mới
PUT	/api/grading-rounds/:id	Cập nhật
DELETE	/api/grading-rounds/:id	Xóa
Điểm nghiệp vụ đã xử lý
Cấu trúc phân cấp: assessment_sessions → grading_rounds → grading_groups → grading_group_members
Validate enum: status ∈ forming|active|finalizing|closed
Validate FK: kiểm tra tồn tại session_id, faculty_scope_id, parent_round_id (và chặn parent_round_id trỏ chính nó)
created_by lấy từ req.user.id (giống cách assigned_by ở course-lecturer)
Mốc thời gian tự động: chuyển sang active → set started_at; sang closed → set closed_at
Chặn xóa nếu vòng đã có nhóm chấm hoặc vòng con (phúc khảo)
Trả về kèm thông tin session, facultyScope, parentRound qua include
 */