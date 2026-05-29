import { useState } from 'react'
import { toast } from 'sonner'
import studentService from '@/services/studentService'

const emptyForm = {
	studentCode: '', fullName: '', email: '', dob: '',
	className: '',   major: '',    phone: '', avatarUrl: '',
}

export function useStudentForm({ onSuccess }) {
	const [isOpen, setIsOpen]         = useState(false)
	const [form, setForm]             = useState(emptyForm)
	const [submitting, setSubmitting] = useState(false)

	const handleSubmit = async () => {
		if (!form.studentCode.trim() || !form.fullName.trim()) {
			toast.error('Vui lòng nhập mã số sinh viên và họ tên')
			return
		}
		setSubmitting(true)
		try {
			await studentService.create(form)
			toast.success('Đã thêm sinh viên')
			setForm(emptyForm)
			setIsOpen(false)
			onSuccess?.()
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Thêm sinh viên thất bại')
		} finally {
			setSubmitting(false)
		}
	}

	return { isOpen, setIsOpen, form, setForm, submitting, handleSubmit }
}
