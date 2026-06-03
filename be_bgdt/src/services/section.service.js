const {
  CourseSection,
  Course,
  LectureVideo,
} = require('../models');
const ApiError = require('../utils/ApiError');

// ── Danh sách phần (section) của 1 môn học ─────────────────────────────────
//   Kèm số lượng video trong mỗi phần để hiển thị.
const listByCourse = async (courseId) => {
  if (!courseId) throw ApiError.badRequest('course_id là bắt buộc');

  const sections = await CourseSection.findAll({
    where: { course_id: courseId },
    order: [['section_order', 'ASC'], ['created_at', 'ASC']],
  });

  // Đếm video theo từng section (1 query gom nhóm)
  const counts = await LectureVideo.findAll({
    attributes: [
      'section_id',
      [LectureVideo.sequelize.fn('COUNT', LectureVideo.sequelize.col('id')), 'video_count'],
    ],
    where: { section_id: sections.map((s) => s.id) },
    group: ['section_id'],
    raw: true,
  });
  const countMap = counts.reduce((acc, c) => { acc[String(c.section_id)] = Number(c.video_count) || 0; return acc; }, {});

  return sections.map((s) => ({ ...s.toJSON(), video_count: countMap[String(s.id)] || 0 }));
};

const getSection = async (id) => {
  const section = await CourseSection.findByPk(id);
  if (!section) throw ApiError.notFound('Không tìm thấy phần (section)');
  return section;
};

// ── Tạo phần ───────────────────────────────────────────────────────────────
const createSection = async (payload = {}, createdByUserId) => {
  const courseId = payload.course_id == null || payload.course_id === '' ? null : String(payload.course_id).trim();
  const title    = payload.section_title == null ? '' : String(payload.section_title).trim();
  const description = payload.description == null || payload.description === '' ? null : String(payload.description).trim();
  const orderRaw = payload.section_order;

  if (!courseId) throw ApiError.badRequest('course_id là bắt buộc');
  if (!title)    throw ApiError.badRequest('section_title là bắt buộc');

  const course = await Course.findByPk(courseId, { attributes: ['id'] });
  if (!course) throw ApiError.notFound('Không tìm thấy môn học (course_id)');

  // section_order: không truyền thì lấy max + 1 trong môn
  let order = orderRaw == null || orderRaw === '' ? null : parseInt(orderRaw, 10);
  if (order == null || Number.isNaN(order)) {
    const maxOrder = await CourseSection.max('section_order', { where: { course_id: courseId } });
    order = (maxOrder || 0) + 1;
  }

  const section = await CourseSection.create({
    course_id:     courseId,
    section_title: title,
    description,
    section_order: order,
    is_active:     true,
    created_by:    createdByUserId,
  });
  return getSection(section.id);
};

// ── Cập nhật phần ──────────────────────────────────────────────────────────
const updateSection = async (id, payload = {}) => {
  const section = await getSection(id);

  const patch = {};
  if (payload.section_title != null) {
    const t = String(payload.section_title).trim();
    if (!t) throw ApiError.badRequest('section_title không được rỗng');
    patch.section_title = t;
  }
  if (payload.description !== undefined)
    patch.description = payload.description == null || payload.description === '' ? null : String(payload.description).trim();
  if (payload.section_order !== undefined && payload.section_order !== '' && payload.section_order != null) {
    const o = parseInt(payload.section_order, 10);
    if (!Number.isNaN(o)) patch.section_order = o;
  }
  if (payload.is_active !== undefined) patch.is_active = Boolean(payload.is_active);

  await section.update(patch);
  return getSection(id);
};

// ── Xóa phần (chỉ khi chưa có video) ───────────────────────────────────────
const deleteSection = async (id) => {
  const section = await getSection(id);
  const videoCount = await LectureVideo.count({ where: { section_id: id } });
  if (videoCount > 0) throw ApiError.badRequest('Phần đang có video, không thể xóa');
  await CourseSection.destroy({ where: { id } });
};

module.exports = { listByCourse, getSection, createSection, updateSection, deleteSection };
