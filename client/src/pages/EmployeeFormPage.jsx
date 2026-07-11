import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmployeeForm from '../components/forms/EmployeeForm'
import {
  createEmployee,
  fetchEmployeeById,
  fetchManagers,
  resetEmployeeDetail,
  updateEmployee,
} from '../features/employees/employeeSlice'
import { fetchEmploymentTypeOptions } from '../features/employmentTypes/employmentTypeSlice'

function EmployeeFormPage({ mode }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { detail, detailStatus, submitStatus, managers, error } = useSelector(
    (state) => state.employees,
  )
  const employmentTypeOptions = useSelector(
    (state) => state.employmentTypes.options,
  )

  useEffect(() => {
    dispatch(fetchManagers())
    dispatch(fetchEmploymentTypeOptions())

    if (mode === 'edit' && id) {
      dispatch(fetchEmployeeById(id))
    } else {
      dispatch(resetEmployeeDetail())
    }
  }, [dispatch, id, mode])

  async function handleSubmit(payload) {
    const action =
      mode === 'create'
        ? await dispatch(createEmployee(payload))
        : await dispatch(updateEmployee({ id, payload }))

    const succeeded =
      mode === 'create'
        ? createEmployee.fulfilled.match(action)
        : updateEmployee.fulfilled.match(action)

    if (succeeded) {
      navigate(`/admin/employees/${action.payload.id}`, { replace: true })
    }
  }

  if (mode === 'edit' && detailStatus === 'loading') {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading employee details...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
            Employee Management
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {mode === 'create' ? 'Create a new employee' : 'Update employee details'}
          </h2>
        </div>

        <Link
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          to="/admin/employees"
        >
          Back to list
        </Link>
      </div>

      <EmployeeForm
        mode={mode}
        initialValues={mode === 'edit' ? detail : null}
        managers={
          mode === 'edit'
            ? managers.filter((manager) => manager.id !== detail?.id)
            : managers
        }
        employmentTypeOptions={employmentTypeOptions.map((option) => ({
          value: option.code,
          label: option.name,
          hasLeavePolicy: option.hasLeavePolicy,
        }))}
        submitStatus={submitStatus}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default EmployeeFormPage
