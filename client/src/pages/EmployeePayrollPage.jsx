import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyPayrolls } from '../features/payroll/payrollSlice'
import { downloadSalarySlipRequest } from '../features/payroll/payrollService'
import { formatCurrency, formatPayrollDate } from '../utils/payroll'

function downloadBlobFile(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

function renderPdfLoadingState(targetWindow) {
  targetWindow.document.title = 'Loading salary slip...'
  targetWindow.document.body.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#344054">
      <div style="padding:20px 28px;border:1px solid #e3e8ef;border-radius:10px;background:white;box-shadow:0 12px 35px rgba(16,24,40,.08)">
        Loading salary slip...
      </div>
    </div>
  `
}

function EmployeePayrollPage() {
  const dispatch = useDispatch()
  const { myItems, myListStatus, error } = useSelector((state) => state.payroll)
  const [downloadingId, setDownloadingId] = useState('')
  const [viewingId, setViewingId] = useState('')
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    dispatch(fetchMyPayrolls())
  }, [dispatch])

  async function handleDownload(id) {
    setDownloadingId(id)
    setPdfError('')

    try {
      const file = await downloadSalarySlipRequest(id)
      downloadBlobFile(file.blob, file.fileName)
    } catch (requestError) {
      setPdfError(
        requestError.response?.data?.message ||
          'Unable to download the salary slip. Please try again.',
      )
    } finally {
      setDownloadingId('')
    }
  }

  async function handleView(id) {
    const pdfWindow = window.open('', '_blank')

    if (!pdfWindow) {
      setPdfError('Your browser blocked the PDF tab. Allow pop-ups and try again.')
      return
    }

    pdfWindow.opener = null
    renderPdfLoadingState(pdfWindow)
    setViewingId(id)
    setPdfError('')

    try {
      const file = await downloadSalarySlipRequest(id)
      const pdfUrl = window.URL.createObjectURL(file.blob)

      pdfWindow.location.replace(pdfUrl)
      window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 60_000)
    } catch (requestError) {
      pdfWindow.close()
      setPdfError(
        requestError.response?.data?.message ||
          'Unable to open the salary slip. Please try again.',
      )
    } finally {
      setViewingId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
          Salary Slips
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          View your payroll history and download salary slips
        </h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          Each processed payroll record includes your gross salary, deductions,
          paid leave usage, and final net salary for the month.
        </p>
      </section>

      <section className="space-y-4">
        {myItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.payrollMonthLabel}</h3>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
                    {item.slipNumber}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-slate-500">Gross Salary</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(item.grossSalary)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-slate-500">Total Deduction</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(item.totalDeduction)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-slate-500">Net Salary</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(item.netSalary)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-slate-500">Paid Leave Used</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {item.paidLeaveUsed} day(s)
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-400">
                  Processed on {formatPayrollDate(item.processedAt)} • Unpaid leave{' '}
                  {item.attendanceSummary.unpaidLeaveDays} day(s) • Absent{' '}
                  {item.attendanceSummary.absentDays} day(s) • Late deduction{' '}
                  {item.attendanceSummary.lateDeductionDays} day(s)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleView(item.id)}
                  disabled={viewingId === item.id}
                  className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {viewingId === item.id ? 'Opening...' : 'View PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(item.id)}
                  disabled={downloadingId === item.id}
                  className="rounded-full bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingId === item.id ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </article>
        ))}

        {myListStatus === 'loading' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            Loading salary slips...
          </div>
        ) : null}

        {!myItems.length && myListStatus !== 'loading' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            No payroll has been processed for your account yet.
          </div>
        ) : null}

        {error || pdfError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-6 py-4 text-sm text-rose-100">
            {pdfError || error}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default EmployeePayrollPage
