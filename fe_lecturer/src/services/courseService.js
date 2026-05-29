import api from '../api/axios'
import { COURSE_EP } from '../constants'

const toFrontend = (course) => ({
	id: course.id,
	courseCode: course.course_code,
	courseName: course.course_name,
	credits: course.credits ?? '',
	description: course.description || '',
	isActive: Boolean(course.is_active),
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
		is_active: form.isActive,
	}
	const res = await api.post(COURSE_EP.CREATE, body)
	return res.data
}

const importCourses = async (courses) => {
	const body = courses.map((form) => ({
		course_code: String(form.courseCode || '').trim(),
		course_name: String(form.courseName || '').trim(),
		credits: form.credits === '' || form.credits === null || form.credits === undefined ? undefined : Number(form.credits),
		description: form.description?.trim() || undefined,
		is_active: form.isActive,
	}))
	const res = await api.post(COURSE_EP.IMPORT, body)
	return res.data.data
}

export default { list, create, importCourses }