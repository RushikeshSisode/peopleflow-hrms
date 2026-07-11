import { useEffect, useState } from 'react'

function formatDateInput(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().split('T')[0]
}

function HolidayForm({ mode, initialValues, submitStatus, error, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  })

  useEffect(() => {
    if (!initialValues) {
      return
    }

    setFormData({
      name: initialValues.name || '',
      date: formatDateInput(initialValues.date),
      description: initialValues.description || '',
    })
  }, [initialValues])

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(formData)
  }

  return (
    <form
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Holiday name
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            required
            value={formData.name}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Date
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            type="date"
            required
            value={formData.date}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                date: event.target.value,
              }))
            }
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Description
          </span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            value={formData.description}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                description: event.target.value,
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
        className="mt-8 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitStatus === 'loading'
          ? 'Saving...'
          : mode === 'create'
            ? 'Create holiday'
            : 'Update holiday'}
      </button>
    </form>
  )
}

export default HolidayForm
