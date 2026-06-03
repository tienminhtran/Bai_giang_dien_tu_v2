const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  LectureVideo,
  LectureVideoVersion,
  CourseSection,
  Lecturer,
} = require('../models');
const { minioClient, BUCKETS, putObject, fPutObject, removeObject, removePrefix } = require('../config/minio');
const { transcodeToHls, hlsContentType } = require('./transcode.service');
const ApiError = require('../utils/ApiError');

const VIDEO_INCLUDE = [
  { model: CourseSection, attributes: ['id', 'section_title', 'course_id'], required: false },
  { model: Lecturer, as: 'uploader', attributes: ['id', 'lecturer_code', 'full_name'], required: false },
  { model: LectureVideoVersion, attributes: { exclude: [] }, required: false },
];

const getVideo = async (id) => {
  const video = await LectureVideo.findByPk(id, { include: VIDEO_INCLUDE });
  if (!video) throw ApiError.notFound('Không tìm thấy video bài giảng');
  return video;
};

// ── Danh sách video bài giảng của 1 môn học (gom qua các section) ────────────
const listByCourse = async (courseId, { sectionId } = {}) => {
  if (!courseId) throw ApiError.badRequest('course_id là bắt buộc');

  const sectionWhere = { course_id: courseId };
  if (sectionId) sectionWhere.id = sectionId;

  return LectureVideo.findAll({
    include: [
      { model: CourseSection, attributes: ['id', 'section_title', 'section_order', 'course_id'], where: sectionWhere, required: true },
      { model: Lecturer, as: 'uploader', attributes: ['id', 'lecturer_code', 'full_name'], required: false },
      { model: LectureVideoVersion, required: false },
    ],
    order: [
      [CourseSection, 'section_order', 'ASC'],
      ['video_order', 'ASC'],
    ],
  });
};

// ── Lấy stream 1 file HLS (.m3u8 / .ts) từ videos-versions để phục vụ xem ──────
//   key = {video_id}/v{version}/{file}. Chặn path traversal ở file.
const getHlsObjectStream = async (videoId, version, file) => {
  if (!/^[\w.\-]+$/.test(String(file || ''))) throw ApiError.badRequest('Tên file không hợp lệ');
  const v = parseInt(version, 10);
  if (Number.isNaN(v) || v < 1) throw ApiError.badRequest('version không hợp lệ');

  const video = await LectureVideo.findByPk(videoId, { attributes: ['id'] });
  if (!video) throw ApiError.notFound('Không tìm thấy video bài giảng');

  // Object key trong MinIO luôn là uuid chữ thường (uuidv4), trong khi SQL Server
  // trả uniqueidentifier dạng CHỮ HOA → phải hạ chữ thường để khớp.
  const key = `${String(videoId).toLowerCase()}/v${v}/${file}`;
  const stat = await minioClient.statObject(BUCKETS.VERSIONS, key).catch(() => null);
  if (!stat) throw ApiError.notFound('Không tìm thấy file HLS');

  const stream = await minioClient.getObject(BUCKETS.VERSIONS, key);
  return { stream, size: stat.size, contentType: hlsContentType(file) };
};

// ── Bước 1: Admin upload — tạo lecture_videos + lecture_video_versions (initial) ──
//   Trạng thái video: 'registered'. Phiên bản đầu: version_number=1, version_type='initial'.
//   File gốc được lưu 2 nơi:
//     - videos-raw/{video_id}/original.ext              → bản pristine, nguồn re-encode (video_url_backup)
//     - videos-versions/{video_id}/v1/index.m3u8 + *.ts → HLS đã cắt segment, video_url trỏ vào index.m3u8
//   Không xóa version cũ để truy vết lịch sử duyệt.
//
//   Giảng viên sở hữu (lecture_videos.uploaded_by → lecturers) được suy ra từ
//   user đang đăng nhập (token): tìm hồ sơ Lecturer gắn với user_id đó.
//
//   payload: { section_id, title, description?, video_order?, change_note? }
//   file:    multer file (memoryStorage) — buffer của video gốc
//   actorUserId: id user đang thao tác (ghi vào version.uploaded_by)
const createInitialVideo = async (payload = {}, file, actorUserId) => {
  const sectionId  = payload.section_id == null || payload.section_id === '' ? null : String(payload.section_id).trim();
  const title      = payload.title == null ? '' : String(payload.title).trim();
  const description = payload.description == null || payload.description === '' ? null : String(payload.description).trim();
  const changeNote = payload.change_note == null || payload.change_note === '' ? null : String(payload.change_note).trim();
  const videoOrderRaw = payload.video_order;

  if (!sectionId)       throw ApiError.badRequest('section_id là bắt buộc');
  if (!title)           throw ApiError.badRequest('title là bắt buộc');
  if (!file || !file.buffer) throw ApiError.badRequest('Thiếu file video để upload');

  // Section phải tồn tại (lấy course_id để build đường dẫn MinIO)
  const section = await CourseSection.findByPk(sectionId, { attributes: ['id', 'course_id'] });
  if (!section) throw ApiError.notFound('Không tìm thấy section (section_id)');

  // Giảng viên sở hữu = hồ sơ Lecturer của user đang đăng nhập
  const lecturer = await Lecturer.findOne({ where: { user_id: actorUserId }, attributes: ['id'] });
  if (!lecturer) throw ApiError.badRequest('Tài khoản hiện tại chưa gắn hồ sơ giảng viên, không thể đặt làm chủ sở hữu video');
  const ownerLecturerId = lecturer.id;

  // video_order: nếu không truyền thì tự lấy max + 1 trong section
  let videoOrder = videoOrderRaw == null || videoOrderRaw === '' ? null : parseInt(videoOrderRaw, 10);
  if (videoOrder == null || Number.isNaN(videoOrder)) {
    const maxOrder = await LectureVideo.max('video_order', { where: { section_id: sectionId } });
    videoOrder = (maxOrder || 0) + 1;
  }

  // Tạo trước id ở app-level để build đường dẫn object trong MinIO
  const newVideoId = uuidv4();

  const ext = path.extname(file.originalname || '') || '.mp4';
  const versionNumber = 1;
  const rawKey       = `${newVideoId}/original${ext}`;               // videos-raw (pristine)
  const versionPrefix = `${newVideoId}/v${versionNumber}`;          // videos-versions/{id}/v1
  const playlistKey  = `${versionPrefix}/index.m3u8`;               // video_url trỏ vào đây

  // Thư mục tạm để ghi file gốc + xuất HLS
  const workDir = path.join(os.tmpdir(), `bgdt-${newVideoId}`);
  const hlsDir  = path.join(workDir, 'hls');
  const inputPath = path.join(workDir, `input${ext}`);

  let durationSec = null;
  try {
    await fsp.mkdir(hlsDir, { recursive: true });
    await fsp.writeFile(inputPath, file.buffer);

    // 1) Lưu bản gốc pristine vào videos-raw
    await putObject(BUCKETS.RAW, rawKey, file.buffer, file.mimetype);

    // 2) Cắt video thành HLS (.ts + index.m3u8)
    ({ durationSec } = await transcodeToHls(inputPath, hlsDir));

    // 3) Đẩy toàn bộ segment + playlist lên videos-versions/{id}/v1/
    const files = await fsp.readdir(hlsDir);
    if (!files.includes('index.m3u8')) throw new Error('Transcode HLS thất bại: không có index.m3u8');
    await Promise.all(files.map((name) =>
      fPutObject(BUCKETS.VERSIONS, `${versionPrefix}/${name}`, path.join(hlsDir, name), hlsContentType(name))
    ));
  } catch (err) {
    // dọn rác MinIO + thư mục tạm rồi báo lỗi
    await Promise.all([
      removeObject(BUCKETS.RAW, rawKey),
      removePrefix(BUCKETS.VERSIONS, `${versionPrefix}/`),
    ]);
    fs.rmSync(workDir, { recursive: true, force: true });
    throw err instanceof ApiError ? err : ApiError.internal(`Xử lý video thất bại: ${err.message}`);
  }

  // 4) Ghi 2 bản ghi DB trong 1 transaction; lỗi thì dọn object đã upload
  const t = await sequelize.transaction();
  try {
    const video = await LectureVideo.create({
      id:           newVideoId,
      section_id:   sectionId,
      title,
      description,
      video_order:  videoOrder,
      uploaded_by:  ownerLecturerId,   // FK -> lecturers
      status:       'registered',
      is_active:    true,
    }, { transaction: t });

    await LectureVideoVersion.create({
      video_id:         video.id,
      version_number:   versionNumber,
      version_type:     'initial',
      video_url:        playlistKey,   // HLS playlist trong videos-versions (bản phục vụ)
      video_url_backup: rawKey,        // path file gốc pristine trong videos-raw
      duration:         durationSec,
      file_size:        file.size || file.buffer.length,
      change_note:      changeNote,
      uploaded_by:      actorUserId,   // FK -> users (admin thao tác)
      is_active:        true,
    }, { transaction: t });

    await t.commit();
    fs.rmSync(workDir, { recursive: true, force: true });
    return getVideo(video.id);
  } catch (err) {
    await t.rollback();
    await Promise.all([
      removeObject(BUCKETS.RAW, rawKey),
      removePrefix(BUCKETS.VERSIONS, `${versionPrefix}/`),
    ]);
    fs.rmSync(workDir, { recursive: true, force: true });
    throw err;
  }
};

module.exports = { getVideo, listByCourse, getHlsObjectStream, createInitialVideo };
