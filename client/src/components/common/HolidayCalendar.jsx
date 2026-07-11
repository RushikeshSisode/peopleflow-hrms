import { useEffect, useMemo, useState } from 'react'
import {
  WEEKDAY_LABELS,
  buildCalendarGrid,
  createHolidayMap,
  getMonthLabel,
  toDateKey,
} from '../../utils/calendar'

function formatLongDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function HolidayCalendar({ holidays, title = 'Holiday Calendar', compact = false }) {
  const [visibleMonth, setVisibleMonth] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState('')

  const holidayMap = useMemo(() => createHolidayMap(holidays), [holidays])
  const cells = useMemo(
    () => buildCalendarGrid(visibleMonth, holidayMap),
    [visibleMonth, holidayMap],
  )

  const visibleMonthHolidays = useMemo(
    () =>
      holidays
        .filter((holiday) => {
          const holidayDate = new Date(holiday.date)
          return (
            holidayDate.getFullYear() === visibleMonth.getFullYear() &&
            holidayDate.getMonth() === visibleMonth.getMonth()
          )
        })
        .sort((left, right) => new Date(left.date) - new Date(right.date)),
    [holidays, visibleMonth],
  )

  useEffect(() => {
    if (selectedDateKey && holidayMap.has(selectedDateKey)) {
      return
    }

    const firstHoliday = visibleMonthHolidays[0]
    setSelectedDateKey(firstHoliday ? toDateKey(firstHoliday.date) : '')
  }, [holidayMap, selectedDateKey, visibleMonthHolidays])

  const selectedHolidays = selectedDateKey ? holidayMap.get(selectedDateKey) || [] : []

  function goToPreviousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    )
  }

  function goToNextMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    )
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="calendar-grid-scroll">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-300">
            {title}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {getMonthLabel(visibleMonth)}
          </h3>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Next
          </button>
        </div>
      </div>

      <div className={`mt-8 ${compact ? 'grid gap-6 xl:grid-cols-[1.15fr_0.85fr]' : 'grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'}`}>
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
              const hasHoliday = cell.holidays.length > 0
              const isSelected = cell.date && toDateKey(cell.date) === selectedDateKey

              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cell.date}
                  onClick={() => setSelectedDateKey(toDateKey(cell.date))}
                  className={`min-h-24 rounded-2xl border p-3 text-left transition ${
                    !cell.date
                      ? 'cursor-default border-transparent bg-transparent'
                      : hasHoliday
                        ? isSelected
                          ? 'border-sky-300 bg-sky-300/20'
                          : 'border-sky-300/30 bg-sky-300/10 hover:bg-sky-300/15'
                        : isSelected
                          ? 'border-white/20 bg-white/10'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  {cell.date ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {cell.date.getDate()}
                        </span>
                        {hasHoliday ? (
                          <span className="rounded-full bg-sky-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                            Holiday
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 space-y-1">
                        {cell.holidays.slice(0, compact ? 1 : 2).map((holiday) => (
                          <div
                            key={holiday.id}
                            className="rounded-xl bg-slate-950/60 px-2 py-1 text-[11px] text-sky-100"
                          >
                            {holiday.name}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <h4 className="text-lg font-semibold text-white">
            {selectedHolidays.length > 0 ? 'Selected holiday details' : 'Monthly holiday list'}
          </h4>

          {selectedHolidays.length > 0 ? (
            <div className="mt-5 space-y-4">
              {selectedHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4"
                >
                  <div className="text-sm font-semibold text-white">{holiday.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-sky-200">
                    {formatLongDate(holiday.date)}
                  </div>
                  <p className="mt-3 text-sm text-slate-200">
                    {holiday.description || 'No description provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : visibleMonthHolidays.length > 0 ? (
            <div className="mt-5 space-y-3">
              {visibleMonthHolidays.map((holiday) => (
                <button
                  key={holiday.id}
                  type="button"
                  onClick={() => setSelectedDateKey(toDateKey(holiday.date))}
                  className="block w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:bg-slate-950/80"
                >
                  <div className="text-sm font-semibold text-white">{holiday.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {formatLongDate(holiday.date)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
              No holidays fall in this month.
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default HolidayCalendar
