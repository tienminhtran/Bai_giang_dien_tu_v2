const { Op } = require('sequelize');
const { sequelize, Lecturer, User, Role, UserRole, Faculty } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách giảng viên kèm vai trò của họ, có tìm kiếm và phân trang
 * @param {*} param0 
 * @returns 
 */

const listLecturerRoles = async ({ lecturer_code, full_name, page = 1, pageSize = 20 }) => {
  const where = {};
  if (lecturer_code) where.lecturer_code = { [Op.like]: `%${lecturer_code}%` };
  if (full_name)     where.full_name     = { [Op.like]: `%${full_name}%` };

  const limit  = Number(pageSize) || 20;
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    Lecturer.count({ where }),
    Lecturer.findAll({
      where,
      limit,
      offset,
      order: [['lecturer_code', 'ASC']],
      include: [
        {
          model: User,
          attributes: ['id'],
          include: [{
            model: Role,
            through: { attributes: [] },
            attributes: ['id', 'role_name', 'description'],
          }],
        },
        { model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
      ],
    }),
  ]);

  const data = rows.map((l) => ({
    id:            l.id,
    user_id:       l.user_id,
    lecturer_code: l.lecturer_code,
    full_name:     l.full_name,
    email:         l.email,
    faculty_id:    l.faculty_id,
    faculty_name:  l.faculty?.faculty_name ?? null,
    is_active:     l.is_active,
    roles:         l.User?.Roles ?? [],
  }));

  return { total, rows: data };
};

const listAllRoles = async () => Role.findAll({ order: [['role_name', 'ASC']] });


/**
 * Cập nhật vai trò cho giảng viên
 * @param {*} lecturerId 
 * @param {*} roleIds 
 * @returns 
 */
const updateLecturerRoles = async (lecturerId, roleIds) => {
  if (!Array.isArray(roleIds))
    throw ApiError.badRequest('roleIds phải là một mảng');

  const lecturer = await Lecturer.findByPk(lecturerId);
  if (!lecturer) throw ApiError.notFound('Không tìm thấy giảng viên');

  if (roleIds.length > 0) {
    const found = await Role.count({ where: { id: roleIds } });
    if (found !== roleIds.length)
      throw ApiError.badRequest('Một hoặc nhiều role_id không hợp lệ');
  }

  await sequelize.transaction(async (t) => {
    await UserRole.destroy({ where: { user_id: lecturer.user_id }, transaction: t });
    if (roleIds.length > 0) {
      await UserRole.bulkCreate(
        roleIds.map((role_id) => ({ user_id: lecturer.user_id, role_id })),
        { transaction: t },
      );
    }
  });

  const updated = await Lecturer.findByPk(lecturerId, {
    include: [{
      model: User,
      attributes: ['id'],
      include: [{
        model: Role,
        through: { attributes: [] },
        attributes: ['id', 'role_name', 'description'],
      }],
    }],
  });

  return {
    id:            updated.id,
    user_id:       updated.user_id,
    lecturer_code: updated.lecturer_code,
    full_name:     updated.full_name,
    roles:         updated.User?.Roles ?? [],
  };
};

module.exports = { listLecturerRoles, listAllRoles, updateLecturerRoles };
