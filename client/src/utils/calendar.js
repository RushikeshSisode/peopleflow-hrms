export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function getMonthLabel(date) {
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function toDateKey(value) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createHolidayMap(holidays) {
  return holidays.reduce((map, holiday) => {
    const key = toDateKey(holiday.date)
    const entries = map.get(key) || []
    entries.push(holiday)
    map.set(key, entries)
    return map
  }, new Map())
}

export function buildCalendarGrid(date, holidayMap) {
  const firstDay = startOfMonth(date)
  const lastDay = endOfMonth(date)
  const monthIndex = firstDay.getMonth()
  const leadingEmptyDays = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const cells = []

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      isCurrentMonth: false,
      date: null,
      holidays: [],
    })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(firstDay.getFullYear(), monthIndex, day)
    const dateKey = toDateKey(cellDate)

    cells.push({
      key: dateKey,
      isCurrentMonth: true,
      date: cellDate,
      holidays: holidayMap.get(dateKey) || [],
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      isCurrentMonth: false,
      date: null,
      holidays: [],
    })
  }

  return cells
}
