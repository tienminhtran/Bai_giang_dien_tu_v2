import { Download, FileSpreadsheet, Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StudentActionBar({ onAddOpen, onImportOpen, onExport, onLockAll, onUnlockAll, onLockSelected }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={onAddOpen}>
				<Plus className="mr-2 h-4 w-4" />
				Thêm sinh viên
			</Button>

			<Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={onImportOpen}>
				<FileSpreadsheet className="mr-2 h-4 w-4" />
				Thêm bằng Excel
			</Button>

			<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={onExport}>
				<Download className="mr-2 h-4 w-4" />
				Xuất Excel
			</Button>

			<Button type="button" variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={onLockAll}>
				<Lock className="mr-2 h-4 w-4" />
				Khóa toàn bộ
			</Button>

			<Button type="button" variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={onUnlockAll}>
				<Lock className="mr-2 h-4 w-4" />
				Mở khóa toàn bộ
			</Button>

		</div>
	)
}
