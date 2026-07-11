const AttendanceLog = require('../models/AttendanceLog');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const ApiError = require('../utils/apiError');

const OFFICE_START_HOUR = 9;
const OFFICE_START_MINUTE = 30;

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function toDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} is not a valid date.`);
  }

  return startOfDay(date);
}

function isSameDay(left, right) {
  return toDateKey(left) === toDateKey(right);
}

function isWeekday(value) {
  const day = new Date(value).getDay();
  return day >= 1 && day <= 5;
}

function diffInMinutes(start, end) {
  return Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60)), 0);
}

function buildOfficeStart(date) {
  const officeStart = new Date(date);
  officeStart.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);
  return officeStart;
}

function serializeLog(log) {
  return {
    id: log._id?.toString?.() || log.id,
    action: log.action,
    timestamp: log.timestamp,
    logDate: log.logDate,
  };
}

function serializeHoliday(holiday) {
  if (!holiday) {
    return null;
  }

  return {
    id: holiday._id?.toString?.() || holiday.id,
    name: holiday.name,
    date: holiday.date,
    description: holiday.description,
  };
}

function classifyLeaveType(leaveType) {
  return leaveType.toLowerCase().includes('unpaid') ? 'unpaid_leave' : 'paid_leave';
}

function serializeLeaveForDay(leaveRequest) {
  if (!leaveRequest) {
    return null;
  }

  return {
    id: leaveRequest._id?.toString?.() || leaveRequest.id,
    leaveType: leaveRequest.leaveType,
    fromDate: leaveRequest.fromDate,
    toDate: leaveRequest.toDate,
    isHalfDay: leaveRequest.isHalfDay,
    halfDaySession: leaveRequest.halfDaySession,
    totalDays: leaveRequest.totalDays,
    status: leaveRequest.status,
    category: leaveRequest.isHalfDay ? 'half_day' : classifyLeaveType(leaveRequest.leaveType),
  };
}

function getStatusLabel(status) {
  const labels = {
    present: 'Present',
    absent: 'Absent',
    paid_leave: 'Paid Leave',
    unpaid_leave: 'Unpaid Leave',
    holiday: 'Holiday',
    half_day: 'Half Day',
    weekend: 'Weekend',
    not_marked: 'Not Marked Yet',
    upcoming: 'Upcoming',
  };

  return labels[status] || 'Unknown';
}

function createNestedMap() {
  return new Map();
}

function pushToNestedMap(container, outerKey, innerKey, value) {
  if (!container.has(outerKey)) {
    container.set(outerKey, createNestedMap());
  }

  const innerMap = container.get(outerKey);
  const current = innerMap.get(innerKey) || [];
  current.push(value);
  innerMap.set(innerKey, current);
}

function setNestedMapValue(container, outerKey, innerKey, value) {
  if (!container.has(outerKey)) {
    container.set(outerKey, createNestedMap());
  }

  container.get(outerKey).set(innerKey, value);
}

function getRangeFromQuery(query) {
  if (query.dateFrom || query.dateTo) {
    if (!query.dateFrom || !query.dateTo) {
      throw new ApiError(400, 'Both dateFrom and dateTo are required together.');
    }

    const rangeStart = parseDateInput(query.dateFrom, 'dateFrom');
    const rangeEnd = parseDateInput(query.dateTo, 'dateTo');

    if (rangeEnd < rangeStart) {
      throw new ApiError(400, 'dateTo must be on or after dateFrom.');
    }

    return {
      rangeStart,
      rangeEnd,
      month: rangeStart.getMonth() + 1,
      year: rangeStart.getFullYear(),
    };
  }

  const today = new Date();
  const year = query.year ? Number(query.year) : today.getFullYear();
  const month = query.month ? Number(query.month) : today.getMonth() + 1;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, 'Please provide a valid year.');
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, 'Please provide a valid month between 1 and 12.');
  }

  return {
    rangeStart: new Date(year, month - 1, 1),
    rangeEnd: new Date(year, month, 0),
    month,
    year,
  };
}

async function getEmployeeRecordByUserId(userId) {
  const employee = await Employee.findOne({ userId }).populate('userId', 'fullName email');

  if (!employee) {
    throw new ApiError(404, 'Employee record not found.');
  }

  if (employee.status !== 'active') {
    throw new ApiError(403, 'Attendance is available only for active employees.');
  }

  return employee;
}

async function getEmployeeDirectory(employeeId) {
  const filters = employeeId ? { _id: employeeId } : {};
  const employees = await Employee.find(filters)
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });

  if (employeeId && employees.length === 0) {
    throw new ApiError(404, 'Employee not found.');
  }

  return employees;
}

async function buildAttendanceContext(employeeIds, rangeStart, rangeEnd) {
  const ids = employeeIds.map((id) => id.toString());
  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);

  const [logs, holidays, approvedLeaves] = await Promise.all([
    AttendanceLog.find({
      employeeId: { $in: ids },
      timestamp: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ timestamp: 1 })
      .lean(),
    Holiday.find({
      date: {
        $gte: start,
        $lte: end,
      },
    }).lean(),
    LeaveRequest.find({
      employeeId: { $in: ids },
      status: 'approved',
      fromDate: { $lte: end },
      toDate: { $gte: start },
    }).lean(),
  ]);

  const logsByEmployeeAndDate = new Map();
  const leavesByEmployeeAndDate = new Map();
  const holidayByDate = new Map();

  logs.forEach((log) => {
    pushToNestedMap(
      logsByEmployeeAndDate,
      log.employeeId.toString(),
      toDateKey(log.timestamp),
      serializeLog(log),
    );
  });

  holidays.forEach((holiday) => {
    holidayByDate.set(toDateKey(holiday.date), serializeHoliday(holiday));
  });

  approvedLeaves.forEach((leave) => {
    let cursor = startOfDay(leave.fromDate);
    const leaveEnd = startOfDay(leave.toDate);

    while (cursor <= leaveEnd) {
      const dateKey = toDateKey(cursor);
      setNestedMapValue(
        leavesByEmployeeAndDate,
        leave.employeeId.toString(),
        dateKey,
        serializeLeaveForDay(leave),
      );
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
  });

  return {
    logsByEmployeeAndDate,
    leavesByEmployeeAndDate,
    holidayByDate,
  };
}

function buildDaySummary({
  date,
  logs = [],
  holiday = null,
  leave = null,
  now = new Date(),
}) {
  const dateValue = startOfDay(date);
  const today = startOfDay(now);
  const sortedLogs = [...logs].sort(
    (left, right) => new Date(left.timestamp) - new Date(right.timestamp),
  );

  const sessions = [];
  let currentIn = null;
  let lastOut = null;
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;

  sortedLogs.forEach((log) => {
    const timestamp = new Date(log.timestamp);

    if (log.action === 'in') {
      if (!currentIn) {
        if (lastOut) {
          totalBreakMinutes += diffInMinutes(lastOut, timestamp);
        }

        currentIn = timestamp;
      }

      return;
    }

    if (log.action === 'out' && currentIn) {
      const durationMinutes = diffInMinutes(currentIn, timestamp);
      totalWorkMinutes += durationMinutes;
      sessions.push({
        inTime: currentIn,
        outTime: timestamp,
        durationMinutes,
      });
      currentIn = null;
      lastOut = timestamp;
    }
  });

  let activeSessionMinutes = 0;

  if (currentIn && isSameDay(dateValue, now)) {
    activeSessionMinutes = diffInMinutes(currentIn, now);
    totalWorkMinutes += activeSessionMinutes;
  }

  const firstPunchInLog = sortedLogs.find((log) => log.action === 'in');
  const lastPunchOutLog = [...sortedLogs].reverse().find((log) => log.action === 'out');
  const lateReference = firstPunchInLog ? new Date(firstPunchInLog.timestamp) : null;
  const lateThreshold = buildOfficeStart(dateValue);
  const isScheduledWorkday = isWeekday(dateValue) && !holiday;
  const isFutureDate = dateValue > today;

  const lateMark =
    Boolean(lateReference) &&
    isScheduledWorkday &&
    (!leave || leave.isHalfDay) &&
    lateReference > lateThreshold;

  const lateByMinutes = lateMark ? diffInMinutes(lateThreshold, lateReference) : 0;

  let status = 'upcoming';

  if (holiday && sortedLogs.length === 0) {
    status = 'holiday';
  } else if (leave && sortedLogs.length === 0) {
    status = leave.category;
  } else if (leave?.isHalfDay) {
    status = 'half_day';
  } else if (sortedLogs.length > 0) {
    status = 'present';
  } else if (!isWeekday(dateValue)) {
    status = 'weekend';
  } else if (isFutureDate) {
    status = 'upcoming';
  } else if (isSameDay(dateValue, now)) {
    status = 'not_marked';
  } else {
    status = 'absent';
  }

  return {
    date: dateValue,
    status,
    statusLabel: getStatusLabel(status),
    logs: sortedLogs,
    sessions,
    totalWorkMinutes,
    totalBreakMinutes,
    activeSessionMinutes,
    firstPunchIn: firstPunchInLog?.timestamp || null,
    lastPunchOut: lastPunchOutLog?.timestamp || null,
    currentState: currentIn ? 'in' : 'out',
    hasOpenSession: Boolean(currentIn),
    lateMark,
    lateByMinutes,
    isScheduledWorkday,
    holiday,
    leave,
  };
}

function getEntriesForEmployee(map, employeeId) {
  return map.get(employeeId.toString()) || new Map();
}

function buildSummariesForEmployee(employeeId, rangeStart, rangeEnd, context) {
  const employeeLogs = getEntriesForEmployee(context.logsByEmployeeAndDate, employeeId);
  const employeeLeaves = getEntriesForEmployee(context.leavesByEmployeeAndDate, employeeId);
  const summaries = [];
  let cursor = startOfDay(rangeStart);
  const boundary = startOfDay(rangeEnd);

  while (cursor <= boundary) {
    const dateKey = toDateKey(cursor);
    summaries.push(
      buildDaySummary({
        date: cursor,
        logs: employeeLogs.get(dateKey) || [],
        holiday: context.holidayByDate.get(dateKey) || null,
        leave: employeeLeaves.get(dateKey) || null,
      }),
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  return summaries;
}

function serializeEmployee(employee) {
  return {
    id: employee._id?.toString?.() || employee.id,
    employeeId: employee.employeeId,
    fullName: employee.userId?.fullName || null,
    email: employee.userId?.email || null,
    designation: employee.designation,
    department: employee.department,
    employmentType: employee.employmentType,
    status: employee.status,
  };
}

function serializeDaySummary(summary, employee = null) {
  return {
    ...(employee ? { employee: serializeEmployee(employee) } : {}),
    date: summary.date,
    status: summary.status,
    statusLabel: summary.statusLabel,
    logs: summary.logs,
    sessions: summary.sessions,
    totalWorkMinutes: summary.totalWorkMinutes,
    totalBreakMinutes: summary.totalBreakMinutes,
    activeSessionMinutes: summary.activeSessionMinutes,
    firstPunchIn: summary.firstPunchIn,
    lastPunchOut: summary.lastPunchOut,
    currentState: summary.currentState,
    hasOpenSession: summary.hasOpenSession,
    lateMark: summary.lateMark,
    lateByMinutes: summary.lateByMinutes,
    isScheduledWorkday: summary.isScheduledWorkday,
    holiday: summary.holiday,
    leave: summary.leave,
    punchCount: summary.logs.length,
  };
}

async function ensureAttendanceAllowed(employeeId, date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [holiday, leave] = await Promise.all([
    Holiday.findOne({
      date: {
        $gte: dayStart,
        $lte: dayEnd,
      },
    }).lean(),
    LeaveRequest.findOne({
      employeeId,
      status: 'approved',
      isHalfDay: false,
      fromDate: { $lte: dayEnd },
      toDate: { $gte: dayStart },
    }).lean(),
  ]);

  if (holiday) {
    throw new ApiError(400, 'Attendance cannot be marked on a holiday.');
  }

  if (leave) {
    throw new ApiError(
      400,
      'Attendance cannot be marked while a full-day leave is approved for today.',
    );
  }
}

async function getTodayAttendanceForUser(userId) {
  const employee = await getEmployeeRecordByUserId(userId);
  const today = startOfDay(new Date());
  const context = await buildAttendanceContext([employee.id], today, today);
  const summary = buildSummariesForEmployee(employee.id, today, today, context)[0];

  return serializeDaySummary(summary);
}

async function punchIn(userId) {
  const employee = await getEmployeeRecordByUserId(userId);
  const now = new Date();
  const today = startOfDay(now);

  await ensureAttendanceAllowed(employee.id, now);

  const existingLogs = await AttendanceLog.find({
    employeeId: employee.id,
    logDate: today,
  })
    .sort({ timestamp: 1 })
    .lean();

  const lastLog = existingLogs[existingLogs.length - 1];

  if (lastLog?.action === 'in') {
    throw new ApiError(400, 'You are already punched in. Please punch out first.');
  }

  await AttendanceLog.create({
    employeeId: employee.id,
    action: 'in',
    timestamp: now,
    logDate: today,
  });

  return getTodayAttendanceForUser(userId);
}

async function punchOut(userId) {
  const employee = await getEmployeeRecordByUserId(userId);
  const now = new Date();
  const today = startOfDay(now);

  const existingLogs = await AttendanceLog.find({
    employeeId: employee.id,
    logDate: today,
  })
    .sort({ timestamp: 1 })
    .lean();

  const lastLog = existingLogs[existingLogs.length - 1];

  if (!lastLog || lastLog.action !== 'in') {
    throw new ApiError(400, 'Punch in before trying to punch out.');
  }

  await AttendanceLog.create({
    employeeId: employee.id,
    action: 'out',
    timestamp: now,
    logDate: today,
  });

  return getTodayAttendanceForUser(userId);
}

async function getMyAttendanceCalendar(userId, query) {
  const employee = await getEmployeeRecordByUserId(userId);
  const { rangeStart, rangeEnd, month, year } = getRangeFromQuery(query);
  const context = await buildAttendanceContext([employee.id], rangeStart, rangeEnd);
  const days = buildSummariesForEmployee(employee.id, rangeStart, rangeEnd, context).map(
    (summary) => serializeDaySummary(summary),
  );

  return {
    month,
    year,
    rangeStart,
    rangeEnd,
    days,
  };
}

async function getMyAttendanceHistory(userId, query) {
  const calendar = await getMyAttendanceCalendar(userId, query);

  return calendar.days
    .filter(
      (day) =>
        day.isScheduledWorkday ||
        day.holiday ||
        day.leave ||
        day.logs.length > 0 ||
        day.status === 'absent',
    )
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

async function getMyAttendanceDay(userId, query) {
  if (!query.date) {
    throw new ApiError(400, 'date is required.');
  }

  const employee = await getEmployeeRecordByUserId(userId);
  const selectedDate = parseDateInput(query.date, 'date');
  const context = await buildAttendanceContext([employee.id], selectedDate, selectedDate);
  const summary = buildSummariesForEmployee(
    employee.id,
    selectedDate,
    selectedDate,
    context,
  )[0];

  return serializeDaySummary(summary);
}

function aggregateEmployeeReport(employee, summaries) {
  const today = startOfDay(new Date());

  const report = {
    employee: serializeEmployee(employee),
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    halfDays: 0,
    lateMarks: 0,
    lateDeductionDays: 0,
    workedMinutes: 0,
    breakMinutes: 0,
  };

  summaries.forEach((summary) => {
    const isCompletedDay = startOfDay(summary.date) <= today;

    if (summary.isScheduledWorkday && isCompletedDay) {
      report.totalWorkingDays += 1;
    }

    report.workedMinutes += summary.totalWorkMinutes;
    report.breakMinutes += summary.totalBreakMinutes;

    if (summary.lateMark) {
      report.lateMarks += 1;
    }

    if (!isCompletedDay) {
      return;
    }

    switch (summary.status) {
      case 'present':
        report.presentDays += 1;
        break;
      case 'absent':
        report.absentDays += 1;
        break;
      case 'paid_leave':
        report.paidLeaveDays += 1;
        break;
      case 'unpaid_leave':
        report.unpaidLeaveDays += 1;
        break;
      case 'half_day':
        report.halfDays += 1;
        break;
      default:
        break;
    }
  });

  report.lateDeductionDays = Math.floor(report.lateMarks / 3) * 0.5;

  return report;
}

async function getAdminAttendanceRecords(query) {
  const employees = await getEmployeeDirectory(query.employeeId);
  const { rangeStart, rangeEnd, month, year } = getRangeFromQuery(query);
  const context = await buildAttendanceContext(
    employees.map((employee) => employee.id),
    rangeStart,
    rangeEnd,
  );

  const records = employees
    .flatMap((employee) =>
      buildSummariesForEmployee(employee.id, rangeStart, rangeEnd, context)
        .filter(
          (summary) =>
            summary.isScheduledWorkday ||
            summary.holiday ||
            summary.leave ||
            summary.logs.length > 0 ||
            summary.status === 'absent',
        )
        .map((summary) => serializeDaySummary(summary, employee)),
    )
    .sort((left, right) => {
      const dateDiff = new Date(right.date) - new Date(left.date);

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return left.employee.fullName.localeCompare(right.employee.fullName);
    });

  return {
    month,
    year,
    rangeStart,
    rangeEnd,
    records,
  };
}

async function getAdminAttendanceReport(query) {
  const employees = await getEmployeeDirectory(query.employeeId);
  const { rangeStart, rangeEnd, month, year } = getRangeFromQuery(query);
  const context = await buildAttendanceContext(
    employees.map((employee) => employee.id),
    rangeStart,
    rangeEnd,
  );

  const employeeReports = employees.map((employee) =>
    aggregateEmployeeReport(
      employee,
      buildSummariesForEmployee(employee.id, rangeStart, rangeEnd, context),
    ),
  );

  const summary = employeeReports.reduce(
    (totals, report) => ({
      totalEmployees: totals.totalEmployees + 1,
      totalWorkingDays: totals.totalWorkingDays + report.totalWorkingDays,
      presentDays: totals.presentDays + report.presentDays,
      absentDays: totals.absentDays + report.absentDays,
      paidLeaveDays: totals.paidLeaveDays + report.paidLeaveDays,
      unpaidLeaveDays: totals.unpaidLeaveDays + report.unpaidLeaveDays,
      halfDays: totals.halfDays + report.halfDays,
      lateMarks: totals.lateMarks + report.lateMarks,
      lateDeductionDays: totals.lateDeductionDays + report.lateDeductionDays,
      workedMinutes: totals.workedMinutes + report.workedMinutes,
      breakMinutes: totals.breakMinutes + report.breakMinutes,
    }),
    {
      totalEmployees: 0,
      totalWorkingDays: 0,
      presentDays: 0,
      absentDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      halfDays: 0,
      lateMarks: 0,
      lateDeductionDays: 0,
      workedMinutes: 0,
      breakMinutes: 0,
    },
  );

  return {
    month,
    year,
    rangeStart,
    rangeEnd,
    summary,
    employees: employeeReports,
  };
}

async function getAttendanceSummariesByEmployee(employeeIds, rangeStart, rangeEnd) {
  const normalizedIds = employeeIds.map((id) => id.toString());
  const context = await buildAttendanceContext(normalizedIds, rangeStart, rangeEnd);

  return new Map(
    normalizedIds.map((employeeId) => [
      employeeId,
      buildSummariesForEmployee(employeeId, rangeStart, rangeEnd, context),
    ]),
  );
}

module.exports = {
  getTodayAttendanceForUser,
  punchIn,
  punchOut,
  getMyAttendanceCalendar,
  getMyAttendanceHistory,
  getMyAttendanceDay,
  getAdminAttendanceRecords,
  getAdminAttendanceReport,
  getAttendanceSummariesByEmployee,
};
