const courseService = require('../services/course.service');

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

module.exports = {
    list,
    create,
    update,
    remove,
    importCourses,
};