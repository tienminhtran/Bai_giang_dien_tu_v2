const { Op } = require('sequelize');
const { sequelize, Course } = require('../models');
const ApiError = require('../utils/ApiError');

const listCourses = async ({ course_code, course_name, page = 1, pageSize = 20 }) => {
    const where = {};
    if (course_code) where.course_code = { [Op.like]: `%${course_code}%` };
    if (course_name) where.course_name = { [Op.like]: `%${course_name}%` };

    const limit  = Number(pageSize) || 20;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const [total, rows] = await Promise.all([
        Course.count({ where }),
        Course.findAll({ where, limit, offset, order: [['created_at', 'DESC']] }),
    ]);
    return { total, rows };
};

const normalizeCoursePayload = (payload = {}) => ({
    course_code:  payload.course_code  == null ? '' : String(payload.course_code).trim(),
    course_name:  payload.course_name  == null ? '' : String(payload.course_name).trim(),
    credits:      payload.credits == null || payload.credits === '' ? null : Number(payload.credits),
    description:  payload.description  == null || payload.description === '' ? null : String(payload.description).trim(),
    is_active:    payload.is_active === undefined ? true : Boolean(payload.is_active),
});

const createCourse = async (payload = {}) => {
    const data = normalizeCoursePayload(payload);

    if (!data.course_code || !data.course_name)
        throw ApiError.badRequest('course_code và course_name là bắt buộc');

    if (data.credits !== null && Number.isNaN(data.credits))
        throw ApiError.badRequest('credits không hợp lệ');

    const existed = await Course.findOne({ where: { course_code: data.course_code } });
    if (existed) throw ApiError.conflict('Mã môn học đã tồn tại');

    return Course.create({
        course_code:  data.course_code,
        course_name:  data.course_name,
        credits:      data.credits,
        description:  data.description,
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
            if (existed)
                throw ApiError.conflict('Mã môn học đã tồn tại', 'DUPLICATE_IN_DATABASE');

            await Course.create({
                course_code:  normalized.course_code,
                course_name:  normalized.course_name,
                credits:      normalized.credits,
                description:  normalized.description,
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

    return { successCount, errorCount: errors.length, errors };
};

module.exports = { listCourses, createCourse, importCourses };
