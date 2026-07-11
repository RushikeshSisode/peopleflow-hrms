import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEmployees } from '../features/employees/employeeSlice'
import { fetchEmploymentTypeOptions } from '../features/employmentTypes/employmentTypeSlice'

function EmployeeListPage() {
  const dispatch = useDispatch()
  const { items, pagination, listStatus, error } = useSelector(
    (state) => state.employees,
  )
  const employmentTypeOptions = useSelector(
    (state) => state.employmentTypes.options,
  )
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    employmentType: '',
    department: '',
  })
  const [activeQuery, setActiveQuery] = useState({
    page: 1,
    limit: 10,
  })

  useEffect(() => {
    dispatch(fetchEmployees(activeQuery))
  }, [activeQuery, dispatch])

  useEffect(() => {
    dispatch(fetchEmploymentTypeOptions())
  }, [dispatch])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    setActiveQuery({
      page: 1,
      limit: 10,
      ...filters,
    })
  }

  function goToPage(nextPage) {
    setActiveQuery((current) => ({
      ...current,
      page: nextPage,
    }))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
              Employee Management
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Manage employee records from one control surface
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Create employees, search the organization, review profiles, and
              activate or deactivate accounts from here.
            </p>
          </div>

          <Link
            className="inline-flex rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            to="/admin/employees/new"
          >
            Add employee
          </Link>
        </div>

        <form
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          onSubmit={handleSearchSubmit}
        >
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name, email, ID"
          />

          <select
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="employmentType"
            value={filters.employmentType}
            onChange={handleFilterChange}
          >
            <option value="">All employment types</option>
            {employmentTypeOptions.map((option) => (
              <option key={option.id} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>

          <input
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            placeholder="Department"
          />

          <button
            type="submit"
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Employment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {items.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">
                      {employee.fullName}
                    </div>
                    <div className="text-slate-400">{employee.email}</div>
                    <div className="mt-1 font-mono text-xs text-emerald-300">
                      {employee.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{employee.designation}</div>
                    <div className="text-slate-400">{employee.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4">{employee.department}</td>
                  <td className="px-6 py-4">{employee.employmentTypeLabel}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        employee.status === 'active'
                          ? 'bg-emerald-300/20 text-emerald-200'
                          : 'bg-amber-300/20 text-amber-200'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        to={`/admin/employees/${employee.id}`}
                      >
                        View
                      </Link>
                      <Link
                        className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        to={`/admin/employees/${employee.id}/edit`}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {listStatus !== 'loading' && items.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-400" colSpan="6">
                    No employees matched your current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {listStatus === 'loading' ? (
          <div className="border-t border-white/10 px-6 py-4 text-sm text-slate-400">
            Loading employees...
          </div>
        ) : null}

        {error ? (
          <div className="border-t border-rose-400/20 bg-rose-400/10 px-6 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-sm text-slate-300">
          <div>
            {`Page ${pagination.page} of ${pagination.totalPages} • ${pagination.total} employees`}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                goToPage(
                  Math.min(pagination.totalPages, pagination.page + 1),
                )
              }
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default EmployeeListPage
