import api from '../api/axios'
import USER_ROLE_EP from '../constants/endpoints/userrole.endpoints'

const toFrontend = (lecturer) => ({
	id: lecturer.id,
	userId: lecturer.user_id,
	lecturerCode: lecturer.lecturer_code,
	fullName: lecturer.full_name,
	email: lecturer.email || '',
	facultyName: lecturer.faculty_name || '',
	isActive: Boolean(lecturer.is_active),
	roles: Array.isArray(lecturer.roles) ? lecturer.roles : [],
})

const listLecturerRoles = async ({ lecturerCode = '', fullName = '', page = 1, pageSize = 10 } = {}) => {
	const params = { page, pageSize }
	if (lecturerCode) params.lecturer_code = lecturerCode
	if (fullName) params.full_name = fullName

	const res = await api.get(USER_ROLE_EP.LECTURERS, { params })
	const { data, total } = res.data
	return { rows: data.map(toFrontend), total }
}

const listAllRoles = async () => {
	const res = await api.get(USER_ROLE_EP.ROLES)
	return Array.isArray(res.data?.data) ? res.data.data : []
}

const updateLecturerRoles = async (lecturerId, roleIds) => {
	const res = await api.put(`${USER_ROLE_EP.LECTURERS}/${lecturerId}`, { roleIds })
	return res.data
}

export default { listLecturerRoles, listAllRoles, updateLecturerRoles }