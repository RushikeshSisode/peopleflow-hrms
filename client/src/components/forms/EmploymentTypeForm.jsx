import { useEffect, useState } from 'react'

function createEmptyRule() {
  return {
    leaveType: '',
    annualDays: '',
    isUnlimited: false,
  }
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
    leaveRules: [createEmptyRule()],
  })

  useEffect(() => {
    if (!initialValues) {
      return
    }

    setFormData({
      name: initialValues.name || '',
      description: initialValues.description || '',
      isActive: initialValues.isActive ?? true,
      leaveRules:
        initialValues.leavePolicy?.rules?.length > 0
          ? initialValues.leavePolicy.rules.map((rule) => ({
              leaveType: rule.leaveType,
              annualDays: rule.isUnlimited ? '' : rule.annualDays,
              isUnlimited: rule.isUnlimited,
            }))
          : [createEmptyRule()],
    })
  }, [initialValues])

  function updateRule(index, changes) {
    setFormData((current) => ({
      ...current,
      leaveRules: current.leaveRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...changes } : rule,
      ),
    }))
  }

  function addRule() {
    setFormData((current) => ({
      ...current,
      leaveRules: [...current.leaveRules, createEmptyRule()],
    }))
  }

  function removeRule(index) {
    setFormData((current) => ({
      ...current,
      leaveRules:
        current.leaveRules.length === 1
          ? [createEmptyRule()]
          : current.leaveRules.filter((_, ruleIndex) => ruleIndex !== index),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
      leaveRules: formData.leaveRules
        .filter((rule) => rule.leaveType.trim())
        .map((rule) => ({
          leaveType: rule.leaveType,
          annualDays: rule.isUnlimited ? 0 : Number(rule.annualDays || 0),
          isUnlimited: rule.isUnlimited,
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Leave Policy</h3>
            <p className="mt-1 text-sm text-slate-400">
              Define the leave rules employees inherit from this employment type.
            </p>
          </div>

          <button
            type="button"
            onClick={addRule}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Add leave rule
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {formData.leaveRules.map((rule, index) => (
            <div
              key={`leave-rule-${index}`}
              className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
            >
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
                placeholder="Leave type"
                value={rule.leaveType}
                onChange={(event) =>
                  updateRule(index, { leaveType: event.target.value })
                }
              />

              <input
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300 disabled:opacity-50"
                type="number"
                min="0"
                placeholder="Annual days"
                disabled={rule.isUnlimited}
                value={rule.annualDays}
                onChange={(event) =>
                  updateRule(index, { annualDays: event.target.value })
                }
              />

              <label className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={rule.isUnlimited}
                  onChange={(event) =>
                    updateRule(index, {
                      isUnlimited: event.target.checked,
                      annualDays: event.target.checked ? '' : rule.annualDays,
                    })
                  }
                />
                Unlimited
              </label>

              <button
                type="button"
                onClick={() => removeRule(index)}
                className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10"
              >
                Remove
              </button>
            </div>
          ))}
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
