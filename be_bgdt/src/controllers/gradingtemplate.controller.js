const templateService = require('../services/gradingtemplate.service');

// GET /api/grading-criteria-templates?activeOnly=true
const list = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const rows = await templateService.listTemplates({ activeOnly });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list };
