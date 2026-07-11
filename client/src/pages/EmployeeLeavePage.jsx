import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchMyLeaveBalances,
  fetchMyLeaveRequests,
  submitLeaveRequest,
} from '../features/leaves/leaveSlice'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function EmployeeLeavePage() {
  const dispatch = useDispatch()
  const {
    balances,
    myRequests,
    balanceStatus,
    myRequestsStatus,
    submitStatus,
    error,
  } = useSelector((state) => state.leaves)
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    isHalfDay: false,
    halfDaySession: '',
    reason: '',
  })

  useEffect(() => {
    dispatch(fetchMyLeaveBalances())
    dispatch(fetchMyLeaveRequests())
  }, [dispatch])

  useEffect(() => {
    if (!formData.leaveType && balances?.balances?.length > 0) {
      setFormData((current) => ({
        ...current,
        leaveType: balances.balances[0].leaveType,
      }))
    }
  }, [balances, formData.leaveType])

  async function handleSubmit(event) {
    event.preventDefault()

    const action = await dispatch(
      submitLeaveRequest({
        ...formData,
        toDate: formData.isHalfDay ? formData.fromDate : formData.toDate,
      }),
    )

    if (submitLeaveRequest.fulfilled.match(action)) {
      setFormData({
        leaveType: balances?.balances?.[0]?.leaveType || '',
        fromDate: '',
        toDate: '',
        isHalfDay: false,
        halfDaySession: '',
        reason: '',
      })
      dispatch(fetchMyLeaveBalances())
      dispatch(fetchMyLeaveRequests())
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
          My Leave
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Apply for leave and track your remaining balance
        </h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          Your leave balance is inherited from the employment type assigned by admin.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
          <h3 className="text-xl font-semibold text-white">Leave Balances</h3>
          <div className="mt-6 space-y-4">
            {balances?.balances?.map((entry) => (
              <div
                key={entry.leaveType}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{entry.leaveType}</span>
                  <span className="text-sm text-slate-400">
                    {entry.isUnlimited ? 'Unlimited' : `${entry.remaining} remaining`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
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
          </div>
        </div>

        <form
          className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
          onSubmit={handleSubmit}
        >
          <h3 className="text-xl font-semibold text-white">Apply for leave</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Leave type
              </span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300"
                value={formData.leaveType}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    leaveType: event.target.value,
                  }))
                }
              >
                {balances?.balances?.map((entry) => (
                  <option key={entry.leaveType} value={entry.leaveType}>
                    {entry.leaveType}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Half day
              </span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300"
                value={String(formData.isHalfDay)}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    isHalfDay: event.target.value === 'true',
                    halfDaySession:
                      event.target.value === 'true' ? current.halfDaySession : '',
                  }))
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                From date
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300"
                type="date"
                required
                value={formData.fromDate}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                To date
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300 disabled:opacity-50"
                type="date"
                required={!formData.isHalfDay}
                disabled={formData.isHalfDay}
                value={formData.isHalfDay ? formData.fromDate : formData.toDate}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
              />
            </label>

            {formData.isHalfDay ? (
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Half-day session
                </span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300"
                  value={formData.halfDaySession}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      halfDaySession: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a session</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </label>
            ) : null}

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Reason
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-sky-300"
                required
                value={formData.reason}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitStatus === 'loading'}
            className="mt-8 rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitStatus === 'loading' ? 'Submitting...' : 'Submit leave request'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <h3 className="text-xl font-semibold text-white">My Leave Requests</h3>
        <div className="mt-6 space-y-4">
          {myRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-white">{request.leaveType}</span>
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
                    {formatDate(request.fromDate)} to {formatDate(request.toDate)} •{' '}
                    {request.totalDays} day(s)
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{request.reason}</p>
                </div>

                {request.rejectionReason ? (
                  <div className="max-w-sm rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    Rejection reason: {request.rejectionReason}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {myRequestsStatus === 'loading' ? (
            <div className="text-sm text-slate-400">Loading leave history...</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default EmployeeLeavePage
