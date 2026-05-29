const service = require('../services/academicDegree.service');

const list = async (req, res) => {
  try {
    const data = await service.listDegrees();
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const create = async (req, res) => {
  try {
    const degree = await service.createDegree(req.body || {});
    return res.status(201).json({ success: true, message: 'Thêm học vị thành công', data: degree });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const remove = async (req, res) => {
  try {
    await service.deleteDegree(req.params.id);
    return res.json({ success: true, message: 'Xóa học vị thành công' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { list, create, remove };
