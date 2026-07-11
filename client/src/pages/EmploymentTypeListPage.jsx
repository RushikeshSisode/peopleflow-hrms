import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEmploymentTypes } from '../features/employmentTypes/employmentTypeSlice'

function EmploymentTypeListPage() {
  const dispatch = useDispatch()
  const { items, listStatus, error } = useSelector(
    (state) => state.employmentTypes,
  )

  useEffect(() => {
    dispatch(fetchEmploymentTypes())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Employment Types
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Define employee categories and the leave rules attached to them
            </h2>
            <p className="mt-3 max-w-3xl text-slate-300">
              Each employment type acts as a reusable policy template that
              employees inherit when they are assigned to that category.
            </p>
          </div>

          <Link
            className="inline-flex rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            to="/admin/employment-types/new"
          >
            Add employment type
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {items.map((type) => (
          <article
            key={type.id}
            className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold text-white">{type.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      type.isActive
                        ? 'bg-emerald-300/20 text-emerald-200'
                        : 'bg-amber-300/20 text-amber-200'
                    }`}
                  >
                    {type.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                  {type.code}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {type.description || 'No description added yet.'}
                </p>
              </div>

              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                to={`/admin/employment-types/${type.id}`}
              >
                Manage
              </Link>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Leave Rules
              </h4>
              <div className="mt-4 space-y-3">
                {type.leavePolicy.rules.length > 0 ? (
                  type.leavePolicy.rules.map((rule) => (
                    <div
                      key={`${type.id}-${rule.leaveType}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      <span>{rule.leaveType}</span>
                      <span className="font-semibold text-white">
                        {rule.isUnlimited ? 'Unlimited' : `${rule.annualDays} days`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                    No leave rules assigned yet.
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {listStatus === 'loading' ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Loading employment types...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-6 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default EmploymentTypeListPage
