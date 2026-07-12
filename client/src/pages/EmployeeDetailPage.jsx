import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteEmployee,
  fetchEmployeeById,
  updateEmployeeStatus,
} from '../features/employees/employeeSlice'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function EmployeeDetailPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { detail, detailStatus, deleteStatus, error } = useSelector((state) => state.employees)

  useEffect(() => {
    dispatch(fetchEmployeeById(id))
  }, [dispatch, id])

  async function handleStatusToggle() {
    if (!detail) {
      return
    }

    const nextStatus = detail.status === 'active' ? 'inactive' : 'active'
    await dispatch(updateEmployeeStatus({ id: detail.id, status: nextStatus }))
  }

  async function handleDelete() {
    if (!detail) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${detail.fullName} (${detail.employeeId}) and all related attendance, leave, and payroll records?`,
    )

    if (!confirmed) {
      return
    }

    const action = await dispatch(deleteEmployee(detail.id))

    if (deleteEmployee.fulfilled.match(action)) {
      navigate('/admin/employees', { replace: true })
    }
  }

  if (detailStatus === 'loading' || !detail) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading employee profile...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Employee Profile
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {detail.fullName}
            </h2>
            <p className="mt-2 text-slate-300">
              {detail.designation} in {detail.department}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200">
                {detail.employeeId}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm ${
                  detail.status === 'active'
                    ? 'bg-emerald-300/20 text-emerald-200'
                    : 'bg-amber-300/20 text-amber-200'
                }`}
              >
                {detail.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              to={`/admin/employees/${detail.id}/edit`}
            >
              Edit employee
            </Link>
            <button
              type="button"
              onClick={handleStatusToggle}
              className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            >
              {detail.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteStatus === 'loading'}
              className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-50"
            >
              {deleteStatus === 'loading' ? 'Deleting...' : 'Delete employee'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
          <h3 className="text-xl font-semibold text-white">Core details</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-300">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-1 text-base text-white">{detail.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="mt-1 text-base text-white">{detail.phoneNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date of joining</dt>
              <dd className="mt-1 text-base text-white">
                {formatDate(detail.dateOfJoining)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Monthly salary</dt>
              <dd className="mt-1 text-base text-white">
                {formatCurrency(detail.monthlySalary)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
          <h3 className="text-xl font-semibold text-white">Organization details</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-300">
            <div>
              <dt className="text-slate-500">Employment type</dt>
              <dd className="mt-1 text-base text-white">
                {detail.employmentTypeLabel}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Reporting manager</dt>
              <dd className="mt-1 text-base text-white">
                {detail.reportingManager
                  ? `${detail.reportingManager.fullName} (${detail.reportingManager.employeeId})`
                  : 'Not assigned'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
        <h3 className="text-xl font-semibold text-white">Inherited Leave Policy</h3>
        <div className="mt-6 space-y-3">
          {detail.inheritedLeavePolicy?.leavePolicy?.rules?.length > 0 ? (
            detail.inheritedLeavePolicy.leavePolicy.rules.map((rule) => (
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
              No inherited leave policy found for this employment type yet.
            </div>
          )}
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

export default EmployeeDetailPage
