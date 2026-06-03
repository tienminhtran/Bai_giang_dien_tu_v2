const LECTURE_VIDEO = {
  LIST:   '/lecture-videos',          // ?course_id=&section_id=
  DETAIL: (id) => `/lecture-videos/${id}`,
  CREATE: '/lecture-videos',
}

export default LECTURE_VIDEO
