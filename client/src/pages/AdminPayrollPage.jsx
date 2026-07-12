import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEmployees } from '../features/employees/employeeSlice'
import {
  fetchAdminPayrolls,
  runPayroll,
} from '../features/payroll/payrollSlice'
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

function AdminPayrollPage() {
  const dispatch = useDispatch()
  const { items: employees } = useSelector((state) => state.employees)
  const { adminItems, listStatus, runStatus, error } = useSelector(
    (state) => state.payroll,
  )

  const [filters, setFilters] = useState(() => {
    const today = new Date()
    return {
      employeeId: '',
      month: String(today.getMonth() + 1),
      year: String(today.getFullYear()),
    }
  })
  const [downloadingId, setDownloadingId] = useState('')

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 200, page: 1 }))
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchAdminPayrolls(filters))
  }, [dispatch, filters])

  async function handleRunPayroll() {
    const action = await dispatch(
      runPayroll({
        month: Number(filters.month),
        year: Number(filters.year),
        employeeId: filters.employeeId || undefined,
      }),
    )

    if (runPayroll.fulfilled.match(action)) {
      dispatch(fetchAdminPayrolls(filters))
    }
  }

  async function handleDownload(id) {
    setDownloadingId(id)

    try {
      const file = await downloadSalarySlipRequest(id)
      downloadBlobFile(file.blob, file.fileName)
    } finally {
      setDownloadingId('')
    }
  }

  const summary = useMemo(
    () =>
      adminItems.reduce(
        (totals, item) => ({
          employees: totals.employees + 1,
          grossSalary: totals.grossSalary + item.grossSalary,
          totalDeduction: totals.totalDeduction + item.totalDeduction,
          netSalary: totals.netSalary + item.netSalary,
        }),
        {
          employees: 0,
          grossSalary: 0,
          totalDeduction: 0,
          netSalary: 0,
        },
      ),
    [adminItems],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
          Payroll Module
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Process monthly payroll and generate salary slips
        </h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Payroll now deducts salary only for unpaid leave, absent days, late-mark
          conversion, and unpaid half-day impact, while paid leave balances are
          consumed first where applicable.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Employee</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
              value={filters.employeeId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  employeeId: event.target.value,
                }))
              }
            >
              <option value="">All active employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Month</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
              value={filters.month}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  month: event.target.value,
                }))
              }
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={String(index + 1)}>
                  {new Date(2026, index, 1).toLocaleDateString('en-IN', {
                    month: 'long',
                  })}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Year</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
              type="number"
              value={filters.year}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  year: event.target.value,
                }))
              }
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRunPayroll}
              disabled={runStatus === 'loading'}
              className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runStatus === 'loading' ? 'Processing payroll...' : 'Run payroll'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Employees</p>
          <div className="mt-3 text-3xl font-semibold text-white">{summary.employees}</div>
          <p className="mt-2 text-sm text-slate-400">Payroll records in current filter</p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Gross Salary</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(summary.grossSalary)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Combined payroll before deductions</p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total Deduction</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(summary.totalDeduction)}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Unpaid leave, absences, late conversions, and unpaid half-days
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Net Payout</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(summary.netSalary)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Final salary after payroll calculation</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
            Payroll History
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Processed payroll records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Employee</th>
                <th className="px-6 py-4 text-left font-medium">Payroll Month</th>
                <th className="px-6 py-4 text-left font-medium">Gross</th>
                <th className="px-6 py-4 text-left font-medium">Deduction</th>
                <th className="px-6 py-4 text-left font-medium">Net</th>
                <th className="px-6 py-4 text-left font-medium">Working Days</th>
                <th className="px-6 py-4 text-left font-medium">Absent</th>
                <th className="px-6 py-4 text-left font-medium">Unpaid Leave</th>
                <th className="px-6 py-4 text-left font-medium">Late Deduction</th>
                <th className="px-6 py-4 text-left font-medium">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {adminItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.employee?.fullName}</div>
                    <div className="text-slate-400">{item.employee?.employeeId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{item.payrollMonthLabel}</div>
                    <div className="text-slate-400">{formatPayrollDate(item.processedAt)}</div>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(item.grossSalary)}</td>
                  <td className="px-6 py-4">{formatCurrency(item.totalDeduction)}</td>
                  <td className="px-6 py-4">{formatCurrency(item.netSalary)}</td>
                  <td className="px-6 py-4">{item.attendanceSummary.totalWorkingDays}</td>
                  <td className="px-6 py-4">{item.attendanceSummary.absentDays}</td>
                  <td className="px-6 py-4">{item.attendanceSummary.unpaidLeaveDays}</td>
                  <td className="px-6 py-4">{item.attendanceSummary.lateDeductionDays}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleDownload(item.id)}
                      disabled={downloadingId === item.id}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                    >
                      {downloadingId === item.id ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </td>
                </tr>
              ))}

              {!adminItems.length && listStatus !== 'loading' ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-400" colSpan="10">
                    No payroll records found for the selected filters yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {listStatus === 'loading' ? (
          <div className="border-t border-white/10 px-6 py-4 text-sm text-slate-400">
            Loading payroll history...
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default AdminPayrollPage
