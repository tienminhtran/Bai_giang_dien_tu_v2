import { useRef } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { downloadStudentExcelTemplate } from '@/components/template_excel/studentTemplate'

export function ImportStudentDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting }) {
	const inputRef = useRef(null)

	const handleZoneClick = () => inputRef.current?.click()
	const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
	const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) onFileChange(file) }
	const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file) onFileChange(file); e.target.value = '' }

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Thêm sinh viên bằng Excel</DialogTitle>
					<DialogDescription>Tải file mẫu, chọn file Excel và nhập danh sách sinh viên từ vùng tải lên bên dưới.</DialogDescription>
				</DialogHeader>

				{/* Drop zone */}
				<div
					role="button"
					tabIndex={0}
					onClick={handleZoneClick}
					onKeyDown={handleZoneKeyDown}
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
					className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#04ae9a]/40 bg-[#04ae9a]/5 px-6 py-8 text-center transition-colors hover:border-[#04ae9a] hover:bg-[#04ae9a]/10 focus:outline-none focus:ring-2 focus:ring-[#04ae9a]/30"
				>
					<div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-[#04ae9a]/15">
						<FileSpreadsheet className="h-7 w-7 text-[#02a28a]" />
					</div>
					<div className="space-y-1">
						<p className="text-base font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
						<p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls, .csv</p>
					</div>
					{importFile
						? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
						: <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>
					}
					<Input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
				</div>

				{/* Template download */}
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
					<p className="text-sm text-slate-600">Tải file mẫu để điền đúng định dạng trước khi nhập.</p>
					<Button type="button" variant="outline" className="border-[#08387F] bg-white text-[#08387F] hover:bg-slate-50" onClick={downloadStudentExcelTemplate}>
						<Download className="mr-2 h-4 w-4" />
						Tải file Excel mẫu
					</Button>
				</div>

				{/* Import result */}
				{importResult && (
					<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap gap-2 text-sm font-medium">
							<span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Tổng: {importResult.total}</span>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Thành công: {importResult.successCount}</span>
							{importResult.errorCount > 0 && (
								<span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Lỗi: {importResult.errorCount}</span>
							)}
						</div>

						{importResult.errors.length > 0 && (
							<>
								<div className="max-h-40 overflow-auto rounded-lg border border-rose-200 bg-white">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-rose-100 bg-rose-50">
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Dòng</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Mã SV</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
											</tr>
										</thead>
										<tbody>
											{importResult.errors.map((err) => (
												<tr key={err.row} className="border-b border-slate-100 last:border-0">
													<td className="px-3 py-1.5 text-slate-600">{err.row}</td>
													<td className="px-3 py-1.5 text-slate-800">{err.student_code || '—'}</td>
													<td className="px-3 py-1.5 text-rose-600">{err.message}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<Button type="button" variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={onDownloadErrors}>
									<Download className="mr-2 h-3.5 w-3.5" />
									Tải file lỗi về
								</Button>
							</>
						)}
					</div>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
					<Button type="button" className="bg-[#08387F] text-white hover:bg-[#072f6a]" onClick={onImport} disabled={submitting}>
						{submitting ? 'Đang nhập...' : 'Nhập sinh viên'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
