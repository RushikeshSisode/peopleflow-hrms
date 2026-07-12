import { useEffect, useState } from 'react'

const FIXED_LEAVE_TYPES = [
  { key: 'casual_leave', label: 'Casual Leave', helper: 'Short planned time off.' },
  { key: 'sick_leave', label: 'Sick Leave', helper: 'Health-related leave balance.' },
  { key: 'paid_leave', label: 'Paid Leave', helper: 'General paid leave used for adjustments too.' },
  { key: 'unpaid_leave', label: 'Unpaid Leave', helper: 'Approved leave that still deducts salary.' },
]

function normalizeLeaveTypeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildLeaveRulesFromInitialValues(initialRules = []) {
  const daysByType = new Map(
    initialRules.map((rule) => [normalizeLeaveTypeKey(rule.leaveType), String(rule.annualDays ?? 0)]),
  )

  return FIXED_LEAVE_TYPES.map((type) => ({
    leaveType: type.label,
    annualDays: daysByType.get(type.key) || '0',
  }))
}

function EmploymentTypeForm({
  mode,
  initialValues,
  submitStatus,
  error,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    leaveRules: buildLeaveRulesFromInitialValues(),
  })

  useEffect(() => {
    if (!initialValues) {
      return
    }

    setFormData({
      name: initialValues.name || '',
      description: initialValues.description || '',
      isActive: initialValues.isActive ?? true,
      leaveRules: buildLeaveRulesFromInitialValues(initialValues.leavePolicy?.rules),
    })
  }, [initialValues])

  function updateRule(leaveType, annualDays) {
    setFormData((current) => ({
      ...current,
      leaveRules: current.leaveRules.map((rule) =>
        rule.leaveType === leaveType ? { ...rule, annualDays } : rule,
      ),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
      leaveRules: formData.leaveRules.map((rule) => ({
        leaveType: rule.leaveType,
        annualDays: Number(rule.annualDays || 0),
        isUnlimited: false,
      })),
    })
  }

  return (
    <form
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Employment type name
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
            Status
          </span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            value={String(formData.isActive)}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                isActive: event.target.value === 'true',
              }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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

      <div className="mt-10">
        <div>
          <h3 className="text-lg font-semibold text-white">Leave Policy</h3>
          <p className="mt-1 text-sm text-slate-400">
            Every employment type uses the same four leave types. Admin can only assign annual days.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {FIXED_LEAVE_TYPES.map((type) => {
            const currentRule = formData.leaveRules.find((rule) => rule.leaveType === type.label)

            return (
              <label
                key={type.key}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5"
              >
                <span className="block text-base font-semibold text-white">{type.label}</span>
                <span className="mt-1 block text-sm text-slate-400">{type.helper}</span>
                <input
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
                  type="number"
                  min="0"
                  step="0.5"
                  value={currentRule?.annualDays || '0'}
                  onChange={(event) => updateRule(type.label, event.target.value)}
                />
              </label>
            )
          })}
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-8">
        <button
          type="submit"
          disabled={submitStatus === 'loading'}
          className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitStatus === 'loading'
            ? 'Saving...'
            : mode === 'create'
              ? 'Create employment type'
              : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default EmploymentTypeForm
