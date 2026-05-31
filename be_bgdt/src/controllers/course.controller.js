const courseService = require('../services/course.service');
const { assertDepartmentHead, assertHeadOwnsFaculty, resolveHeadFaculty } = require('../helpers/departmentHead');

// lấy danh sách môn học, phân trang, tìm mã môn học hoặc tên môn học
const list = async (req, res) => {
    try {
        const { course_code, course_name, page, pageSize } = req.query;
        const result = await courseService.listCourses({ course_code, course_name, page, pageSize });
        return res.json({ 
            success: true, 
            message: `Đã tìm thấy ${result.total} môn học`,
            data: result });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const create = async (req, res) => {
    try {
        const payload = req.body || {};
        const course = await courseService.createCourse(payload);

        return res.status(201).json({
            success: true,
            message: 'Tạo môn học thành công',
            data: course,
        });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const importCourses = async (req, res) => {
    try {
        const records = req.body;
        if (!Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Cấu trúc Body phải là một mảng môn học' });
        }

        const { successCount, errorCount, errors } = await courseService.importCourses(records);

        return res.status(207).json({
            success: true,
            data: { total: records.length, successCount, errorCount, errors },
        });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await courseService.updateCourse(id, req.body || {});
        return res.json({ success: true, message: 'Cập nhật môn học thành công', data: course });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const remove = async (req, res) => {
    try {
        await courseService.deleteCourse(req.params.id);
        return res.json({ success: true, message: 'Xóa môn học thành công' });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const listByFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const userRoles = req.user?.roles || [];

        // department_head chỉ được xem khoa của mình
        if (!userRoles.includes('admin')) {
            await assertHeadOwnsFaculty(req.user.profile_id, facultyId);
        }

        const { course_code, course_name, page, pageSize } = req.query;
        const result = await courseService.listCoursesByFaculty(facultyId, { course_code, course_name, page, pageSize });
        return res.json({
            success: true,
            message: `Đã tìm thấy ${result.total} môn học của khoa ${result.faculty.faculty_name}`,
            data: result,
        });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const listMyFaculty = async (req, res) => {
    try {
        // Verify DB trực tiếp — JWT có thể còn hiệu lực sau khi thu quyền
        await assertDepartmentHead(req.user.id);
        const facultyId = await resolveHeadFaculty(req.user.profile_id);
        const { course_code, course_name, page, pageSize } = req.query;
        const result = await courseService.listCoursesByFaculty(facultyId, { course_code, course_name, page, pageSize });
        return res.json({
            success: true,
            message: `Đã tìm thấy ${result.total} môn học của khoa ${result.faculty.faculty_name}`,
            data: result,
        });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

const updateCountManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { count_manager } = req.body || {};
        if (count_manager === undefined)
            return res.status(400).json({ success: false, message: 'count_manager là bắt buộc' });
        const course = await courseService.updateCountManager(id, count_manager);
        return res.json({ success: true, message: 'Cập nhật giới hạn manager thành công', data: course });
    } catch (err) {
        console.error(err);
        return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

module.exports = {
    list,
    create,
    update,
    remove,
    listByFaculty,
    listMyFaculty,
    importCourses,
    updateCountManager,
};