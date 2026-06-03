const express = require('express');
const multer  = require('multer');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/lecturevideo.controller');

// Nhận file video vào RAM (buffer) rồi đẩy lên MinIO
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.VIDEO_MAX_SIZE, 10) || 1024) * 1024 * 1024 }, // mặc định 1GB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`), false);
  },
});

// GET /api/lecture-videos?course_id=&section_id=
router.get('/', authenticate, authorize('admin'), ctrl.list);

// GET /api/lecture-videos/:id/stream/:version/:file  → HLS (.m3u8 / .ts)
router.get('/:id/stream/:version/:file', authenticate, authorize('admin'), ctrl.stream);

// GET /api/lecture-videos/:id
router.get('/:id', authenticate, authorize('admin'), ctrl.getOne);

// POST /api/lecture-videos   (multipart/form-data)
// Fields: section_id, title, description?, video_order?, change_note?  (chủ sở hữu = user token)
// File:   video
router.post('/', authenticate, authorize('admin'), uploadVideo.single('video'), ctrl.create);

module.exports = router;
