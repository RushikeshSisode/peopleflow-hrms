import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import AttendanceCalendar from '../components/common/AttendanceCalendar'
import {
  fetchMyAttendanceCalendar,
  fetchMyAttendanceHistory,
  fetchMyTodayAttendance,
  punchIn,
  punchOut,
} from '../features/attendance/attendanceSlice'
import {
  buildMonthParams,
  formatDuration,
  formatShortDate,
  formatTime,
  getAttendanceStatusTone,
} from '../utils/attendance'
import { toDateKey } from '../utils/calendar'

function EmployeeAttendancePage() {
  const dispatch = useDispatch()
  const {
    today,
    calendar,
    history,
    todayStatus,
    calendarStatus,
    historyStatus,
    punchStatus,
    error,
  } = useSelector((state) => state.attendance)

  const [visibleMonth, setVisibleMonth] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState('')

  useEffect(() => {
    dispatch(fetchMyTodayAttendance())
  }, [dispatch])

  useEffect(() => {
    const params = buildMonthParams(visibleMonth)
    dispatch(fetchMyAttendanceCalendar(params))
    dispatch(fetchMyAttendanceHistory(params))
  }, [dispatch, visibleMonth])

  useEffect(() => {
    if (!calendar?.days?.length) {
      return
    }

    const todayKey = toDateKey(new Date())
    const monthHasToday = calendar.days.some((day) => toDateKey(day.date) === todayKey)
    const selectedDateStillExists = calendar.days.some(
      (day) => toDateKey(day.date) === selectedDateKey,
    )

    if (selectedDateStillExists) {
      return
    }

    if (monthHasToday) {
      setSelectedDateKey(todayKey)
      return
    }

    setSelectedDateKey(toDateKey(calendar.days[0].date))
  }, [calendar, selectedDateKey])

  const selectedDay = useMemo(
    () => calendar?.days?.find((day) => toDateKey(day.date) === selectedDateKey) || null,
    [calendar, selectedDateKey],
  )

  async function refreshMonthData() {
    const params = buildMonthParams(visibleMonth)
    await Promise.all([
      dispatch(fetchMyTodayAttendance()),
      dispatch(fetchMyAttendanceCalendar(params)),
      dispatch(fetchMyAttendanceHistory(params)),
    ])
  }

  async function handlePunchIn() {
    const action = await dispatch(punchIn())

    if (punchIn.fulfilled.match(action)) {
      refreshMonthData()
    }
  }

  async function handlePunchOut() {
    const action = await dispatch(punchOut())

    if (punchOut.fulfilled.match(action)) {
      refreshMonthData()
    }
  }

  const canPunchIn = today?.currentState !== 'in' && today?.status !== 'holiday'
  const canPunchOut = today?.currentState === 'in'

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Attendance Workspace
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-white">
              Track punch logs, working hours, and monthly attendance.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              This page handles daily punch in and punch out, calculates working hours
              with multiple sessions, and shows the calendar status for every day in
              the month.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canPunchIn || punchStatus === 'loading'}
                onClick={handlePunchIn}
                className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {punchStatus === 'loading' ? 'Working...' : 'Punch In'}
              </button>
              <button
                type="button"
                disabled={!canPunchOut || punchStatus === 'loading'}
                onClick={handlePunchOut}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {punchStatus === 'loading' ? 'Working...' : 'Punch Out'}
              </button>
              <Link
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                to="/employee/dashboard"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Today&apos;s Status</h3>
            <div
              className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${getAttendanceStatusTone(
                today?.status || 'not_marked',
              )}`}
            >
              <div className="font-semibold text-white">
                {todayStatus === 'loading' ? 'Loading...' : today?.statusLabel || 'Not marked yet'}
              </div>
              <div className="mt-2 text-slate-200">
                First in: {formatTime(today?.firstPunchIn)}
              </div>
              <div className="mt-1 text-slate-200">
                Last out: {formatTime(today?.lastPunchOut)}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-slate-500">Working</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatDuration(today?.totalWorkMinutes)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-slate-500">Break</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatDuration(today?.totalBreakMinutes)}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Punch Count</p>
          <div className="mt-3 text-3xl font-semibold text-white">{today?.punchCount || 0}</div>
          <p className="mt-2 text-sm text-slate-400">All punch logs recorded for today</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Working Hours</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatDuration(today?.totalWorkMinutes)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Combined across multiple sessions</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Break Duration</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatDuration(today?.totalBreakMinutes)}
          </div>
          <p className="mt-2 text-sm text-slate-400">Time between punch out and next punch in</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Late Mark</p>
          <div className="mt-3 text-3xl font-semibold text-white">
            {today?.lateMark ? 'Yes' : 'No'}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {today?.lateMark
              ? `${formatDuration(today?.lateByMinutes)} after office start`
              : 'On time or not punched in yet'}
          </p>
        </div>
      </section>

      <AttendanceCalendar
        calendar={calendar}
        visibleMonth={visibleMonth}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
        onPreviousMonth={() =>
          setVisibleMonth(
            (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
          )
        }
        onNextMonth={() =>
          setVisibleMonth(
            (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
          )
        }
      />

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
              Attendance History
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              Recent daily records
            </h3>
          </div>
          {selectedDay ? (
            <div className="text-sm text-slate-400">Selected: {formatShortDate(selectedDay.date)}</div>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {history.slice(0, 10).map((day) => (
            <div
              key={day.date}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="font-semibold text-white">{formatShortDate(day.date)}</div>
                <div className="mt-1 text-sm text-slate-400">
                  First in {formatTime(day.firstPunchIn)} • Last out {formatTime(day.lastPunchOut)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getAttendanceStatusTone(
                    day.status,
                  )}`}
                >
                  {day.statusLabel}
                </span>
                <span className="text-sm text-slate-300">
                  Work {formatDuration(day.totalWorkMinutes)}
                </span>
                <span className="text-sm text-slate-400">
                  Break {formatDuration(day.totalBreakMinutes)}
                </span>
              </div>
            </div>
          ))}

          {historyStatus === 'loading' || calendarStatus === 'loading' ? (
            <div className="text-sm text-slate-400">Loading attendance records...</div>
          ) : null}

          {!history.length && historyStatus !== 'loading' ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
              No attendance records found for this month yet.
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default EmployeeAttendancePage
