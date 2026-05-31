const COURSE = {
	LIST: '/courses',
	CREATE: '/courses',
	UPDATE: '/courses',
	IMPORT: '/courses/import',
	LIST_BY_FACULTY: (facultyId) => `/courses/faculty/${facultyId}`,
	MY_FACULTY: '/courses/my-faculty',
	UPDATE_COUNT_MANAGER: (id) => `/courses/${id}/count-manager`,
}

export default COURSE