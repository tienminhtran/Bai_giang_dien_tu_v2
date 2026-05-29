const { AcademicDegree } = require('../models');

const listDegrees = async () => {
  return AcademicDegree.findAll({ order: [['degree_name', 'ASC']] });
};

const createDegree = async ({ degree_name }) => {
  if (!degree_name || !String(degree_name).trim()) {
    const err = new Error('degree_name là bắt buộc');
    err.statusCode = 400;
    throw err;
  }

  const name = String(degree_name).trim();
  const existing = await AcademicDegree.findOne({ where: { degree_name: name } });
  if (existing) {
    const err = new Error('Học vị đã tồn tại');
    err.statusCode = 409;
    throw err;
  }

  return AcademicDegree.create({ degree_name: name });
};

const deleteDegree = async (id) => {
  const degree = await AcademicDegree.findByPk(id);
  if (!degree) {
    const err = new Error('Không tìm thấy học vị');
    err.statusCode = 404;
    throw err;
  }

  await AcademicDegree.destroy({ where: { id } });
  return { success: true };
};

module.exports = { listDegrees, createDegree, deleteDegree };
