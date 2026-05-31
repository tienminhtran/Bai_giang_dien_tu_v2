const { Op } = require('sequelize');
const { sequelize, Course, Faculty } = require('../models');
const ApiError = require('../utils/ApiError');
const { checkSingleFaculty } = require('../helpers/courseHelpers');

const listCourses = async ({ course_code, course_name, page = 1, pageSize = 20 }) => {
    const where = {};
    if (course_code) where.course_code = { [Op.like]: `%${course_code}%` };
    if (course_name) where.course_name = { [Op.like]: `%${course_name}%` };

    const limit  = Number(pageSize) || 20;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const [total, rows] = await Promise.all([
        Course.count({ where }),
        Course.findAll({
            where, limit, offset,
            order: [['created_at', 'DESC']],
            include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
        }),
    ]);
    return { total, rows };
};

const normalizeCoursePayload = (payload = {}) => ({
    course_code:  payload.course_code  == null ? '' : String(payload.course_code).trim(),
    course_name:  payload.course_name  == null ? '' : String(payload.course_name).trim(),
    credits:      payload.credits == null || payload.credits === '' ? null : Number(payload.credits),
    description:  payload.description  == null || payload.description === '' ? null : String(payload.description).trim(),
    faculty_id:   payload.faculty_id == null || payload.faculty_id === '' ? null : String(payload.faculty_id).trim(),
    is_active:    payload.is_active === undefined ? true : Boolean(payload.is_active),
});

const createCourse = async (payload = {}) => {
    const data = normalizeCoursePayload(payload);

    if (!data.course_code || !data.course_name)
        throw ApiError.badRequest('course_code và course_name là bắt buộc');

    if (data.credits !== null && Number.isNaN(data.credits))
        throw ApiError.badRequest('credits không hợp lệ');

    const existed = await Course.findOne({ where: { course_code: data.course_code } });
    if (existed) {
        checkSingleFaculty(existed, data.faculty_id);
        throw ApiError.conflict('Mã môn học đã tồn tại');
    }

    return Course.create({
        course_code:  data.course_code,
        course_name:  data.course_name,
        credits:      data.credits,
        description:  data.description,
        faculty_id:   data.faculty_id,
        is_active:    data.is_active,
    });
};

const importCourses = async (records) => {
    if (!Array.isArray(records) || records.length === 0)
        throw ApiError.badRequest('Danh sách môn học không hợp lệ hoặc rỗng');

    let successCount = 0;
    const errors = [];
    const seenCodes = new Set();

    for (let i = 0; i < records.length; i++) {
        const record     = records[i] || {};
        const normalized = normalizeCoursePayload(record);
        try {
            if (!normalized.course_code || !normalized.course_name)
                throw ApiError.badRequest('course_code và course_name là bắt buộc');

            if (normalized.credits !== null && Number.isNaN(normalized.credits))
                throw ApiError.badRequest('credits không hợp lệ');

            if (seenCodes.has(normalized.course_code))
                throw ApiError.conflict('Mã môn học bị trùng trong file import', 'DUPLICATE_IN_FILE');

            const existed = await Course.findOne({ where: { course_code: normalized.course_code } });
            if (existed) {
                checkSingleFaculty(existed, normalized.faculty_id);
                throw ApiError.conflict('Mã môn học đã tồn tại', 'DUPLICATE_IN_DATABASE');
            }

            await Course.create({
                course_code:  normalized.course_code,
                course_name:  normalized.course_name,
                credits:      normalized.credits,
                description:  normalized.description,
                faculty_id:   normalized.faculty_id,
                is_active:    normalized.is_active,
            });

            seenCodes.add(normalized.course_code);
            successCount++;
        } catch (err) {
            errors.push({
                row:         i + 1,
                course_code: normalized.course_code || record.course_code || null,
                type:        err.errorType || (err.statusCode === 409 ? 'Mã môn học đã tồn tại' : 'Lỗi dữ liệu'),
                message:     err.message || 'Lỗi không xác định',
            });
        }
    }

    return { total: records.length, successCount, errorCount: errors.length, errors };
};

const updateCourse = async (id, payload = {}) => {
    const course = await Course.findByPk(id);
    if (!course) throw ApiError.notFound('Không tìm thấy môn học');

    const data = normalizeCoursePayload({ ...course.toJSON(), ...payload });

    if (!data.course_code || !data.course_name)
        throw ApiError.badRequest('course_code và course_name là bắt buộc');

    if (data.credits !== null && Number.isNaN(data.credits))
        throw ApiError.badRequest('credits không hợp lệ');

    // kiểm tra trùng mã nếu đổi course_code
    if (data.course_code !== course.course_code) {
        const dup = await Course.findOne({ where: { course_code: data.course_code } });
        if (dup) throw ApiError.conflict('Mã môn học đã tồn tại');
    }

    // kiểm tra 1 môn học chỉ thuộc 1 khoa
    if (data.faculty_id && course.faculty_id && String(data.faculty_id) !== String(course.faculty_id)) {
        checkSingleFaculty(course, data.faculty_id);
    }

    await course.update({
        course_code: data.course_code,
        course_name: data.course_name,
        credits:     data.credits,
        description: data.description,
        faculty_id:  data.faculty_id,
        is_active:   data.is_active,
    });

    return Course.findByPk(id, {
        include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
    });
};

const deleteCourse = async (id) => {
    const course = await Course.findByPk(id);
    if (!course) throw ApiError.notFound('Không tìm thấy môn học');
    await course.destroy();
};

const updateCountManager = async (id, count_manager) => {
    const course = await Course.findByPk(id);
    if (!course) throw ApiError.notFound('Không tìm thấy môn học');

    const val = Number(count_manager);
    if (!Number.isInteger(val) || val < 1)
        throw ApiError.badRequest('count_manager phải là số nguyên >= 1');

    await course.update({ count_manager: val });
    return Course.findByPk(id, {
        include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
    });
};

const listCoursesByFaculty = async (facultyId, { course_code, course_name, page = 1, pageSize = 20 }) => {
    const faculty = await Faculty.findByPk(facultyId, { attributes: ['id', 'faculty_name'] });
    if (!faculty) throw ApiError.notFound('Không tìm thấy khoa');

    const where = { faculty_id: facultyId };
    if (course_code) where.course_code = { [Op.like]: `%${course_code}%` };
    if (course_name) where.course_name = { [Op.like]: `%${course_name}%` };

    const limit  = Number(pageSize) || 20;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const [total, rows] = await Promise.all([
        Course.count({ where }),
        Course.findAll({
            where, limit, offset,
            order: [['course_name', 'ASC']],
            include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] }],
        }),
    ]);

    return { faculty, total, rows };
};

module.exports = { listCourses, createCourse, updateCourse, deleteCourse, importCourses, listCoursesByFaculty, updateCountManager };
