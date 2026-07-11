import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAdminAttendanceRecords,
  fetchAdminAttendanceReport,
} from '../features/attendance/attendanceSlice'
import { fetchEmployees } from '../features/employees/employeeSlice'
import {
  formatDuration,
  formatShortDate,
  formatTime,
  getAttendanceStatusTone,
} from '../utils/attendance'

function buildAttendanceFilters(filters) {
  if (filters.dateFrom && filters.dateTo) {
    return {
      employeeId: filters.employeeId || undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }
  }

  return {
    employeeId: filters.employeeId || undefined,
    month: Number(filters.month),
    year: Number(filters.year),
  }
}

function AdminAttendancePage() {
  const dispatch = useDispatch()
  const {
    adminRecords,
    adminReport,
    adminRecordsStatus,
    adminReportStatus,
    error,
  } = useSelector((state) => state.attendance)
  const { items: employees } = useSelector((state) => state.employees)

  const [filters, setFilters] = useState(() => {
    const today = new Date()
    return {
      employeeId: '',
      month: String(today.getMonth() + 1),
      year: String(today.getFullYear()),
      dateFrom: '',
      dateTo: '',
    }
  })

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 200, page: 1 }))
  }, [dispatch])

  useEffect(() => {
    const params = buildAttendanceFilters(filters)
    dispatch(fetchAdminAttendanceReport(params))
    dispatch(fetchAdminAttendanceRecords(params))
  }, [dispatch, filters])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Employees',
        value: adminReport?.summary?.totalEmployees || 0,
        note: 'Employees included in the current report',
      },
      {
        label: 'Present Days',
        value: adminReport?.summary?.presentDays || 0,
        note: 'All full-day present records',
      },
      {
        label: 'Absent Days',
        value: adminReport?.summary?.absentDays || 0,
        note: 'Working days with no attendance or leave',
      },
      {
        label: 'Late Marks',
        value: adminReport?.summary?.lateMarks || 0,
        note: 'Late arrivals after 09:30 AM',
      },
    ],
    [adminReport],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
          Attendance Administration
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Review attendance records and monthly attendance reports
        </h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Working days are calculated using weekdays and excluding holidays. Late mark
          deduction is calculated with the assignment rule: every 3 late marks equals
          0.5 day deduction.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
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
              <option value="">All employees</option>
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Date From</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateFrom: event.target.value,
                }))
              }
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Date To</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateTo: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Tip: if you fill both date fields, the report uses that exact range. Otherwise
          it uses the selected month and year.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
            <div className="mt-3 text-3xl font-semibold text-white">{card.value}</div>
            <p className="mt-2 text-sm text-slate-400">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
              Employee Reports
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Attendance report by employee
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {adminReport?.employees?.map((report) => (
            <div
              key={report.employee.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-semibold text-white">{report.employee.fullName}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {report.employee.employeeId} • {report.employee.designation}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 lg:grid-cols-5">
                  <div>Working: {report.totalWorkingDays}</div>
                  <div>Present: {report.presentDays}</div>
                  <div>Absent: {report.absentDays}</div>
                  <div>Late: {report.lateMarks}</div>
                  <div>Deduction: {report.lateDeductionDays} day</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  Paid leave days: <span className="text-white">{report.paidLeaveDays}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  Unpaid leave days: <span className="text-white">{report.unpaidLeaveDays}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  Half days: <span className="text-white">{report.halfDays}</span>
                </div>
              </div>
            </div>
          ))}

          {adminReportStatus === 'loading' ? (
            <div className="text-sm text-slate-400">Loading attendance report...</div>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-emerald-300">
            Daily Records
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Attendance log view
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Employee</th>
                <th className="px-6 py-4 text-left font-medium">Date</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-left font-medium">First In</th>
                <th className="px-6 py-4 text-left font-medium">Last Out</th>
                <th className="px-6 py-4 text-left font-medium">Work</th>
                <th className="px-6 py-4 text-left font-medium">Break</th>
                <th className="px-6 py-4 text-left font-medium">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {adminRecords.slice(0, 80).map((record) => (
                <tr key={`${record.employee.id}-${record.date}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{record.employee.fullName}</div>
                    <div className="text-slate-400">{record.employee.employeeId}</div>
                  </td>
                  <td className="px-6 py-4">{formatShortDate(record.date)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getAttendanceStatusTone(
                        record.status,
                      )}`}
                    >
                      {record.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatTime(record.firstPunchIn)}</td>
                  <td className="px-6 py-4">{formatTime(record.lastPunchOut)}</td>
                  <td className="px-6 py-4">{formatDuration(record.totalWorkMinutes)}</td>
                  <td className="px-6 py-4">{formatDuration(record.totalBreakMinutes)}</td>
                  <td className="px-6 py-4">
                    {record.lateMark ? `${formatDuration(record.lateByMinutes)} late` : 'No'}
                  </td>
                </tr>
              ))}

              {!adminRecords.length && adminRecordsStatus !== 'loading' ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-400" colSpan="8">
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {adminRecordsStatus === 'loading' ? (
          <div className="border-t border-white/10 px-6 py-4 text-sm text-slate-400">
            Loading attendance records...
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

export default AdminAttendancePage
