import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fetchEmploymentTypeById } from '../features/employmentTypes/employmentTypeSlice'

function EmploymentTypeDetailPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const { detail, detailStatus, error } = useSelector(
    (state) => state.employmentTypes,
  )
  const hasValidId = /^[a-f\d]{24}$/i.test(id || '')

  useEffect(() => {
    if (hasValidId) {
      dispatch(fetchEmploymentTypeById(id))
    }
  }, [dispatch, hasValidId, id])

  if (hasValidId && (detailStatus === 'idle' || detailStatus === 'loading')) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading employment type...
      </div>
    )
  }

  if (!hasValidId || detailStatus === 'failed' || !detail) {
    return (
      <div className="rounded-[2rem] border border-rose-400/30 bg-rose-400/10 p-8 text-rose-100">
        <p>{!hasValidId ? 'This employment type link is invalid.' : error}</p>
        <Link
          className="mt-5 inline-flex rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold"
          to="/admin/employment-types"
        >
          Back to employment types
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Employment Type Profile
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {detail.name}
            </h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
              {detail.code}
            </p>
            <p className="mt-4 max-w-2xl text-slate-300">
              {detail.description || 'No description added yet.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                detail.isActive
                  ? 'bg-emerald-300/20 text-emerald-200'
                  : 'bg-amber-300/20 text-amber-200'
              }`}
            >
              {detail.isActive ? 'Active' : 'Inactive'}
            </span>
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              to={`/admin/employment-types/${detail.id}/edit`}
            >
              Edit
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <h3 className="text-xl font-semibold text-white">Assigned Leave Policy</h3>
        <div className="mt-6 space-y-3">
          {detail.leavePolicy.rules.length > 0 ? (
            detail.leavePolicy.rules.map((rule) => (
              <div
                key={`${detail.id}-${rule.leaveType}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
              >
                <span>{rule.leaveType}</span>
                <span className="font-semibold text-white">
                  {rule.isUnlimited ? 'Unlimited' : `${rule.annualDays} days / year`}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
              No leave policy has been assigned yet.
            </div>
          )}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-6 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default EmploymentTypeDetailPage
