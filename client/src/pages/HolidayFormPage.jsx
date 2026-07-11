import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import HolidayForm from '../components/forms/HolidayForm'
import {
  createHoliday,
  fetchHolidayById,
  resetHolidayDetail,
  updateHoliday,
} from '../features/holidays/holidaySlice'

function HolidayFormPage({ mode }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { detail, detailStatus, submitStatus, error } = useSelector(
    (state) => state.holidays,
  )

  useEffect(() => {
    if (mode === 'edit' && id) {
      dispatch(fetchHolidayById(id))
    } else {
      dispatch(resetHolidayDetail())
    }
  }, [dispatch, id, mode])

  async function handleSubmit(payload) {
    const action =
      mode === 'create'
        ? await dispatch(createHoliday(payload))
        : await dispatch(updateHoliday({ id, payload }))

    const succeeded =
      mode === 'create'
        ? createHoliday.fulfilled.match(action)
        : updateHoliday.fulfilled.match(action)

    if (succeeded) {
      navigate('/admin/holidays', { replace: true })
    }
  }

  if (mode === 'edit' && detailStatus === 'loading') {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading holiday details...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-emerald-300">
            Holiday Management
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {mode === 'create' ? 'Create a new holiday' : 'Update holiday details'}
          </h2>
        </div>

        <Link
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          to="/admin/holidays"
        >
          Back to list
        </Link>
      </div>

      <HolidayForm
        mode={mode}
        initialValues={mode === 'edit' ? detail : null}
        submitStatus={submitStatus}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default HolidayFormPage
