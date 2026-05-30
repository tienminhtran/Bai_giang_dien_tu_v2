
// hàm kiểm tra nếu chuyên ngành đã khóa thì không cho phép chỉnh sửa (dành cho trưởng khoa)
const checkLocked = (major) => {
  if (major.isLock) {
    const err = new Error('Chuyên ngành đã bị khóa, không thể chỉnh sửa. Vui lòng liên hệ admin để được hỗ trợ.');
    err.statusCode = 403;
    throw err;
  }
};

// hàm kiểm tra chuyên ngành có thuộc khoa chỉ định không
const checkMajorBelongsToFaculty = (major, facultyId) => {
  if (String(major.faculty_id) !== String(facultyId)) {
    const err = new Error('Chuyên ngành không thuộc khoa này');
    err.statusCode = 403;
    throw err;
  }
};

module.exports = { checkLocked, checkMajorBelongsToFaculty };

