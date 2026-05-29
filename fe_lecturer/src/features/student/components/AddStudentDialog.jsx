import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const FIELDS = [
	{ key: 'studentCode', label: 'Mã số sinh viên', placeholder: 'VD: SV001' },
	{ key: 'fullName',    label: 'Họ tên',           placeholder: 'VD: Nguyễn Văn A' },
	{ key: 'email',       label: 'Email',             placeholder: 'student@school.edu.vn' },
	{ key: 'dob',         label: 'Ngày sinh',         placeholder: '',  type: 'date' },
	{ key: 'className',   label: 'Lớp',               placeholder: 'VD: CNTT1' },
	{ key: 'major',       label: 'Chuyên ngành',      placeholder: 'VD: Công nghệ thông tin' },
	{ key: 'phone',       label: 'Số điện thoại',     placeholder: 'VD: 0901000001' },
	{ key: 'avatarUrl',   label: 'Avatar URL',        placeholder: 'https://...' },
]

export function AddStudentDialog({
	isOpen,
	onOpenChange,
	form,
	onFormChange,
	onSubmit,
	submitting,
	title = 'Thêm sinh viên',
	description = 'Nhập thông tin sinh viên',
	submitLabel = 'Lưu sinh viên',
}) {
	const update = (field) => (e) => onFormChange((prev) => ({ ...prev, [field]: e.target.value }))

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2 sm:grid-cols-2">
					{FIELDS.map(({ key, label, placeholder, type }) => (
						<div key={key} className="space-y-2">
							<label className="text-sm font-semibold">{label}</label>
							<Input
								type={type || 'text'}
								value={form[key]}
								onChange={update(key)}
								placeholder={placeholder}
							/>
						</div>
					))}
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
					<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onSubmit} disabled={submitting}>
						{submitting ? 'Đang lưu...' : submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
