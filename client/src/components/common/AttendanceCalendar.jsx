import { useMemo } from 'react'
import { WEEKDAY_LABELS, getMonthLabel, toDateKey } from '../../utils/calendar'
import {
  formatDuration,
  formatLongDate,
  formatTime,
  getAttendanceStatusTone,
} from '../../utils/attendance'

function buildMonthCells(visibleMonth, days) {
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
  const leadingEmptyDays = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const dayMap = new Map(days.map((day) => [toDateKey(day.date), day]))
  const cells = []

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      date: null,
      entry: null,
    })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
    const key = toDateKey(cellDate)
    cells.push({
      key,
      date: cellDate,
      entry: dayMap.get(key) || null,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      date: null,
      entry: null,
    })
  }

  return cells
}

function AttendanceCalendar({
  calendar,
  visibleMonth,
  selectedDateKey,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}) {
  const days = useMemo(() => calendar?.days || [], [calendar?.days])
  const cells = useMemo(
    () => buildMonthCells(visibleMonth, days),
    [days, visibleMonth],
  )

  const selectedDay = useMemo(
    () => days.find((day) => toDateKey(day.date) === selectedDateKey) || null,
    [days, selectedDateKey],
  )

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="calendar-grid-scroll">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-300">
            Attendance Calendar
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {getMonthLabel(visibleMonth)}
          </h3>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-slate-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {cells.map((cell) => {
              const isSelected = cell.date && toDateKey(cell.date) === selectedDateKey
              const status = cell.entry?.status
              const tone = cell.entry
                ? getAttendanceStatusTone(status)
                : 'border-transparent bg-transparent text-transparent'

              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cell.date}
                  onClick={() => cell.date && onSelectDate(toDateKey(cell.date))}
                  className={`min-h-24 rounded-2xl border p-3 text-left transition ${
                    !cell.date
                      ? 'cursor-default border-transparent bg-transparent'
                      : isSelected
                        ? `${tone} ring-1 ring-white/20`
                        : `${tone} hover:bg-white/10`
                  }`}
                >
                  {cell.date ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {cell.date.getDate()}
                        </span>
                        {cell.entry ? (
                          <span className="text-[10px] uppercase tracking-[0.14em] text-current">
                            {cell.entry.statusLabel}
                          </span>
                        ) : null}
                      </div>

                      {cell.entry ? (
                        <div className="mt-3 space-y-1 text-[11px] text-slate-100">
                          {cell.entry.holiday ? (
                            <div className="truncate rounded-xl bg-slate-950/40 px-2 py-1">
                              {cell.entry.holiday.name}
                            </div>
                          ) : null}
                          {cell.entry.leave ? (
                            <div className="truncate rounded-xl bg-slate-950/40 px-2 py-1">
                              {cell.entry.leave.leaveType}
                            </div>
                          ) : null}
                          {cell.entry.logs.length > 0 ? (
                            <div className="truncate rounded-xl bg-slate-950/40 px-2 py-1">
                              {formatDuration(cell.entry.totalWorkMinutes)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <h4 className="text-lg font-semibold text-white">
            {selectedDay ? 'Selected day details' : 'Select a date'}
          </h4>

          {selectedDay ? (
            <div className="mt-5 space-y-4">
              <div
                className={`rounded-2xl border px-4 py-4 ${getAttendanceStatusTone(
                  selectedDay.status,
                )}`}
              >
                <div className="text-sm font-semibold text-white">
                  {formatLongDate(selectedDay.date)}
                </div>
                <div className="mt-2 text-sm">{selectedDay.statusLabel}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-300">
                  <div className="text-slate-500">Working Hours</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {formatDuration(selectedDay.totalWorkMinutes)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-slate-300">
                  <div className="text-slate-500">Break Duration</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {formatDuration(selectedDay.totalBreakMinutes)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500">First Punch In</div>
                    <div className="mt-1 text-white">
                      {formatTime(selectedDay.firstPunchIn)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Last Punch Out</div>
                    <div className="mt-1 text-white">
                      {formatTime(selectedDay.lastPunchOut)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedDay.leave ? (
                <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-sky-100">
                  Leave: {selectedDay.leave.leaveType}
                  {selectedDay.leave.isHalfDay
                    ? ` (${selectedDay.leave.halfDaySession === 'first_half' ? 'First half' : 'Second half'})`
                    : ''}
                </div>
              ) : null}

              {selectedDay.holiday ? (
                <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-4 text-sm text-fuchsia-100">
                  Holiday: {selectedDay.holiday.name}
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="text-sm font-semibold text-white">Punch timeline</div>
                {selectedDay.logs.length > 0 ? (
                  selectedDay.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="uppercase tracking-[0.14em] text-slate-500">
                        {log.action}
                      </span>
                      <span className="text-white">{formatTime(log.timestamp)}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
                    No punch logs recorded for this day.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
              Pick any date in the month to inspect attendance, leave, or holiday details.
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default AttendanceCalendar
