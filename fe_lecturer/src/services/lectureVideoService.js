import api from '../api/axios'
import { LECTURE_VIDEO_EP } from '../constants'

export const VIDEO_STATUS_LABEL = {
  registered:       'Đã đăng ký',
  under_review:     'Đang chấm',
  revision:         'Cần chỉnh sửa',
  secretary_review: 'Thư ký duyệt',
  published:        'Đã xuất bản',
  rejected:         'Từ chối',
}

const toFrontend = (v) => {
  const versions = Array.isArray(v.LectureVideoVersions) ? v.LectureVideoVersions : []
  const latest = versions.reduce((a, b) => (a && a.version_number >= b.version_number ? a : b), null)
  return {
    id:           v.id,
    sectionId:    v.section_id,
    sectionTitle: v.CourseSection?.section_title || '',
    sectionOrder: v.CourseSection?.section_order ?? 0,
    title:        v.title,
    description:  v.description || '',
    order:        v.video_order,
    status:       v.status,
    statusLabel:  VIDEO_STATUS_LABEL[v.status] || v.status,
    uploaderName: v.uploader?.full_name || '',
    uploaderCode: v.uploader?.lecturer_code || '',
    uploadedAt:   v.uploaded_at || '',
    versionCount: versions.length,
    latestVersion: latest ? latest.version_number : null,
    versionUrl:   latest?.video_url || '',
    duration:     latest?.duration ?? null,
  }
}

// URL tuyệt đối tới playlist HLS của bản mới nhất (kèm baseURL của API).
// hls.js sẽ tự gọi các segment .ts theo đường dẫn tương đối cùng thư mục.
const playlistUrl = (video) => {
  if (!video?.id || !video?.latestVersion) return ''
  return `${api.defaults.baseURL}/lecture-videos/${video.id}/stream/${video.latestVersion}/index.m3u8`
}

const list = async ({ courseId, sectionId } = {}) => {
  const params = { course_id: courseId }
  if (sectionId) params.section_id = sectionId
  const res = await api.get(LECTURE_VIDEO_EP.LIST, { params })
  return (res.data.data || []).map(toFrontend)
}

// Upload bước 1 — multipart/form-data. Chủ sở hữu video = user đang đăng nhập (token).
const create = async ({ sectionId, title, description = '', changeNote = '', file }) => {
  const form = new FormData()
  form.append('section_id', sectionId)
  form.append('title', title?.trim())
  if (description?.trim()) form.append('description', description.trim())
  if (changeNote?.trim())  form.append('change_note', changeNote.trim())
  form.append('video', file)
  const res = await api.post(LECTURE_VIDEO_EP.CREATE, form)
  return res.data
}

export default { list, create, playlistUrl }
