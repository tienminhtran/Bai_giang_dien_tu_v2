const termService = require('../services/academicterm.service');

const list = async (req, res) => {
  try {
    const { academic_year, semester, is_active, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await termService.listTerms({ academic_year, semester, is_active, page: pageNum, pageSize: size });
    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const create = async (req, res) => {
  try {
    const term = await termService.createTerm(req.body || {});
    return res.status(201).json({ success: true, message: 'Tạo học kỳ thành công', data: term });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const term = await termService.updateTerm(id, req.body || {});
    return res.json({ success: true, message: 'Cập nhật học kỳ thành công', data: term });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, create, update };
