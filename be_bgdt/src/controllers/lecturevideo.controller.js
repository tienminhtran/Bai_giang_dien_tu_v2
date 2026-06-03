const videoService = require('../services/lecturevideo.service');

const handleError = (res, err) => {
  console.error(err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi server' });
};

// GET /api/lecture-videos?course_id=&section_id=
const list = async (req, res) => {
  try {
    const videos = await videoService.listByCourse(req.query.course_id, { sectionId: req.query.section_id });
    return res.json({ success: true, data: videos });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/lecture-videos/:id
const getOne = async (req, res) => {
  try {
    const video = await videoService.getVideo(req.params.id);
    return res.json({ success: true, data: video });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/lecture-videos/:id/stream/:version/:file  → stream HLS (.m3u8 / .ts)
const stream = async (req, res) => {
  try {
    const { stream: objStream, contentType } = await videoService.getHlsObjectStream(
      req.params.id, req.params.version, req.params.file,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    objStream.on('error', () => { if (!res.headersSent) res.status(500).end(); else res.destroy(); });
    objStream.pipe(res);
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/lecture-videos  (multipart/form-data, field "video")
// Bước 1 — Admin upload: tạo lecture_videos + lecture_video_versions (initial), status='registered'
const create = async (req, res) => {
  try {
    const video = await videoService.createInitialVideo(req.body || {}, req.file, req.user?.id);
    return res.status(201).json({ success: true, message: 'Đăng ký video thành công', data: video });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = { list, getOne, stream, create };
