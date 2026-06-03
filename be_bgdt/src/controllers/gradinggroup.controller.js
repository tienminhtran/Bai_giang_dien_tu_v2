const groupService = require('../services/gradinggroup.service');

const handleError = (res, err) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
};

// GET /api/grading-groups?round_id=&faculty_id=&status=&page=&pageSize=
const list = async (req, res) => {
  try {
    const { round_id, faculty_id, status, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await groupService.listGroups({
      round_id, faculty_id, status,
      page: pageNum, pageSize: size,
    });
    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/grading-groups/:id
const getOne = async (req, res) => {
  try {
    const group = await groupService.getGroup(req.params.id);
    return res.json({ success: true, data: group });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/grading-groups/round/:roundId/setup
// Trả về: nhóm (kèm thành viên) + giảng viên + khoa theo 1 vòng chấm
const roundSetup = async (req, res) => {
  try {
    const data = await groupService.getRoundSetup(req.params.roundId);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-groups/bulk  — tạo nhóm theo nhiều khoa
const bulkCreate = async (req, res) => {
  try {
    const data = await groupService.createGroupsByFaculties(req.body || {}, req.user?.id);
    const msg = data.skipped.length
      ? `Đã tạo ${data.createdCount} nhóm. Bỏ qua ${data.skipped.length} khoa đã có nhóm: ${data.skipped.join(', ')}`
      : `Đã tạo ${data.createdCount} nhóm chấm`;
    return res.status(201).json({ success: true, message: msg, data });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-groups
const create = async (req, res) => {
  try {
    const group = await groupService.createGroup(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo nhóm chấm thành công', data: group });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /api/grading-groups/:id
const update = async (req, res) => {
  try {
    const group = await groupService.updateGroup(req.params.id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật nhóm chấm thành công', data: group });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/grading-groups/:id
const remove = async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id);
    return res.json({ success: true, message: 'Xóa nhóm chấm thành công' });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-groups/:id/members
const addMember = async (req, res) => {
  try {
    const group = await groupService.addMember(req.params.id, req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Thêm thành viên thành công', data: group });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/grading-groups/:id/members/:memberId
const removeMember = async (req, res) => {
  try {
    const group = await groupService.removeMember(req.params.id, req.params.memberId);
    return res.json({ success: true, message: 'Xóa thành viên thành công', data: group });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = { list, getOne, roundSetup, create, bulkCreate, update, remove, addMember, removeMember };
