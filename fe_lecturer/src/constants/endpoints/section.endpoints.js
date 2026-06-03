const SECTION = {
  LIST:   '/sections',            // ?course_id=
  CREATE: '/sections',
  UPDATE: (id) => `/sections/${id}`,
  DELETE: (id) => `/sections/${id}`,
}

export default SECTION
