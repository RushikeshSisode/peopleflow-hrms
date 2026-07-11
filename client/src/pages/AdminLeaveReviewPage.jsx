import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  approveLeave,
  fetchAdminLeaveRequests,
  rejectLeave,
} from '../features/leaves/leaveSlice'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function AdminLeaveReviewPage() {
  const dispatch = useDispatch()
  const { adminRequests, adminRequestsStatus, reviewStatus, error } = useSelector(
    (state) => state.leaves,
  )
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    dispatch(fetchAdminLeaveRequests(statusFilter ? { status: statusFilter } : {}))
  }, [dispatch, statusFilter])

  async function handleApprove(id) {
    const action = await dispatch(approveLeave(id))

    if (approveLeave.fulfilled.match(action)) {
      dispatch(fetchAdminLeaveRequests(statusFilter ? { status: statusFilter } : {}))
    }
  }

  async function handleReject(id) {
    const rejectionReason = window.prompt('Enter a rejection reason (optional):', '')

    if (rejectionReason === null) {
      return
    }

    const action = await dispatch(rejectLeave({ id, rejectionReason }))

    if (rejectLeave.fulfilled.match(action)) {
      dispatch(fetchAdminLeaveRequests(statusFilter ? { status: statusFilter } : {}))
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Leave Administration
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Review employee leave requests and update their final status
            </h2>
          </div>

          <select
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {adminRequests.map((request) => (
          <article
            key={request.id}
            className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {request.employee?.fullName || 'Employee'}
                  </h3>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
                    {request.employee?.employeeId}
                  </span>
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

                <p className="mt-3 text-sm text-slate-300">
                  {request.leaveType} • {formatDate(request.fromDate)} to{' '}
                  {formatDate(request.toDate)} • {request.totalDays} day(s)
                </p>
                <p className="mt-2 text-sm text-slate-400">{request.reason}</p>

                {request.rejectionReason ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    Rejection reason: {request.rejectionReason}
                  </div>
                ) : null}
              </div>

              {request.status === 'pending' ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id)}
                    disabled={reviewStatus === 'loading'}
                    className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(request.id)}
                    disabled={reviewStatus === 'loading'}
                    className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {adminRequestsStatus === 'loading' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            Loading leave requests...
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

export default AdminLeaveReviewPage
