const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Role, UserRole, Lecturer, Faculty, Major, AcademicDegree } = require('../models');

// faculty_id: lọc theo khoa; no_major: chỉ lấy GV chưa có chuyên ngành
const listLecturers = async ({ lecturer_code, full_name, faculty_id, major_id, no_major, page = 1, pageSize = 20 }) => {
	const where = {};
	if (lecturer_code) where.lecturer_code = { [Op.like]: `%${lecturer_code}%` };
	if (full_name) where.full_name = { [Op.like]: `%${full_name}%` };
	if (faculty_id) where.faculty_id = faculty_id;
	if (major_id) where.major_id = major_id;
	if (no_major === true || no_major === 'true' || no_major === '1') {
		where.major_id = null;
	}

	const limit = Number(pageSize) || 20;
	const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

	const [total, rows] = await Promise.all([
		Lecturer.count({ where }),
		Lecturer.findAll({
			where,
			limit,
			offset,
			order: [['lecturer_code', 'ASC']],
			include: [
				{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
				{ model: Major, as: 'major', attributes: ['id', 'major_name'] },
			],
		}),
	]);

	return { total, rows };
};

const createLecturer = async ({ lecturer_code, full_name, email, faculty_id, major_id, academic_degree, phone }) => {
	if (!lecturer_code || !full_name) {
		const err = new Error('lecturer_code và full_name là bắt buộc');
		err.statusCode = 400;
		throw err;
	}

	const code = String(lecturer_code).trim();

	const [existingLecturer, existingUser] = await Promise.all([
		Lecturer.findOne({ where: { lecturer_code: code } }),
		User.findOne({ where: { username: code } }),
	]);

	if (existingLecturer) {
		const err = new Error('Mã số giảng viên đã tồn tại');
		err.statusCode = 409;
		throw err;
	}

	if (existingUser) {
		const err = new Error('Tên đăng nhập đã tồn tại');
		err.statusCode = 409;
		throw err;
	}

	const rawPassword = code;
	const passwordHash = await bcrypt.hash(rawPassword, 10);

	return sequelize.transaction(async (t) => {
		const user = await User.create(
			{ username: code, password_hash: passwordHash, status: 'active' },
			{ transaction: t },
		);

		const role = await Role.findOne({ where: { role_name: 'lecturer' }, transaction: t });
		if (role) await UserRole.create({ user_id: user.id, role_id: role.id }, { transaction: t });

		const lecturer = await Lecturer.create({
			user_id: user.id,
			lecturer_code: code,
			full_name: String(full_name).trim(),
			email: email ? String(email).trim() : null,
			faculty_id: faculty_id || null,
			major_id: major_id || null,
			academic_degree: academic_degree ? String(academic_degree).trim() : null,
			phone: phone ? String(phone).trim() : null,
			is_active: true,
		}, { transaction: t });

		return { user, lecturer };
	});
};

const importLecturers = async (records) => {
	if (!Array.isArray(records) || records.length === 0) {
		const err = new Error('Danh sách giảng viên không hợp lệ hoặc rỗng');
		err.statusCode = 400;
		throw err;
	}

	// Pre-load để resolve tên khoa và học vị (case-insensitive)
	const [allFaculties, allDegrees] = await Promise.all([
		Faculty.findAll({ attributes: ['id', 'faculty_name'] }),
		AcademicDegree.findAll({ attributes: ['degree_name'] }),
	]);
	const facultyMap = new Map(allFaculties.map((f) => [f.faculty_name.toLowerCase().trim(), f.id]));
	const degreeMap  = new Map(allDegrees.map((d)  => [d.degree_name.toLowerCase().trim(), d.degree_name]));

	let successCount = 0;
	const errors = [];

	for (let i = 0; i < records.length; i++) {
		const raw = records[i];
		try {
			// Resolve faculty_name → faculty_id
			let faculty_id = raw.faculty_id || null;
			if (!faculty_id && raw.faculty_name) {
				faculty_id = facultyMap.get(String(raw.faculty_name).toLowerCase().trim()) || null;
			}

			// Normalize academic_degree (case-insensitive match về đúng tên trong DB)
			let academic_degree = null;
			if (raw.academic_degree) {
				academic_degree = degreeMap.get(String(raw.academic_degree).toLowerCase().trim()) || null;
			}

			await createLecturer({ ...raw, faculty_id, academic_degree });
			successCount++;
		} catch (err) {
			errors.push({
				row: i + 1,
				lecturer_code: raw.lecturer_code || null,
				message: err.message || 'Lỗi không xác định',
			});
		}
	}

	return { successCount, errorCount: errors.length, errors };
};

const lockLecturerAccount = async (lecturerId, action = 'lock') => {
	const lecturer = await Lecturer.findByPk(lecturerId);
	if (!lecturer) {
		const err = new Error('Không tìm thấy giảng viên');
		err.statusCode = 404;
		throw err;
	}

	const normalizedAction = String(action || 'lock').toLowerCase();
	if (!['lock', 'unlock'].includes(normalizedAction)) {
		const err = new Error("action không hợp lệ, chỉ nhận 'lock' hoặc 'unlock'");
		err.statusCode = 400;
		throw err;
	}

	const userStatus = normalizedAction === 'lock' ? 'banned' : 'active';
	const isActive = normalizedAction !== 'lock';

	return sequelize.transaction(async (t) => {
		await User.update({ status: userStatus }, { where: { id: lecturer.user_id }, transaction: t });
		await Lecturer.update({ is_active: isActive }, { where: { id: lecturerId }, transaction: t });
		const updatedLecturer = await Lecturer.findByPk(lecturerId, { transaction: t });
		return updatedLecturer;
	});
};

const lockLecturerAccountsBulk = async (lecturerIds = [], action = 'lock') => {
	// tolerate string input from clients: JSON string or comma-separated list
	let ids = lecturerIds;
	if (typeof ids === 'string') {
		// try parse as JSON array
		try {
			const parsed = JSON.parse(ids);
			if (Array.isArray(parsed)) ids = parsed;
		} catch (e) {
			// not JSON — treat as CSV
			ids = ids.split(',').map((s) => s.trim()).filter(Boolean);
		}
	}

	if (!Array.isArray(ids) || ids.length === 0) {
		const err = new Error('lecturerIds phải là mảng và không được rỗng');
		err.statusCode = 400;
		throw err;
	}

	const results = await Promise.all(
		ids.map(async (lecturerId) => {
			try {
				const lecturer = await lockLecturerAccount(lecturerId, action);
				return { lecturerId, success: true, lecturer };
			} catch (error) {
				return { lecturerId, success: false, message: error.message || 'Lỗi không xác định' };
			}
		}),
	);

	const successItems = results.filter((item) => item.success);
	const failedItems = results.filter((item) => !item.success);

	return {
		total: lecturerIds.length,
		successCount: successItems.length,
		errorCount: failedItems.length,
		errors: failedItems,
		data: successItems,
	};
};

const resetLecturerPassword = async (lecturerId, newPassword = '12345678') => {
	const lecturer = await Lecturer.findByPk(lecturerId);
	if (!lecturer) {
		const err = new Error('Không tìm thấy giảng viên');
		err.statusCode = 404;
		throw err;
	}

	const passwordHash = await bcrypt.hash(String(newPassword), 10);
	await User.update({ password_hash: passwordHash }, { where: { id: lecturer.user_id } });
	return { success: true };
};

const updateLecturer = async (lecturerId, payload) => {
	const lecturer = await Lecturer.findByPk(lecturerId);
	if (!lecturer) {
		const err = new Error('Không tìm thấy giảng viên');
		err.statusCode = 404;
		throw err;
	}

	return sequelize.transaction(async (t) => {
		const updates = {};

		if (payload.lecturer_code !== undefined) {
			const nextCode = String(payload.lecturer_code).trim();
			if (!nextCode) {
				const err = new Error('lecturer_code không hợp lệ');
				err.statusCode = 400;
				throw err;
			}

			if (nextCode !== lecturer.lecturer_code) {
				const existedLecturer = await Lecturer.findOne({ where: { lecturer_code: nextCode }, transaction: t });
				const existedUser = await User.findOne({ where: { username: nextCode }, transaction: t });

				if (existedLecturer) {
					const err = new Error('Mã số giảng viên đã tồn tại');
					err.statusCode = 409;
					throw err;
				}

				if (existedUser) {
					const err = new Error('Tên đăng nhập đã tồn tại');
					err.statusCode = 409;
					throw err;
				}

				updates.lecturer_code = nextCode;
				await User.update({ username: nextCode }, { where: { id: lecturer.user_id }, transaction: t });
			}
		}

		if (payload.full_name !== undefined) updates.full_name = String(payload.full_name).trim();
		if (payload.email !== undefined) updates.email = payload.email ? String(payload.email).trim() : null;
		if (payload.faculty_id !== undefined) updates.faculty_id = payload.faculty_id || null;
		if (payload.major_id !== undefined) updates.major_id = payload.major_id || null;
		if (payload.academic_degree !== undefined) {
			updates.academic_degree = payload.academic_degree ? String(payload.academic_degree).trim() : null;
		}
		if (payload.phone !== undefined) updates.phone = payload.phone ? String(payload.phone).trim() : null;
		if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active);

		if (Object.keys(updates).length > 0) {
			await Lecturer.update(updates, { where: { id: lecturerId }, transaction: t });
		}

		const updated = await Lecturer.findByPk(lecturerId, {
			include: [
				{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
				{ model: Major, as: 'major', attributes: ['id', 'major_name'] },
			],
			transaction: t,
		});
		return updated;
	});
};

const updateLecturerDegree = async (lecturerId, academic_degree) => {
	const lecturer = await Lecturer.findByPk(lecturerId);
	if (!lecturer) {
		const err = new Error('Không tìm thấy giảng viên');
		err.statusCode = 404;
		throw err;
	}

	const degree = academic_degree ? String(academic_degree).trim() : null;
	await Lecturer.update({ academic_degree: degree }, { where: { id: lecturerId } });
	return Lecturer.findByPk(lecturerId, {
		include: [
			{ model: Faculty, as: 'faculty', attributes: ['id', 'faculty_name'] },
			{ model: Major, as: 'major', attributes: ['id', 'major_name'] },
		],
	});
};



module.exports = {
	listLecturers,
	createLecturer,
	importLecturers,
	lockLecturerAccount,
	lockLecturerAccountsBulk,
	resetLecturerPassword,
	updateLecturer,
	updateLecturerDegree,
};
