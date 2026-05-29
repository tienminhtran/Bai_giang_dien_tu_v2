const userRoleService = require('../services/userrole.service');

const listLecturerRoles = async (req, res) => {
  try {
    const { lecturer_code, full_name, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const size    = Math.max(Number(pageSize) || 20, 1);

    const { total, rows } = await userRoleService.listLecturerRoles({
      lecturer_code, full_name, page: pageNum, pageSize: size,
    });

    return res.json({ success: true, data: rows, total, page: pageNum, pageSize: size });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const listAllRoles = async (req, res) => {
  try {
    const roles = await userRoleService.listAllRoles();
    return res.json({ success: true, data: roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

const updateLecturerRoles = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { roleIds } = req.body;

    const updated = await userRoleService.updateLecturerRoles(lecturerId, roleIds ?? []);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

module.exports = { listLecturerRoles, listAllRoles, updateLecturerRoles };
