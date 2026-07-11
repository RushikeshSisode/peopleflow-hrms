import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteHoliday,
  fetchHolidays,
} from '../features/holidays/holidaySlice'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function AdminHolidayListPage() {
  const dispatch = useDispatch()
  const { items, listStatus, deleteStatus, error } = useSelector(
    (state) => state.holidays,
  )

  useEffect(() => {
    dispatch(fetchHolidays())
  }, [dispatch])

  async function handleDelete(id) {
    const shouldDelete = window.confirm('Delete this holiday?')

    if (!shouldDelete) {
      return
    }

    const action = await dispatch(deleteHoliday(id))

    if (deleteHoliday.fulfilled.match(action)) {
      dispatch(fetchHolidays())
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Holiday Management
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Manage the annual holiday calendar used across the HRMS
            </h2>
          </div>

          <Link
            className="inline-flex rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            to="/admin/holidays/new"
          >
            Add holiday
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        {items.map((holiday) => (
          <article
            key={holiday.id}
            className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{holiday.name}</h3>
                <p className="mt-2 text-sm text-emerald-200">{formatDate(holiday.date)}</p>
                <p className="mt-3 text-sm text-slate-300">
                  {holiday.description || 'No description added yet.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  to={`/admin/holidays/${holiday.id}/edit`}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(holiday.id)}
                  disabled={deleteStatus === 'loading'}
                  className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60"
                >
                  Delete
                </button>
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

export default AdminHolidayListPage
