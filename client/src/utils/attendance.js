export function formatDuration(minutes = 0) {
  if (!minutes) {
    return '0 min'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) {
    return `${remainingMinutes} min`
  }

  if (!remainingMinutes) {
    return `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}

export function formatTime(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatLongDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function buildMonthParams(date) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }
}

export function getAttendanceStatusTone(status) {
  const tones = {
    present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    absent: 'border-rose-200 bg-rose-50 text-rose-700',
    paid_leave: 'border-sky-200 bg-sky-50 text-sky-700',
    unpaid_leave: 'border-orange-200 bg-orange-50 text-orange-700',
    holiday: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    half_day: 'border-amber-200 bg-amber-50 text-amber-700',
    weekend: 'border-slate-200 bg-slate-50 text-slate-500',
    not_marked: 'border-slate-200 bg-white text-slate-600',
    upcoming: 'border-slate-200 bg-slate-50/70 text-slate-400',
  }

  return tones[status] || tones.not_marked
}
