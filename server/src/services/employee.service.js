const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const EmploymentType = require('../models/EmploymentType');
const LeaveBalance = require('../models/LeaveBalance');
const ROLES = require('../constants/roles');
const ApiError = require('../utils/apiError');
const { hashValue } = require('../utils/password');
const { generateEmployeeId } = require('../utils/employeeId');
const {
  getLeavePolicyByEmploymentCode,
  ensureEmploymentTypeHasLeavePolicy,
} = require('./employmentType.service');
const {
  initializeLeaveBalanceForEmployee,
  syncLeaveBalanceForEmployee,
} = require('./leave.service');

function normalizeEmploymentType(value) {
  return value?.trim().toLowerCase().replace(/\s+/g, '_');
}

function buildEmployeeResponse(record) {
  return {
    id: record._id?.toString?.() || record.id,
    employeeId: record.employeeId,
    fullName: record.user?.fullName || record.fullName,
    email: record.user?.email || record.email,
    phoneNumber: record.phoneNumber,
    designation: record.designation,
    department: record.department,
    dateOfJoining: record.dateOfJoining,
    monthlySalary: record.monthlySalary,
    employmentType: record.employmentType,
    employmentTypeLabel:
      record.employmentTypeMeta?.name ||
      record.employmentTypeLabel ||
      record.employmentType,
    status: record.status,
    reportingManager: record.reportingManagerId
      ? {
          id:
            record.reportingManagerId._id?.toString?.() ||
            record.reportingManagerId.id ||
            record.reportingManagerId.toString?.(),
          employeeId: record.reportingManagerId.employeeId,
          fullName:
            record.reportingManagerId.userId?.fullName ||
            record.reportingManagerId.fullName ||
            null,
        }
      : null,
    createdAt: record.createdAt,
    inheritedLeavePolicy: record.inheritedLeavePolicy || null,
    updatedAt: record.updatedAt,
  };
}

function buildListFilters(query) {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.department) {
    filters.department = { $regex: query.department.trim(), $options: 'i' };
  }

  if (query.designation) {
    filters.designation = { $regex: query.designation.trim(), $options: 'i' };
  }

  if (query.employmentType) {
    filters.employmentType = normalizeEmploymentType(query.employmentType);
  }

  return filters;
}

async function validateReportingManager(reportingManagerId, currentEmployeeId = null) {
  if (!reportingManagerId) {
    return null;
  }

  if (currentEmployeeId && reportingManagerId === currentEmployeeId) {
    throw new ApiError(400, 'Employee cannot report to themselves.');
  }

  const manager = await Employee.findById(reportingManagerId);

  if (!manager) {
    throw new ApiError(404, 'Reporting manager not found.');
  }

  return manager.id;
}

async function createEmployee(payload) {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    dateOfJoining,
    designation,
    department,
    monthlySalary,
    employmentType,
    reportingManagerId,
  } = payload;

  if (
    !fullName ||
    !email ||
    !password ||
    !phoneNumber ||
    !dateOfJoining ||
    !designation ||
    !department ||
    monthlySalary === undefined ||
    !employmentType
  ) {
    throw new ApiError(400, 'All required employee fields must be provided.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedEmploymentType = normalizeEmploymentType(employmentType);
  const employmentTypeRecord = await EmploymentType.findOne({
    code: normalizedEmploymentType,
    isActive: true,
  });

  if (!employmentTypeRecord) {
    throw new ApiError(400, 'Select a valid active employment type.');
  }

  await ensureEmploymentTypeHasLeavePolicy(normalizedEmploymentType);

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const managerId = await validateReportingManager(reportingManagerId || null);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const passwordHash = await hashValue(password);

    const [user] = await User.create(
      [
        {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: ROLES.EMPLOYEE,
          isActive: true,
        },
      ],
      { session },
    );

    const employeeId = await generateEmployeeId();

    const [employee] = await Employee.create(
      [
        {
          userId: user._id,
          employeeId,
          phoneNumber: phoneNumber.trim(),
          designation: designation.trim(),
          department: department.trim(),
          dateOfJoining,
          monthlySalary: Number(monthlySalary),
          employmentType: normalizedEmploymentType,
          reportingManagerId: managerId,
          status: 'active',
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    await initializeLeaveBalanceForEmployee(
      employee.id,
      normalizedEmploymentType,
      new Date(dateOfJoining).getFullYear(),
    );

    return getEmployeeById(employee.id);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      throw new ApiError(409, 'Employee details must be unique.');
    }

    throw error;
  }
}

async function listEmployees(query) {
  const page = Math.max(Number.parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || '10', 10), 1), 50);
  const skip = (page - 1) * limit;
  const filters = buildListFilters(query);
  const search = query.search?.trim();
  const employmentTypeFilter = query.employmentType?.trim().toLowerCase();

  if (employmentTypeFilter) {
    filters.employmentType = employmentTypeFilter;
  }

  const pipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'reportingManagerId',
        foreignField: '_id',
        as: 'reportingManager',
      },
    },
    {
      $lookup: {
        from: 'employmenttypes',
        localField: 'employmentType',
        foreignField: 'code',
        as: 'employmentTypeMeta',
      },
    },
    {
      $unwind: {
        path: '$employmentTypeMeta',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$reportingManager',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'reportingManager.userId',
        foreignField: '_id',
        as: 'reportingManagerUser',
      },
    },
    {
      $unwind: {
        path: '$reportingManagerUser',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { employeeId: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { 'user.fullName': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      items: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await Employee.aggregate(pipeline);
  const items = result?.items || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    items: items.map((item) =>
      buildEmployeeResponse({
        ...item,
        user: item.user,
        employmentTypeMeta: item.employmentTypeMeta,
        reportingManagerId: item.reportingManager
          ? {
              ...item.reportingManager,
              userId: item.reportingManagerUser,
            }
          : null,
      }),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getEmployeeById(employeeId) {
  const employee = await Employee.findById(employeeId)
    .populate('userId', 'fullName email isActive')
    .populate({
      path: 'reportingManagerId',
      populate: {
        path: 'userId',
        select: 'fullName email',
      },
    });

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  const [employmentTypeMeta, inheritedLeavePolicy] = await Promise.all([
    EmploymentType.findOne({ code: employee.employmentType }).lean(),
    getLeavePolicyByEmploymentCode(employee.employmentType),
  ]);

  return buildEmployeeResponse({
    ...employee.toObject(),
    user: employee.userId,
    employmentTypeMeta,
    inheritedLeavePolicy,
    reportingManagerId: employee.reportingManagerId,
  });
}

async function updateEmployee(employeeId, payload) {
  const employee = await Employee.findById(employeeId).populate('userId');

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  const {
    fullName,
    email,
    phoneNumber,
    dateOfJoining,
    designation,
    department,
    monthlySalary,
    employmentType,
    reportingManagerId,
  } = payload;
  const previousEmploymentType = employee.employmentType;

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: employee.userId._id },
    });

    if (existingUser) {
      throw new ApiError(409, 'Another user already has this email address.');
    }

    employee.userId.email = normalizedEmail;
  }

  if (fullName) {
    employee.userId.fullName = fullName.trim();
  }

  if (phoneNumber) {
    employee.phoneNumber = phoneNumber.trim();
  }

  if (designation) {
    employee.designation = designation.trim();
  }

  if (department) {
    employee.department = department.trim();
  }

  if (dateOfJoining) {
    employee.dateOfJoining = dateOfJoining;
  }

  if (monthlySalary !== undefined) {
    employee.monthlySalary = Number(monthlySalary);
  }

  if (employmentType) {
    const normalizedEmploymentType = normalizeEmploymentType(employmentType);
    const employmentTypeRecord = await EmploymentType.findOne({
      code: normalizedEmploymentType,
      isActive: true,
    });

    if (!employmentTypeRecord) {
      throw new ApiError(400, 'Select a valid active employment type.');
    }

    await ensureEmploymentTypeHasLeavePolicy(normalizedEmploymentType);
    employee.employmentType = normalizedEmploymentType;
  }

  if (reportingManagerId !== undefined) {
    employee.reportingManagerId = await validateReportingManager(
      reportingManagerId || null,
      employee.id,
    );
  }

  await employee.userId.save();
  await employee.save();

  if (employmentType && previousEmploymentType !== employee.employmentType) {
    const existingBalanceYears = await LeaveBalance.find({ employeeId: employee.id })
      .distinct('year');
    const currentYear = new Date().getFullYear();
    const yearsToSync = Array.from(new Set([...existingBalanceYears, currentYear]));

    await Promise.all(
      yearsToSync.map((year) =>
        syncLeaveBalanceForEmployee(employee.id, employee.employmentType, year),
      ),
    );
  }

  return getEmployeeById(employee.id);
}

async function setEmployeeStatus(employeeId, status) {
  if (!['active', 'inactive'].includes(status)) {
    throw new ApiError(400, 'Status must be active or inactive.');
  }

  const employee = await Employee.findById(employeeId).populate('userId');

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  employee.status = status;
  employee.userId.isActive = status === 'active';

  await employee.userId.save();
  await employee.save();

  return getEmployeeById(employee.id);
}

async function listManagers() {
  const employees = await Employee.find({
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  })
    .populate('userId', 'fullName')
    .sort({ employeeId: 1 });

  return employees.map((employee) => ({
    id: employee.id,
    employeeId: employee.employeeId,
    fullName: employee.userId.fullName,
    designation: employee.designation,
  }));
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  setEmployeeStatus,
  listManagers,
};
