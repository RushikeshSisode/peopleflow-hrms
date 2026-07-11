import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHolidays } from '../features/holidays/holidaySlice'
import HolidayCalendar from '../components/common/HolidayCalendar'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function EmployeeHolidayPage() {
  const dispatch = useDispatch()
  const { items, listStatus, error } = useSelector((state) => state.holidays)

  useEffect(() => {
    dispatch(fetchHolidays())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
          Holiday Calendar
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Browse upcoming company and public holidays
        </h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          These dates will later be used by attendance and payroll calculations.
        </p>
      </section>

      <HolidayCalendar holidays={items} title="Holiday Calendar View" />

      <section className="space-y-4">
        {items.map((holiday) => (
          <article
            key={holiday.id}
            className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{holiday.name}</h3>
                <p className="mt-2 text-sm text-sky-200">{formatDate(holiday.date)}</p>
                <p className="mt-3 text-sm text-slate-300">
                  {holiday.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </article>
        ))}

        {listStatus === 'loading' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            Loading holidays...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-6 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default EmployeeHolidayPage
