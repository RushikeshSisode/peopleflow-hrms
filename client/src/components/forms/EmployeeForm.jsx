import { useEffect, useState } from 'react'

function isMissingLeavePolicyError(message) {
  return (
    typeof message === 'string' &&
    message.toLowerCase().includes('does not have a leave policy yet')
  )
}

function formatDateInput(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().split('T')[0]
}

function EmployeeForm({
  mode,
  initialValues,
  managers,
  employmentTypeOptions,
  submitStatus,
  onSubmit,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfJoining: '',
    designation: '',
    department: '',
    monthlySalary: '',
    employmentType: 'full_time',
    reportingManagerId: '',
  })

  useEffect(() => {
    if (!initialValues) {
      return
    }

    setFormData({
      fullName: initialValues.fullName || '',
      email: initialValues.email || '',
      password: '',
      phoneNumber: initialValues.phoneNumber || '',
      dateOfJoining: formatDateInput(initialValues.dateOfJoining),
      designation: initialValues.designation || '',
      department: initialValues.department || '',
      monthlySalary: initialValues.monthlySalary || '',
      employmentType: initialValues.employmentType || 'full_time',
      reportingManagerId: initialValues.reportingManager?.id || '',
    })
  }, [initialValues])

  useEffect(() => {
    if (!employmentTypeOptions.length) {
      return
    }

    const selectedOption = employmentTypeOptions.find(
      (option) => option.value === formData.employmentType,
    )

    if (selectedOption?.hasLeavePolicy) {
      return
    }

    const firstValidOption = employmentTypeOptions.find(
      (option) => option.hasLeavePolicy,
    )

    if (firstValidOption) {
      setFormData((current) => ({
        ...current,
        employmentType: firstValidOption.value,
      }))
    }
  }, [employmentTypeOptions, formData.employmentType])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dateOfJoining: formData.dateOfJoining,
      designation: formData.designation,
      department: formData.department,
      monthlySalary: Number(formData.monthlySalary),
      employmentType: formData.employmentType,
      reportingManagerId: formData.reportingManagerId || null,
    }

    if (mode === 'create') {
      payload.password = formData.password
    }

    onSubmit(payload)
  }

  return (
    <form
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Full name
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Email
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        {mode === 'create' ? (
          <div className="block">
            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="temporary-password"
            >
              Temporary password
            </label>
            <div className="relative">
              <input
                id="temporary-password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pr-28 pl-4 text-white outline-none focus:border-emerald-300"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Phone number
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="phoneNumber"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Date of joining
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            type="date"
            name="dateOfJoining"
            required
            value={formData.dateOfJoining}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Designation
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="designation"
            required
            value={formData.designation}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Department
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="department"
            required
            value={formData.department}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Monthly salary
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            type="number"
            min="0"
            name="monthlySalary"
            required
            value={formData.monthlySalary}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Employment type
          </span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="employmentType"
            value={formData.employmentType}
            onChange={handleChange}
          >
            {employmentTypeOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={!option.hasLeavePolicy}
              >
                {option.hasLeavePolicy
                  ? option.label
                  : `${option.label} (leave policy required)`}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">
            Employment types without leave rules are disabled until their leave policy is configured.
          </p>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Reporting manager
          </span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300"
            name="reportingManagerId"
            value={formData.reportingManagerId}
            onChange={handleChange}
          >
            <option value="">No reporting manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.employeeId} - {manager.fullName} ({manager.designation})
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>

          {isMissingLeavePolicyError(error) ? (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Open the Employment Types module, assign leave rules to this employment
              type, and then submit the employee form again.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitStatus === 'loading'}
          className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitStatus === 'loading'
            ? 'Saving...'
            : mode === 'create'
              ? 'Create employee'
              : 'Update employee'}
        </button>
      </div>
    </form>
  )
}

export default EmployeeForm
