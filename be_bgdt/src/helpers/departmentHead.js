const { Lecturer, Major, User, Role } = require('../models');

/**
 * Kiểm tra người dùng có role trưởng đơn vị (department_head) không — tra DB trực tiếp
 * để phản ánh ngay khi quyền bị thu hồi (không phụ thuộc JWT cũ).
 * Ném lỗi 403/404 nếu không hợp lệ.
 */
const assertDepartmentHead = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, through: { attributes: [] }, attributes: ['role_name'] }],
  });
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }
  const hasDeptHead = user.Roles.some((r) => r.role_name === 'department_head');
  if (!hasDeptHead) {
    const err = new Error('Chỉ trưởng khoa mới có quyền thực hiện thao tác này');
    err.statusCode = 403;
    throw err;
  }
};

/**
 * Lấy faculty_id của trưởng khoa.
 * Ném lỗi 404/422 nếu không tìm thấy hồ sơ hoặc chưa được gán khoa.
 */
const resolveHeadFaculty = async (lecturerId) => {
  const me = await Lecturer.findByPk(lecturerId, { attributes: ['id', 'faculty_id'] });
  if (!me) {
    const err = new Error('Không tìm thấy hồ sơ giảng viên');
    err.statusCode = 404;
    throw err;
  }
  if (!me.faculty_id) {
    const err = new Error('Tài khoản chưa được gán vào khoa nào');
    err.statusCode = 422;
    throw err;
  }
  return me.faculty_id;
};

/**
 * Kiểm tra chuyên ngành tồn tại và thuộc đúng khoa.
 * Ném lỗi 404/403 nếu không hợp lệ.
 * Trả về bản ghi Major nếu hợp lệ.
 */
const assertMajorInFaculty = async (majorId, facultyId) => {
  const major = await Major.findByPk(majorId, {
    attributes: ['id', 'major_name', 'faculty_id', 'is_lock'],
  });
  if (!major) {
    const err = new Error('Không tìm thấy chuyên ngành');
    err.statusCode = 404;
    throw err;
  }
  if (String(major.faculty_id) !== String(facultyId)) {
    const err = new Error('Chuyên ngành không thuộc khoa của bạn');
    err.statusCode = 403;
    throw err;
  }
  return major;
};

/**
 * Kiểm tra trưởng khoa có thuộc đúng khoa được yêu cầu không.
 * Dùng cho các endpoint mà department_head chỉ được thao tác trên khoa mình.
 * Ném lỗi 403/404/422 nếu không hợp lệ.
 */
const assertHeadOwnsFaculty = async (lecturerId, facultyId) => {
  const headFacultyId = await resolveHeadFaculty(lecturerId);
  if (String(headFacultyId) !== String(facultyId)) {
    const err = new Error('Bạn không có quyền truy cập dữ liệu của khoa này');
    err.statusCode = 403;
    throw err;
  }
};

module.exports = { assertDepartmentHead, resolveHeadFaculty, assertMajorInFaculty, assertHeadOwnsFaculty };
