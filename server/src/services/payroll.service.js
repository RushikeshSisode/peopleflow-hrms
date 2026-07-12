const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const ApiError = require('../utils/apiError');
const {
  getLeaveTypeDefinition,
  isUnpaidLeaveType,
} = require('../constants/leaveTypes');
const { syncLeaveBalanceForEmployee } = require('./leave.service');
const { getAttendanceSummariesByEmployee } = require('./attendance.service');
const { createPayslipPdf } = require('../utils/payrollPdf');

const COMPANY_NAME = 'HRMS Pvt Ltd';

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatPayrollMonthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function buildSlipNumber(employeeCode, month, year) {
  return `SLIP-${year}${String(month).padStart(2, '0')}-${employeeCode}`;
}

function normalizeDayValue(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getPayrollPeriod(month, year) {
  const today = startOfDay(new Date());
  const periodStart = new Date(year, month - 1, 1);

  if (periodStart > today) {
    throw new ApiError(400, 'Payroll cannot be processed for a future month.');
  }

  const naturalEnd = new Date(year, month, 0);
  const currentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  return {
    periodStart,
    periodEnd: currentMonth && naturalEnd > today ? today : naturalEnd,
  };
}

async function getPayrollEmployees(employeeId, periodEnd) {
  const filters = {
    dateOfJoining: { $lte: periodEnd },
  };

  if (employeeId) {
    filters._id = employeeId;
  } else {
    filters.status = 'active';
  }

  const employees = await Employee.find(filters)
    .populate('userId', 'fullName email')
    .sort({ employeeId: 1 });

  if (employeeId && employees.length === 0) {
    throw new ApiError(404, 'Employee not found for payroll processing.');
  }

  return employees;
}

function getRangeForEmployee(employee, periodStart, periodEnd) {
  const joiningDate = startOfDay(employee.dateOfJoining);
  return {
    rangeStart: joiningDate > periodStart ? joiningDate : periodStart,
    rangeEnd: periodEnd,
  };
}

function getPaidLeaveEntries(balanceRecord) {
  return balanceRecord.balances
    .filter((entry) => getLeaveTypeDefinition(entry.leaveType)?.key === 'paid_leave');
}

function getAvailablePaidLeave(balanceRecord) {
  return getPaidLeaveEntries(balanceRecord).reduce(
    (total, entry) => total + (entry.remaining || 0),
    0,
  );
}

function restorePayrollAdjustments(balanceRecord, adjustments) {
  adjustments.forEach((adjustment) => {
    const entry = balanceRecord.balances.find(
      (balance) =>
        getLeaveTypeDefinition(balance.leaveType)?.key ===
        getLeaveTypeDefinition(adjustment.leaveType)?.key,
    );

    if (!entry || entry.isUnlimited) {
      return;
    }

    entry.used = Math.max(entry.used - adjustment.days, 0);
    entry.remaining = Math.max(entry.remaining + adjustment.days, 0);
  });
}

function consumePaidLeave(balanceRecord, daysToConsume) {
  let remainingDays = normalizeDayValue(daysToConsume);
  const adjustments = [];

  if (!remainingDays) {
    return adjustments;
  }

  const entries = getPaidLeaveEntries(balanceRecord);

  entries.forEach((entry) => {
    if (!remainingDays || !entry.remaining) {
      return;
    }

    const consumed = Math.min(entry.remaining, remainingDays);
    entry.used = normalizeDayValue(entry.used + consumed);
    entry.remaining = normalizeDayValue(entry.remaining - consumed);
    remainingDays = normalizeDayValue(remainingDays - consumed);
    adjustments.push({
      leaveType: entry.leaveType,
      days: consumed,
    });
  });

  return adjustments;
}

function buildPayrollSnapshot(employee, summaries, balanceRecord, month, year) {
  const attendanceSummary = {
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    approvedPaidLeaveDays: 0,
    unpaidLeaveDays: 0,
    halfDayLeaveDays: 0,
    lateMarks: 0,
    lateDeductionDays: 0,
    paidLeaveAdjustmentUsed: 0,
    salaryDeductionDays: 0,
  };

  summaries.forEach((summary) => {
    if (summary.isScheduledWorkday) {
      attendanceSummary.totalWorkingDays += 1;
    }

    if (summary.lateMark) {
      attendanceSummary.lateMarks += 1;
    }

    switch (summary.status) {
      case 'present':
        attendanceSummary.presentDays += 1;
        break;
      case 'absent':
        attendanceSummary.absentDays += 1;
        break;
      case 'paid_leave':
        attendanceSummary.approvedPaidLeaveDays += 1;
        break;
      case 'unpaid_leave':
        attendanceSummary.unpaidLeaveDays += 1;
        break;
      case 'half_day': {
        const isUnpaidHalfDay = isUnpaidLeaveType(summary.leave?.leaveType);

        if (isUnpaidHalfDay) {
          attendanceSummary.unpaidLeaveDays += 0.5;
        } else {
          attendanceSummary.approvedPaidLeaveDays += 0.5;
        }

        attendanceSummary.halfDayLeaveDays += 0.5;
        break;
      }
      default:
        break;
    }
  });

  attendanceSummary.unpaidLeaveDays = normalizeDayValue(attendanceSummary.unpaidLeaveDays);
  attendanceSummary.approvedPaidLeaveDays = normalizeDayValue(
    attendanceSummary.approvedPaidLeaveDays,
  );
  attendanceSummary.lateDeductionDays = normalizeDayValue(
    Math.floor(attendanceSummary.lateMarks / 3) * 0.5,
  );

  const adjustableDeductionDays = normalizeDayValue(
    attendanceSummary.absentDays + attendanceSummary.lateDeductionDays,
  );
  const availablePaidLeave = getAvailablePaidLeave(balanceRecord);
  const paidLeaveAdjustmentUsed = normalizeDayValue(
    Math.min(availablePaidLeave, adjustableDeductionDays),
  );
  const paidLeaveAdjustments = consumePaidLeave(balanceRecord, paidLeaveAdjustmentUsed);
  const finalSalaryDeductionDays = normalizeDayValue(
    attendanceSummary.unpaidLeaveDays +
      Math.max(adjustableDeductionDays - paidLeaveAdjustmentUsed, 0),
  );

  attendanceSummary.paidLeaveAdjustmentUsed = paidLeaveAdjustmentUsed;
  attendanceSummary.salaryDeductionDays = finalSalaryDeductionDays;

  const grossSalary = roundMoney(employee.monthlySalary);
  const perDaySalary = attendanceSummary.totalWorkingDays
    ? roundMoney(grossSalary / attendanceSummary.totalWorkingDays)
    : grossSalary;
  const unpaidLeaveAmount = roundMoney(perDaySalary * attendanceSummary.unpaidLeaveDays);
  const adjustableDeductionAmount = roundMoney(
    perDaySalary * Math.max(adjustableDeductionDays - paidLeaveAdjustmentUsed, 0),
  );
  const totalDeduction = roundMoney(unpaidLeaveAmount + adjustableDeductionAmount);
  const netSalary = roundMoney(Math.max(grossSalary - totalDeduction, 0));

  return {
    companyName: COMPANY_NAME,
    month,
    year,
    grossSalary,
    perDaySalary,
    totalDeduction,
    netSalary,
    attendanceSummary,
    deductionBreakdown: {
      unpaidLeaveDays: attendanceSummary.unpaidLeaveDays,
      absentDays: attendanceSummary.absentDays,
      lateDeductionDays: attendanceSummary.lateDeductionDays,
      halfDayLeaveDays: attendanceSummary.halfDayLeaveDays,
      adjustableDeductionDays,
      paidLeaveAdjustmentUsed,
      finalSalaryDeductionDays,
      unpaidLeaveAmount,
      adjustableDeductionAmount,
    },
    paidLeaveAdjustments,
  };
}

function serializePayroll(record) {
  const employeeRecord = record.employeeId;
  const userRecord = employeeRecord?.userId;

  return {
    id: record._id?.toString?.() || record.id,
    slipNumber: record.slipNumber,
    companyName: record.companyName,
    month: record.month,
    year: record.year,
    payrollMonthLabel: formatPayrollMonthLabel(record.month, record.year),
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    employee: employeeRecord
      ? {
          id: employeeRecord._id?.toString?.() || employeeRecord.id,
          employeeId: employeeRecord.employeeId,
          fullName: userRecord?.fullName || null,
          email: userRecord?.email || null,
          designation: employeeRecord.designation,
          department: employeeRecord.department,
          employmentType: employeeRecord.employmentType,
        }
      : null,
    grossSalary: record.grossSalary,
    perDaySalary: record.perDaySalary,
    totalDeduction: record.totalDeduction,
    netSalary: record.netSalary,
    attendanceSummary: record.attendanceSummary,
    deductionBreakdown: record.deductionBreakdown,
    paidLeaveAdjustments: record.paidLeaveAdjustments,
    paidLeaveUsed: normalizeDayValue(
      (record.attendanceSummary?.approvedPaidLeaveDays || 0) +
        (record.attendanceSummary?.paidLeaveAdjustmentUsed || 0),
    ),
    processedAt: record.processedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function runPayroll(payload, processedBy) {
  const month = Number(payload.month);
  const year = Number(payload.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, 'Please provide a valid payroll month.');
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, 'Please provide a valid payroll year.');
  }

  const { periodStart, periodEnd } = getPayrollPeriod(month, year);
  const employees = await getPayrollEmployees(payload.employeeId, periodEnd);
  const existingPayrolls = await Payroll.find({
    employeeId: { $in: employees.map((employee) => employee.id) },
    month,
    year,
  });
  const existingMap = new Map(
    existingPayrolls.map((payroll) => [payroll.employeeId.toString(), payroll]),
  );

  const summaryMap = await getAttendanceSummariesByEmployee(
    employees.map((employee) => employee.id),
    periodStart,
    periodEnd,
  );

  const processedItems = [];

  for (const employee of employees) {
    const { rangeStart, rangeEnd } = getRangeForEmployee(employee, periodStart, periodEnd);
    const summaries =
      (summaryMap.get(employee.id.toString()) || []).filter((summary) => {
        const date = startOfDay(summary.date);
        return date >= rangeStart && date <= rangeEnd;
      });

    let balanceRecord = await syncLeaveBalanceForEmployee(
      employee.id,
      employee.employmentType,
      year,
    );

    const existingPayroll = existingMap.get(employee.id.toString());

    if (existingPayroll?.paidLeaveAdjustments?.length) {
      restorePayrollAdjustments(balanceRecord, existingPayroll.paidLeaveAdjustments);
    }

    const snapshot = buildPayrollSnapshot(employee, summaries, balanceRecord, month, year);
    await balanceRecord.save();

    const payrollPayload = {
      employeeId: employee.id,
      month,
      year,
      periodStart: rangeStart,
      periodEnd: rangeEnd,
      companyName: snapshot.companyName,
      grossSalary: snapshot.grossSalary,
      perDaySalary: snapshot.perDaySalary,
      totalDeduction: snapshot.totalDeduction,
      netSalary: snapshot.netSalary,
      attendanceSummary: snapshot.attendanceSummary,
      deductionBreakdown: snapshot.deductionBreakdown,
      paidLeaveAdjustments: snapshot.paidLeaveAdjustments,
      processedBy,
      processedAt: new Date(),
      slipNumber: buildSlipNumber(employee.employeeId, month, year),
    };

    let payrollRecord;

    if (existingPayroll) {
      Object.assign(existingPayroll, payrollPayload);
      payrollRecord = await existingPayroll.save();
    } else {
      payrollRecord = await Payroll.create(payrollPayload);
    }

    const populatedPayroll = await Payroll.findById(payrollRecord.id).populate({
      path: 'employeeId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    });

    processedItems.push(serializePayroll(populatedPayroll));
  }

  return processedItems;
}

async function listAdminPayrolls(query) {
  const filters = {};

  if (query.month) {
    filters.month = Number(query.month);
  }

  if (query.year) {
    filters.year = Number(query.year);
  }

  if (query.employeeId) {
    filters.employeeId = query.employeeId;
  }

  const payrolls = await Payroll.find(filters)
    .populate({
      path: 'employeeId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    })
    .sort({ year: -1, month: -1, processedAt: -1 });

  return payrolls.map((payroll) => serializePayroll(payroll));
}

async function getPayrollById(payrollId) {
  const payroll = await Payroll.findById(payrollId)
    .populate({
      path: 'employeeId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    })
    .populate('processedBy', 'fullName email');

  if (!payroll) {
    throw new ApiError(404, 'Payroll record not found.');
  }

  return payroll;
}

async function getAdminPayrollById(payrollId) {
  const payroll = await getPayrollById(payrollId);
  return serializePayroll(payroll);
}

async function listMyPayrolls(userId) {
  const employee = await Employee.findOne({ userId });

  if (!employee) {
    throw new ApiError(404, 'Employee record not found.');
  }

  const payrolls = await Payroll.find({ employeeId: employee.id })
    .populate({
      path: 'employeeId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    })
    .sort({ year: -1, month: -1, processedAt: -1 });

  return payrolls.map((payroll) => serializePayroll(payroll));
}

async function buildSalarySlipDownload(payrollId, requester) {
  const payroll = await getPayrollById(payrollId);

  if (
    requester.role === 'employee' &&
    payroll.employeeId?.userId?._id?.toString() !== requester.id
  ) {
    throw new ApiError(403, 'You do not have access to this salary slip.');
  }

  const serialized = serializePayroll(payroll);
  const pdfBuffer = createPayslipPdf({
    companyName: serialized.companyName,
    payrollMonthLabel: serialized.payrollMonthLabel,
    employeeName: serialized.employee?.fullName || 'Employee',
    employeeCode: serialized.employee?.employeeId || 'NA',
    employeeEmail: serialized.employee?.email || 'Not available',
    designation: serialized.employee?.designation || 'Not assigned',
    department: serialized.employee?.department || 'Not assigned',
    grossSalary: serialized.grossSalary.toFixed(2),
    totalDeduction: serialized.totalDeduction.toFixed(2),
    netSalary: serialized.netSalary.toFixed(2),
  });

  return {
    filename: `${serialized.slipNumber}.pdf`,
    buffer: pdfBuffer,
  };
}

module.exports = {
  runPayroll,
  listAdminPayrolls,
  getAdminPayrollById,
  listMyPayrolls,
  buildSalarySlipDownload,
};
