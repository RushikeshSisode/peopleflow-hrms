import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchMyTodayAttendance } from '../features/attendance/attendanceSlice'
import { fetchDashboardByRole } from '../features/auth/authService'
import { fetchHolidays } from '../features/holidays/holidaySlice'
import {
  fetchMyLeaveBalances,
  fetchMyLeaveRequests,
} from '../features/leaves/leaveSlice'
import { useAuth } from '../hooks/useAuth'
import { formatDuration, formatTime, getAttendanceStatusTone } from '../utils/attendance'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function EmployeeDashboard({ panel }) {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const {
    balances,
    myRequests,
    balanceStatus,
    myRequestsStatus,
    error: leaveError,
  } = useSelector((state) => state.leaves)
  const {
    today: todayAttendance,
    todayStatus: attendanceStatus,
    error: attendanceError,
  } = useSelector((state) => state.attendance)
  const {
    items: holidays,
    listStatus: holidaysStatus,
    error: holidayError,
  } = useSelector((state) => state.holidays)

  useEffect(() => {
    dispatch(fetchMyLeaveBalances())
    dispatch(fetchMyLeaveRequests())
    dispatch(fetchHolidays())
    dispatch(fetchMyTodayAttendance())
  }, [dispatch])

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const upcomingHolidays = useMemo(
    () =>
      holidays
        .filter((holiday) => new Date(holiday.date) >= today)
        .sort((left, right) => new Date(left.date) - new Date(right.date))
        .slice(0, 3),
    [holidays, today],
  )

  const pendingRequestsCount = myRequests.filter(
    (request) => request.status === 'pending',
  ).length
  const approvedRequestsCount = myRequests.filter(
    (request) => request.status === 'approved',
  ).length
  const totalRemainingLeaveDays = (balances?.balances || []).reduce(
    (total, entry) => total + (entry.isUnlimited ? 0 : entry.remaining || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.18),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
              Employee Workspace
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-white">
              Welcome back, {user?.fullName}.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              {panel?.message ||
                'This dashboard brings together the information employees use most often: leave balances, leave requests, and upcoming holidays.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
                to="/employee/leaves"
              >
                Apply for leave
              </Link>
              <Link
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/attendance"
              >
                Open attendance
              </Link>
              <Link
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/holidays"
              >
                Open holiday calendar
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Employee Profile</h3>
            <dl className="mt-5 space-y-4 text-sm text-slate-300">
              <div>
                <dt className="text-slate-500">Employee ID</dt>
                <dd className="mt-1 text-base text-white">
                  {user?.employee?.employeeId || 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Employment type</dt>
                <dd className="mt-1 text-base text-white">
                  {user?.employee?.employmentType?.replaceAll('_', ' ') || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Designation</dt>
                <dd className="mt-1 text-base text-white">
                  {user?.employee?.designation || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 text-base text-white">{user?.email}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Today&apos;s Work
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {attendanceStatus === 'loading'
              ? '...'
              : formatDuration(todayAttendance?.totalWorkMinutes)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Working hours logged so far today</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Today&apos;s Break
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {attendanceStatus === 'loading'
              ? '...'
              : formatDuration(todayAttendance?.totalBreakMinutes)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Break duration between sessions</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Remaining Leave
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {balanceStatus === 'loading' ? '...' : totalRemainingLeaveDays}
          </div>
          <p className="mt-2 text-sm text-slate-400">Total remaining days across fixed leave buckets</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Pending Requests
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {myRequestsStatus === 'loading' ? '...' : pendingRequestsCount}
          </div>
          <p className="mt-2 text-sm text-slate-400">Requests waiting for admin review</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Approved Leaves
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {myRequestsStatus === 'loading' ? '...' : approvedRequestsCount}
          </div>
          <p className="mt-2 text-sm text-slate-400">Approved requests in your history</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Upcoming Holidays
          </p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {holidaysStatus === 'loading' ? '...' : upcomingHolidays.length}
          </div>
          <p className="mt-2 text-sm text-slate-400">Holidays coming up on the calendar</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
                Leave Snapshot
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Current balance by leave type
              </h3>
            </div>

            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              to="/employee/leaves"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {(balances?.balances || []).slice(0, 4).map((entry) => (
              <div
                key={entry.leaveType}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{entry.leaveType}</span>
                  <span className="text-sm text-slate-300">
                    {entry.isUnlimited ? 'Unlimited' : `${entry.remaining} left`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                  <div>
                    <div>Allocated</div>
                    <div className="mt-1 text-base text-white">
                      {entry.isUnlimited ? 'Unlimited' : entry.allocated}
                    </div>
                  </div>
                  <div>
                    <div>Used</div>
                    <div className="mt-1 text-base text-white">{entry.used}</div>
                  </div>
                  <div>
                    <div>Remaining</div>
                    <div className="mt-1 text-base text-white">
                      {entry.isUnlimited ? 'Unlimited' : entry.remaining}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {balanceStatus === 'loading' ? (
              <div className="text-sm text-slate-400">Loading leave balances...</div>
            ) : null}

            {!balances?.balances?.length && balanceStatus !== 'loading' ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                No leave balance records found yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-emerald-300">
                  Today&apos;s Attendance
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Quick attendance summary
                </h3>
              </div>

              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/attendance"
              >
                Open attendance page
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              <div
                className={`rounded-2xl border px-4 py-4 text-sm ${getAttendanceStatusTone(
                  todayAttendance?.status || 'not_marked',
                )}`}
              >
                <div className="font-semibold text-white">
                  {todayAttendance?.statusLabel || 'Not marked yet'}
                </div>
                <div className="mt-2 text-slate-200">
                  First in: {formatTime(todayAttendance?.firstPunchIn)}
                </div>
                <div className="mt-1 text-slate-200">
                  Last out: {formatTime(todayAttendance?.lastPunchOut)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-slate-500">Sessions</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {todayAttendance?.punchCount || 0} punches
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-slate-500">Late Mark</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {todayAttendance?.lateMark ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {attendanceStatus === 'loading' ? (
                <div className="text-sm text-slate-400">Loading today&apos;s attendance...</div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-emerald-300">
                  Request Status
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Recent leave activity
                </h3>
              </div>

              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/leaves"
              >
                Open leave page
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {myRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{request.leaveType}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {formatDate(request.fromDate)} to {formatDate(request.toDate)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === 'approved'
                          ? 'bg-emerald-300/20 text-emerald-200'
                          : request.status === 'rejected'
                            ? 'bg-rose-300/20 text-rose-200'
                            : 'bg-amber-300/20 text-amber-200'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}

              {myRequestsStatus === 'loading' ? (
                <div className="text-sm text-slate-400">Loading leave history...</div>
              ) : null}

              {!myRequests.length && myRequestsStatus !== 'loading' ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  No leave requests submitted yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
                  Holiday Watch
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Upcoming holidays
                </h3>
              </div>

              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/holidays"
              >
                View calendar
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="font-semibold text-white">{holiday.name}</div>
                  <div className="mt-1 text-sm text-sky-200">{formatDate(holiday.date)}</div>
                  <p className="mt-2 text-sm text-slate-400">
                    {holiday.description || 'No description provided.'}
                  </p>
                </div>
              ))}

              {holidaysStatus === 'loading' ? (
                <div className="text-sm text-slate-400">Loading holiday list...</div>
              ) : null}

              {!upcomingHolidays.length && holidaysStatus !== 'loading' ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  No upcoming holidays were found.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      {leaveError || holidayError || attendanceError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {leaveError || holidayError || attendanceError}
        </div>
      ) : null}
    </div>
  )
}

function AdminDashboard({ panel, error }) {
  const { user } = useAuth()

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
          Protected Area
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {panel?.title || 'Loading dashboard...'}
        </h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          {panel?.message ||
            'This page loads only after the access token is attached and the backend accepts your role.'}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            to="/admin/employees"
          >
            Manage employees
          </Link>
          <Link
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/admin/payroll"
          >
            Run payroll
          </Link>
          <Link
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/admin/attendance"
          >
            Review attendance
          </Link>
          <Link
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/admin/leaves"
          >
            Review leave requests
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <h3 className="text-lg font-semibold text-white">Session Snapshot</h3>
        <dl className="mt-6 space-y-4 text-sm text-slate-300">
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="mt-1 text-base text-white">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 text-base text-white">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="mt-1 text-base text-white">{user?.fullName}</dd>
          </div>
        </dl>

      </aside>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const [panel, setPanel] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        const data = await fetchDashboardByRole(user.role)

        if (mounted) {
          setPanel(data)
          setError('')
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load protected dashboard data.',
          )
        }
      }
    }

    if (user?.role) {
      loadDashboard()
    }

    return () => {
      mounted = false
    }
  }, [user?.role])

  if (user?.role === 'employee') {
    return <EmployeeDashboard panel={panel} />
  }

  return <AdminDashboard panel={panel} error={error} />
}

export default DashboardPage
