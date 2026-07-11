import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmploymentTypeForm from '../components/forms/EmploymentTypeForm'
import {
  createEmploymentType,
  fetchEmploymentTypeById,
  resetEmploymentTypeDetail,
  updateEmploymentType,
  updateLeavePolicy,
} from '../features/employmentTypes/employmentTypeSlice'

function EmploymentTypeFormPage({ mode }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { detail, detailStatus, submitStatus, error } = useSelector(
    (state) => state.employmentTypes,
  )

  useEffect(() => {
    if (mode === 'edit' && id) {
      dispatch(fetchEmploymentTypeById(id))
    } else {
      dispatch(resetEmploymentTypeDetail())
    }
  }, [dispatch, id, mode])

  async function handleSubmit(payload) {
    if (mode === 'create') {
      const action = await dispatch(createEmploymentType(payload))

      if (createEmploymentType.fulfilled.match(action)) {
        navigate(`/admin/employment-types/${action.payload.id}`, { replace: true })
      }

      return
    }

    const typeAction = await dispatch(
      updateEmploymentType({
        id,
        payload: {
          name: payload.name,
          description: payload.description,
          isActive: payload.isActive,
        },
      }),
    )

    if (!updateEmploymentType.fulfilled.match(typeAction)) {
      return
    }

    const policyAction = await dispatch(
      updateLeavePolicy({
        id,
        leaveRules: payload.leaveRules,
      }),
    )

    if (updateLeavePolicy.fulfilled.match(policyAction)) {
      navigate(`/admin/employment-types/${policyAction.payload.id}`, {
        replace: true,
      })
    }
  }

  if (mode === 'edit' && detailStatus === 'loading') {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading employment type details...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
            Employment Types
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {mode === 'create'
              ? 'Create a new employment type'
              : 'Update employment type and leave policy'}
          </h2>
        </div>

        <Link
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          to="/admin/employment-types"
        >
          Back to list
        </Link>
      </div>

      <EmploymentTypeForm
        mode={mode}
        initialValues={mode === 'edit' ? detail : null}
        submitStatus={submitStatus}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default EmploymentTypeFormPage
