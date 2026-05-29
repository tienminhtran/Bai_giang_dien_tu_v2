import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EnrollmentActionBar({ onExport, onDownloadTemplate, onImportOpen }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={onExport}>
				<Download className="mr-2 h-4 w-4" />
				Xuất Excel danh sách
			</Button>

			<Button type="button" variant="outline" className="border-slate-400 bg-white text-slate-600 hover:bg-slate-50" onClick={onDownloadTemplate}>
				<FileSpreadsheet className="mr-2 h-4 w-4" />
				Tải file mẫu Import
			</Button>

			<Button type="button" variant="outline" className="border-[#04ae9a] bg-white text-[#02a28a] hover:bg-slate-50" onClick={onImportOpen}>
				<Upload className="mr-2 h-4 w-4" />
				Import Excel
			</Button>
		</div>
	)
}
