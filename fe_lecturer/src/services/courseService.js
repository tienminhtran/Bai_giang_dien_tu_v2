import api from '../api/axios'
import { COURSE_EP } from '../constants'

const toFrontend = (course) => ({
	id: course.id,
	courseCode: course.course_code,
	courseName: course.course_name,
	credits: course.credits ?? '',
	description: course.description || '',
	facultyId: course.faculty_id || '',
	facultyName: course.faculty?.faculty_name || '',
	isActive: Boolean(course.is_active),
	countManager: course.count_manager ?? 1,
})

const list = async ({ courseCode = '', courseName = '', page = 1, pageSize = 10 } = {}) => {
	const params = { page, pageSize }
	if (courseCode) params.course_code = courseCode
	if (courseName) params.course_name = courseName

	const res = await api.get(COURSE_EP.LIST, { params })
	const { rows, total } = res.data.data
	return { rows: rows.map(toFrontend), total }
}

const create = async (form) => {
	const body = {
		course_code: form.courseCode?.trim(),
		course_name: form.courseName?.trim(),
		credits: form.credits === '' || form.credits === null || form.credits === undefined ? undefined : Number(form.credits),
		description: form.description?.trim() || undefined,
		faculty_id: form.facultyId || undefined,
		is_active: form.isActive,
	}
	const res = await api.post(COURSE_EP.CREATE, body)
	return res.data
}

const update = async (id, form) => {
	const body = {
		course_code: form.courseCode?.trim(),
		course_name: form.courseName?.trim(),
		credits: form.credits === '' || form.credits === null || form.credits === undefined ? null : Number(form.credits),
		description: form.description?.trim() || null,
		faculty_id: form.facultyId || null,
		is_active: form.isActive,
	}
	const res = await api.put(`${COURSE_EP.UPDATE}/${id}`, body)
	return res.data
}

const importCourses = async (courses) => {
	const body = courses.map((form) => ({
		course_code: String(form.courseCode || '').trim(),
		course_name: String(form.courseName || '').trim(),
		credits: form.credits === '' || form.credits === null || form.credits === undefined ? undefined : Number(form.credits),
		description: form.description?.trim() || undefined,
		faculty_id: form.facultyId || undefined,
		is_active: true,
	}))
	const res = await api.post(COURSE_EP.IMPORT, body)
	return res.data.data
}

const remove = async (id) => {
	const res = await api.delete(`/courses/${id}`)
	return res.data
}

const listMyFaculty = async ({ courseCode = '', courseName = '', page = 1, pageSize = 10 } = {}) => {
	const params = { page, pageSize }
	if (courseCode) params.course_code = courseCode
	if (courseName) params.course_name = courseName
	const res = await api.get(COURSE_EP.MY_FACULTY, { params })
	const { faculty, rows, total } = res.data.data
	return {
		faculty: faculty ? { id: faculty.id, facultyName: faculty.faculty_name } : null,
		rows: rows.map(toFrontend),
		total,
	}
}

const listByFaculty = async (facultyId, { courseCode = '', courseName = '', page = 1, pageSize = 20 } = {}) => {
	const params = { page, pageSize }
	if (courseCode) params.course_code = courseCode
	if (courseName) params.course_name = courseName
	const res = await api.get(COURSE_EP.LIST_BY_FACULTY(facultyId), { params })
	const { faculty, rows, total } = res.data.data
	return { faculty, rows: rows.map(toFrontend), total }
}

const updateCountManager = async (id, countManager) => {
	const res = await api.patch(COURSE_EP.UPDATE_COUNT_MANAGER(id), { count_manager: countManager })
	return res.data
}

export default { list, create, update, delete: remove, importCourses, listMyFaculty, listByFaculty, updateCountManager }