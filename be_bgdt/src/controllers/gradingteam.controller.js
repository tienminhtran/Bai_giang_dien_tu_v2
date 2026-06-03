const teamService = require('../services/gradingteam.service');

const handleError = (res, err) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
};

// GET /api/grading-teams?round_id=&only_unassigned=
const list = async (req, res) => {
  try {
    const { round_id, only_unassigned } = req.query;
    const teams = await teamService.listTeams({
      round_id,
      onlyUnassigned: only_unassigned === 'true' || only_unassigned === '1',
    });
    return res.json({ success: true, data: teams });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/grading-teams/:id
const getOne = async (req, res) => {
  try {
    const team = await teamService.getTeam(req.params.id);
    return res.json({ success: true, data: team });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-teams
const create = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo nhóm chấm thành công', data: team });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-teams/:id/assign  { group_id }
const assign = async (req, res) => {
  try {
    const team = await teamService.assignTeamToGroup(req.params.id, (req.body || {}).group_id);
    return res.json({ success: true, message: 'Phân công nhóm vào hội đồng thành công', data: team });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/grading-teams/:id/unassign
const unassign = async (req, res) => {
  try {
    const team = await teamService.unassignTeam(req.params.id);
    return res.json({ success: true, message: 'Đã gỡ gán nhóm', data: team });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/grading-teams/:id
const remove = async (req, res) => {
  try {
    await teamService.deleteTeam(req.params.id);
    return res.json({ success: true, message: 'Xóa nhóm chấm thành công' });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = { list, getOne, create, assign, unassign, remove };
