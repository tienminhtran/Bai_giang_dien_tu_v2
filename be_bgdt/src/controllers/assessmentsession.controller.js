const sessionService = require('../services/assessmentsession.service');

// GET /api/assessment-sessions?session_name=&academic_term_id=&status=&page=&pageSize=
const list = async (req, res) => {
  try {
    const { session_name, academic_term_id, status, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await sessionService.listSessions({
      session_name, academic_term_id, status,
      page: pageNum, pageSize: size,
    });
    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// GET /api/assessment-sessions/:id
const getOne = async (req, res) => {
  try {
    const session = await sessionService.getSession(req.params.id);
    return res.json({ success: true, data: session });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// POST /api/assessment-sessions
const create = async (req, res) => {
  try {
    const session = await sessionService.createSession(req.body || {}, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo đợt kiểm định thành công', data: session });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// PUT /api/assessment-sessions/:id
const update = async (req, res) => {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật đợt kiểm định thành công', data: session });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// DELETE /api/assessment-sessions/:id
const remove = async (req, res) => {
  try {
    await sessionService.deleteSession(req.params.id);
    return res.json({ success: true, message: 'Xóa đợt kiểm định thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, getOne, create, update, remove };
