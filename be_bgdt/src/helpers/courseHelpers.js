
// Kiểm tra môn học chỉ thuộc 1 khoa chủ quản
// Nếu course đã có faculty_id khác với newFacultyId → từ chối
const checkSingleFaculty = (existingCourse, newFacultyId) => {
  if (
    existingCourse.faculty_id &&
    newFacultyId &&
    String(existingCourse.faculty_id) !== String(newFacultyId)
  ) {
    const err = new Error('Môn học đã thuộc khoa khác, không thể gán vào nhiều khoa chủ quản');
    err.statusCode = 409;
    throw err;
  }
};

module.exports = { checkSingleFaculty };
