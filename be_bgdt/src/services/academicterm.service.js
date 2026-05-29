const { Op } = require('sequelize');
const { AcademicTerm } = require('../models');
const ApiError = require('../utils/ApiError');

const VALID_SEMESTERS = [1, 2, 3];

const normalizeYear = (raw) => String(raw || '').replace(/\s*-\s*/g, '-').trim();

const normalizePayload = (payload = {}) => ({
  academic_year: normalizeYear(payload.academic_year),
  semester:      payload.semester == null ? null : Number(payload.semester),
  start_date:    payload.start_date  || null,
  end_date:      payload.end_date    || null,
  is_active:     payload.is_active === undefined ? true : Boolean(payload.is_active),
});

const listTerms = async ({ academic_year, semester, is_active, page = 1, pageSize = 20 }) => {
  const where = {};
  if (academic_year) where.academic_year = { [Op.like]: `%${normalizeYear(academic_year)}%` };
  if (semester)      where.semester      = Number(semester);
  if (is_active !== undefined && is_active !== '') where.is_active = is_active === 'true' || is_active === true;

  const limit  = Math.max(Number(pageSize) || 20, 1);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [total, rows] = await Promise.all([
    AcademicTerm.count({ where }),
    AcademicTerm.findAll({ where, limit, offset, order: [['is_active', 'DESC'], ['academic_year', 'DESC'], ['semester', 'ASC']] }),
  ]);

  return { total, rows };
};

const createTerm = async (payload = {}) => {
  const data = normalizePayload(payload);

  if (!data.academic_year)
    throw ApiError.badRequest('academic_year là bắt buộc (VD: 2025-2026)');
  if (!VALID_SEMESTERS.includes(data.semester))
    throw ApiError.badRequest('semester phải là 1, 2 hoặc 3');

  const existed = await AcademicTerm.findOne({ where: { academic_year: data.academic_year, semester: data.semester } });
  if (existed) throw ApiError.conflict(`Học kỳ ${data.semester} năm học ${data.academic_year} đã tồn tại`);

  return AcademicTerm.create(data);
};

const updateTerm = async (id, payload = {}) => {
  const term = await AcademicTerm.findByPk(id);
  if (!term) throw ApiError.notFound('Không tìm thấy học kỳ');

  const data = normalizePayload({ ...term.toJSON(), ...payload });

  if (!data.academic_year)
    throw ApiError.badRequest('academic_year là bắt buộc');
  if (!VALID_SEMESTERS.includes(data.semester))
    throw ApiError.badRequest('semester phải là 1, 2 hoặc 3');

  // Kiểm tra trùng nếu thay đổi academic_year hoặc semester
  if (data.academic_year !== term.academic_year || data.semester !== term.semester) {
    const conflict = await AcademicTerm.findOne({ where: { academic_year: data.academic_year, semester: data.semester } });
    if (conflict) throw ApiError.conflict(`Học kỳ ${data.semester} năm học ${data.academic_year} đã tồn tại`);
  }

  await term.update(data);
  return term;
};

module.exports = { listTerms, createTerm, updateTerm };
