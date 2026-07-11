const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { getLeavePolicyByEmploymentCode } = require('./employmentType.service');

function startOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);
  return date;
}

function calculateLeaveDays(fromDate, toDate, isHalfDay) {
  const start = startOfDay(fromDate);
  const end = startOfDay(toDate);
  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000)) + 1;

  if (diffInDays <= 0) {
    throw new ApiError(400, 'To date must be on or after from date.');
  }

  if (isHalfDay) {
    if (diffInDays !== 1) {
      throw new ApiError(400, 'Half-day leave must be applied for a single day.');
    }

    return 0.5;
  }

  return diffInDays;
}

function serializeLeaveBalances(record) {
  return {
    id: record.id,
    year: record.year,
    balances: record.balances.map((entry) => ({
      leaveType: entry.leaveType,
      allocated: entry.isUnlimited ? null : entry.allocated,
      used: entry.used,
      remaining: entry.isUnlimited ? null : entry.remaining,
      isUnlimited: entry.isUnlimited,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function serializeLeaveRequest(record) {
  return {
    id: record._id?.toString?.() || record.id,
    employee: record.employeeId
      ? {
          id: record.employeeId._id?.toString?.() || record.employeeId.id,
          employeeId: record.employeeId.employeeId,
          fullName:
            record.employeeId.userId?.fullName || record.employee?.fullName || null,
          email: record.employeeId.userId?.email || record.employee?.email || null,
        }
      : record.employee || null,
    leaveType: record.leaveType,
    fromDate: record.fromDate,
    toDate: record.toDate,
    isHalfDay: record.isHalfDay,
    halfDaySession: record.halfDaySession,
    totalDays: record.totalDays,
    reason: record.reason,
    status: record.status,
    rejectionReason: record.rejectionReason,
    reviewedAt: record.reviewedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function buildBalanceEntriesFromEmploymentType(employmentTypeCode) {
  const policyBundle = await getLeavePolicyByEmploymentCode(employmentTypeCode);

  if (!policyBundle) {
    throw new ApiError(400, 'No leave policy found for the selected employment type.');
  }

  return policyBundle.leavePolicy.rules.map((rule) => ({
    leaveType: rule.leaveType,
    allocated: rule.isUnlimited ? 0 : rule.annualDays,
    used: 0,
    remaining: rule.isUnlimited ? 0 : rule.annualDays,
    isUnlimited: rule.isUnlimited,
  }));
}

async function initializeLeaveBalanceForEmployee(employeeId, employmentTypeCode, year) {
  const existing = await LeaveBalance.findOne({ employeeId, year });

  if (existing) {
    return existing;
  }

  const balances = await buildBalanceEntriesFromEmploymentType(employmentTypeCode);

  return LeaveBalance.create({
    employeeId,
    year,
    balances,
  });
}

async function syncLeaveBalanceForEmployee(employeeId, employmentTypeCode, year) {
  const nextEntries = await buildBalanceEntriesFromEmploymentType(employmentTypeCode);
  const existing = await LeaveBalance.findOne({ employeeId, year });

  if (!existing) {
    return LeaveBalance.create({
      employeeId,
      year,
      balances: nextEntries,
    });
  }

  const currentByType = new Map(
    existing.balances.map((entry) => [entry.leaveType.toLowerCase(), entry]),
  );

  existing.balances = nextEntries.map((entry) => {
    const current = currentByType.get(entry.leaveType.toLowerCase());

    if (!current) {
      return entry;
    }

    if (entry.isUnlimited) {
      return {
        ...entry,
        used: current.used,
        remaining: 0,
      };
    }

    const remaining = Math.max(entry.allocated - current.used, 0);

    return {
      ...entry,
      used: Math.min(current.used, entry.allocated),
      remaining,
    };
  });

  await existing.save();
  return existing;
}

async function getEmployeeRecordByUserId(userId) {
  const employee = await Employee.findOne({ userId }).populate('userId', 'fullName email');

  if (!employee) {
    throw new ApiError(404, 'Employee record not found.');
  }

  return employee;
}

async function getLeaveBalancesForEmployee(employeeId, year = new Date().getFullYear()) {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  const balanceRecord = await initializeLeaveBalanceForEmployee(
    employee.id,
    employee.employmentType,
    year,
  );

  return serializeLeaveBalances(balanceRecord);
}

async function applyLeaveRequest(userId, payload) {
  const employee = await getEmployeeRecordByUserId(userId);
  const {
    leaveType,
    fromDate,
    toDate,
    isHalfDay,
    halfDaySession,
    reason,
  } = payload;

  if (!leaveType?.trim() || !fromDate || !toDate || !reason?.trim()) {
    throw new ApiError(400, 'Leave type, dates, and reason are required.');
  }

  if (isHalfDay && !halfDaySession) {
    throw new ApiError(400, 'Select first half or second half for half-day leave.');
  }

  if (!isHalfDay && halfDaySession) {
    throw new ApiError(400, 'Half-day session should only be set for half-day leave.');
  }

  const start = startOfDay(fromDate);
  const end = startOfDay(toDate);
  const totalDays = calculateLeaveDays(start, end, Boolean(isHalfDay));
  const year = start.getFullYear();

  if (year !== end.getFullYear()) {
    throw new ApiError(400, 'Please apply leave within a single calendar year.');
  }

  const balanceRecord = await initializeLeaveBalanceForEmployee(
    employee.id,
    employee.employmentType,
    year,
  );

  const balanceEntry = balanceRecord.balances.find(
    (entry) => entry.leaveType.toLowerCase() === leaveType.trim().toLowerCase(),
  );

  if (!balanceEntry) {
    throw new ApiError(400, 'Selected leave type is not available for this employee.');
  }

  if (!balanceEntry.isUnlimited && balanceEntry.remaining < totalDays) {
    throw new ApiError(400, 'Insufficient leave balance for the selected leave type.');
  }

  const overlappingRequest = await LeaveRequest.findOne({
    employeeId: employee.id,
    status: { $in: ['pending', 'approved'] },
    fromDate: { $lte: endOfDay(end) },
    toDate: { $gte: startOfDay(start) },
  });

  if (overlappingRequest) {
    throw new ApiError(409, 'A leave request already exists for the selected dates.');
  }

  const leaveRequest = await LeaveRequest.create({
    employeeId: employee.id,
    leaveType: leaveType.trim(),
    fromDate: start,
    toDate: end,
    isHalfDay: Boolean(isHalfDay),
    halfDaySession: isHalfDay ? halfDaySession : null,
    totalDays,
    reason: reason.trim(),
  });

  return serializeLeaveRequest({
    ...leaveRequest.toObject(),
    employee: {
      fullName: employee.userId.fullName,
      email: employee.userId.email,
    },
    employeeId: {
      _id: employee._id,
      employeeId: employee.employeeId,
    },
  });
}

async function listMyLeaveRequests(userId) {
  const employee = await getEmployeeRecordByUserId(userId);
  const requests = await LeaveRequest.find({ employeeId: employee.id })
    .sort({ createdAt: -1 })
    .lean();

  return requests.map((request) =>
    serializeLeaveRequest({
      ...request,
      employee: {
        fullName: employee.userId.fullName,
        email: employee.userId.email,
      },
      employeeId: {
        _id: employee._id,
        employeeId: employee.employeeId,
      },
    }),
  );
}

async function listAllLeaveRequests(query) {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.employeeId) {
    filters.employeeId = query.employeeId;
  }

  const requests = await LeaveRequest.find(filters)
    .populate({
      path: 'employeeId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    })
    .sort({ createdAt: -1 });

  return requests.map((request) => serializeLeaveRequest(request));
}

async function updateLeaveBalanceOnApproval(request) {
  const year = new Date(request.fromDate).getFullYear();
  const employee = await Employee.findById(request.employeeId);
  const balanceRecord = await initializeLeaveBalanceForEmployee(
    request.employeeId,
    employee.employmentType,
    year,
  );

  const balanceEntry = balanceRecord.balances.find(
    (entry) => entry.leaveType.toLowerCase() === request.leaveType.toLowerCase(),
  );

  if (!balanceEntry) {
    throw new ApiError(400, 'Leave balance entry was not found for approval.');
  }

  if (!balanceEntry.isUnlimited && balanceEntry.remaining < request.totalDays) {
    throw new ApiError(400, 'Leave approval failed because balance is no longer sufficient.');
  }

  balanceEntry.used += request.totalDays;

  if (!balanceEntry.isUnlimited) {
    balanceEntry.remaining = Math.max(balanceEntry.allocated - balanceEntry.used, 0);
  }

  await balanceRecord.save();
}

async function approveLeaveRequest(requestId, reviewerId) {
  const request = await LeaveRequest.findById(requestId).populate({
    path: 'employeeId',
    populate: {
      path: 'userId',
      select: 'fullName email',
    },
  });

  if (!request) {
    throw new ApiError(404, 'Leave request not found.');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, 'Only pending leave requests can be approved.');
  }

  await updateLeaveBalanceOnApproval(request);

  request.status = 'approved';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  request.rejectionReason = '';
  await request.save();

  return serializeLeaveRequest(request);
}

async function rejectLeaveRequest(requestId, reviewerId, rejectionReason = '') {
  const request = await LeaveRequest.findById(requestId).populate({
    path: 'employeeId',
    populate: {
      path: 'userId',
      select: 'fullName email',
    },
  });

  if (!request) {
    throw new ApiError(404, 'Leave request not found.');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, 'Only pending leave requests can be rejected.');
  }

  request.status = 'rejected';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason.trim();
  await request.save();

  return serializeLeaveRequest(request);
}

async function getAdminLeaveBalances(employeeId, year = new Date().getFullYear()) {
  return getLeaveBalancesForEmployee(employeeId, year);
}

module.exports = {
  initializeLeaveBalanceForEmployee,
  syncLeaveBalanceForEmployee,
  getLeaveBalancesForEmployee,
  applyLeaveRequest,
  listMyLeaveRequests,
  listAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getAdminLeaveBalances,
};
