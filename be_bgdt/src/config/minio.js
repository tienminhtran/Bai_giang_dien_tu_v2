const { Client } = require('minio');

// ── Cấu hình kết nối MinIO (đọc từ .env) ─────────────────────────────────────
const minioClient = new Client({
  endPoint:  process.env.MINIO_ENDPOINT || 'localhost',
  port:      parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
});

// Tên các bucket (khớp với docker-compose minio-init)
const BUCKETS = {
  RAW:       process.env.MINIO_BUCKET_RAW       || 'videos-raw',       // file gốc pristine — nguồn re-encode
  VERSIONS:  process.env.MINIO_BUCKET_VERSIONS  || 'videos-versions',  // mỗi version 1 path, video_url trỏ vào đây
  PUBLISHED: process.env.MINIO_BUCKET_PUBLISHED || 'videos-published', // bản đã xuất bản (public)
};

// ── Đảm bảo bucket tồn tại (tự tạo nếu chưa có) ──────────────────────────────
const ensureBucket = async (bucket) => {
  const exists = await minioClient.bucketExists(bucket).catch(() => false);
  if (!exists) await minioClient.makeBucket(bucket);
};

// ── Upload 1 object từ buffer ────────────────────────────────────────────────
//   Trả về objectKey đã lưu để ghi vào DB (video_url_backup).
const putObject = async (bucket, objectKey, buffer, contentType) => {
  await ensureBucket(bucket);
  await minioClient.putObject(bucket, objectKey, buffer, buffer.length, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return objectKey;
};

// ── Upload 1 object từ file trên đĩa (dùng cho segment .ts / .m3u8) ───────────
const fPutObject = async (bucket, objectKey, filePath, contentType) => {
  await ensureBucket(bucket);
  await minioClient.fPutObject(bucket, objectKey, filePath, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return objectKey;
};

// ── Xóa 1 object (dùng khi rollback) ─────────────────────────────────────────
const removeObject = (bucket, objectKey) =>
  minioClient.removeObject(bucket, objectKey).catch(() => {});

// ── Xóa tất cả object theo prefix (dọn cả thư mục HLS khi rollback) ──────────
const removePrefix = (bucket, prefix) =>
  new Promise((resolve) => {
    const keys = [];
    const stream = minioClient.listObjectsV2(bucket, prefix, true);
    stream.on('data', (obj) => keys.push(obj.name));
    stream.on('error', () => resolve());
    stream.on('end', () => {
      if (keys.length === 0) return resolve();
      minioClient.removeObjects(bucket, keys).then(resolve).catch(() => resolve());
    });
  });

module.exports = { minioClient, BUCKETS, ensureBucket, putObject, fPutObject, removeObject, removePrefix };
