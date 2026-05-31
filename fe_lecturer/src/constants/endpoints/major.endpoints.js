const MAJOR_EP = {
  LIST_ALL:          '/majors',
  LIST_BY_FACULTY:   (facultyId) => `/majors/faculty/${facultyId}`,
  LIST_MINE:         '/majors/my-faculty',
  CREATE:           '/majors',
  CREATE_MINE:      '/majors/my-faculty',
  ADD_LECTURER:     (id) => `/majors/${id}/add-lecturer`,
  ADD_MY_LECTURER:  (id) => `/majors/${id}/add-my-lecturer`,
  UPDATE:           (id) => `/majors/${id}`,
  UPDATE_MINE:      (id) => `/majors/my-faculty/${id}`,
  DELETE:           (id) => `/majors/${id}`,
  IMPORT:           '/majors/import',
  TEMPLATE:         '/majors/import/template',
  TOGGLE_LOCK:      (id) => `/majors/${id}/lock`,
  LOCK_ALL:         '/majors/lock-all',
}

export default MAJOR_EP
