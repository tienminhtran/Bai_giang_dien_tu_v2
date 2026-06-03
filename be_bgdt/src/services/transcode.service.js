const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

// ── Cắt video thành HLS (index.m3u8 + seg_***.ts) trong outDir ───────────────
//   Re-encode H.264/AAC để đảm bảo segment chuẩn, phát được trên mọi trình duyệt.
//   Trả về { durationSec } (đọc từ metadata trong lúc encode).
const transcodeToHls = (inputPath, outDir, { hlsTime = 10 } = {}) =>
  new Promise((resolve, reject) => {
    let durationSec = null;

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-c:a aac',
        '-ac 2',
        `-hls_time ${hlsTime}`,
        '-hls_playlist_type vod',
        '-hls_flags independent_segments',
        '-hls_segment_filename', path.join(outDir, 'seg_%03d.ts'),
      ])
      .output(path.join(outDir, 'index.m3u8'))
      .on('codecData', (data) => {
        // data.duration dạng "HH:MM:SS.xx"
        const m = /(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(data.duration || '');
        if (m) durationSec = Math.round((+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]));
      })
      .on('end', () => resolve({ durationSec }))
      .on('error', (err) => reject(err))
      .run();
  });

// Content-Type cho từng loại file HLS
const hlsContentType = (filename) => {
  if (filename.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (filename.endsWith('.ts'))   return 'video/mp2t';
  return 'application/octet-stream';
};

module.exports = { transcodeToHls, hlsContentType };
