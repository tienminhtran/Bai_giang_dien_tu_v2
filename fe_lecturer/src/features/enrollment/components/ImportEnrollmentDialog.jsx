import { useRef } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ImportEnrollmentDialog({ isOpen, onOpenChange, importFile, onFileChange, importResult, onImport, onDownloadErrors, submitting }) {
	const inputRef = useRef(null)

	const handleZoneClick  = () => inputRef.current?.click()
	const handleZoneKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick() } }
	const handleDrop       = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileChange(f) }
	const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = '' }

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Import danh sách đăng ký học phần</DialogTitle>
					<DialogDescription>Tải file mẫu, điền dữ liệu và import lên để ghi danh hàng loạt.</DialogDescription>
				</DialogHeader>

				{/* Drop zone */}
				<div
					role="button" tabIndex={0}
					onClick={handleZoneClick} onKeyDown={handleZoneKeyDown}
					onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
					className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#04ae9a]/40 bg-[#04ae9a]/5 px-6 py-8 text-center transition-colors hover:border-[#04ae9a] hover:bg-[#04ae9a]/10 focus:outline-none focus:ring-2 focus:ring-[#04ae9a]/30"
				>
					<div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-[#04ae9a]/15">
						<FileSpreadsheet className="h-7 w-7 text-[#02a28a]" />
					</div>
					<div className="space-y-1">
						<p className="text-base font-semibold text-slate-900">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
						<p className="text-sm text-slate-500">Chỉ hỗ trợ .xlsx, .xls</p>
					</div>
					{importFile
						? <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Đã chọn: {importFile.name}</div>
						: <div className="text-sm text-slate-400">Chưa có file nào được chọn</div>
					}
					<Input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
				</div>

				{/* Cấu trúc cột bắt buộc */}
				<div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
					<p className="mb-1 font-semibold text-slate-700">Cấu trúc file Excel (5 cột, theo thứ tự):</p>
					<code className="text-xs text-slate-500">
						Mã số sinh viên &nbsp;|&nbsp; Mã môn học &nbsp;|&nbsp; Năm học &nbsp;|&nbsp; Kỳ học &nbsp;|&nbsp; Loại đăng ký
					</code>
					<p className="mt-1 text-xs text-slate-400">Loại đăng ký: <strong>new</strong> (Đăng ký mới) | <strong>retake</strong> (Học lại) | <strong>improve</strong> (Học cải thiện)</p>
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

						{importResult.errors?.length > 0 && (
							<>
								<div className="max-h-40 overflow-auto rounded-lg border border-rose-200 bg-white">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-rose-100 bg-rose-50">
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Dòng</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">MSSV</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Mã môn</th>
												<th className="px-3 py-2 text-left font-semibold text-rose-700">Lỗi</th>
											</tr>
										</thead>
										<tbody>
											{importResult.errors.map((err, i) => (
												<tr key={i} className="border-b border-slate-100 last:border-0">
													<td className="px-3 py-1.5 text-slate-600">{err.row}</td>
													<td className="px-3 py-1.5 text-slate-800">{err.student_code || '—'}</td>
													<td className="px-3 py-1.5 text-slate-800">{err.course_code  || '—'}</td>
													<td className="px-3 py-1.5 text-rose-600">{err.reason}</td>
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
						{submitting ? 'Đang nhập...' : 'Import ghi danh'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
