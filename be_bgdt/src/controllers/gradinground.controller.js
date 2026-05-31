const roundService = require('../services/gradinground.service');

// GET /api/grading-rounds?round_name=&course_id=&council_type=&status=&page=&pageSize=
const list = async (req, res) => {
  try {
    const { round_name, course_id, council_type, status, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await roundService.listRounds({
      round_name, course_id, council_type, status,
      page: pageNum, pageSize: size,
    });
    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// GET /api/grading-rounds/:id
const getOne = async (req, res) => {
  try {
    const round = await roundService.getRound(req.params.id);
    return res.json({ success: true, data: round });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/grading-rounds
const create = async (req, res) => {
  try {
    const round = await roundService.createRound(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo đợt kiểm định thành công', data: round });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PUT /api/grading-rounds/:id
const update = async (req, res) => {
  try {
    const round = await roundService.updateRound(req.params.id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật đợt kiểm định thành công', data: round });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// DELETE /api/grading-rounds/:id
const remove = async (req, res) => {
  try {
    await roundService.deleteRound(req.params.id);
    return res.json({ success: true, message: 'Xóa đợt kiểm định thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, getOne, create, update, remove };
