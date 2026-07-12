const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const EmploymentType = require('../models/EmploymentType');
const LeavePolicy = require('../models/LeavePolicy');
const LeaveBalance = require('../models/LeaveBalance');
const {
  FIXED_LEAVE_TYPES,
  getLeaveTypeDefinition,
} = require('../constants/leaveTypes');
const ApiError = require('../utils/apiError');

function slugifyEmploymentType(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeLeaveRules(rules = []) {
  const seenTypes = new Set();
  const assignedDays = new Map();

  if (!Array.isArray(rules)) {
    throw new ApiError(400, 'Leave rules must be provided as a list.');
  }

  rules.forEach((rule) => {
    const definition = getLeaveTypeDefinition(rule.leaveType);

    if (!definition) {
      throw new ApiError(
        400,
        'Only Casual Leave, Sick Leave, Paid Leave, and Unpaid Leave are allowed.',
      );
    }

    if (seenTypes.has(definition.key)) {
      throw new ApiError(400, 'Duplicate leave types are not allowed in one policy.');
    }

    seenTypes.add(definition.key);

    const annualDays = Number(rule.annualDays ?? 0);

    if (Number.isNaN(annualDays) || annualDays < 0) {
      throw new ApiError(400, 'Annual days must be a valid number.');
    }

    assignedDays.set(definition.key, annualDays);
  });

  return FIXED_LEAVE_TYPES.map((type) => ({
    leaveType: type.label,
    annualDays: assignedDays.get(type.key) ?? 0,
    isUnlimited: false,
  }));
}

function coerceStoredLeaveRules(rules = []) {
  const assignedDays = new Map();

  if (Array.isArray(rules)) {
    rules.forEach((rule) => {
      const definition = getLeaveTypeDefinition(rule.leaveType);

      if (!definition || assignedDays.has(definition.key)) {
        return;
      }

      const annualDays = Number(rule.annualDays ?? 0);
      assignedDays.set(
        definition.key,
        Number.isNaN(annualDays) || annualDays < 0 ? 0 : annualDays,
      );
    });
  }

  return FIXED_LEAVE_TYPES.map((type) => ({
    leaveType: type.label,
    annualDays: assignedDays.get(type.key) ?? 0,
    isUnlimited: false,
  }));
}

function getRecordId(record) {
  return record?._id?.toString?.() || record?.id || null;
}

function serializePolicy(policy) {
  if (!policy) {
    return {
      id: null,
      rules: [],
    };
  }

  return {
    id: getRecordId(policy),
    rules: coerceStoredLeaveRules(policy.rules).map((rule) => ({
      leaveType: rule.leaveType,
      annualDays: rule.annualDays,
      isUnlimited: false,
    })),
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

function serializeEmploymentType(type, policy) {
  return {
    id: getRecordId(type),
    name: type.name,
    code: type.code,
    description: type.description,
    isActive: type.isActive,
    leavePolicy: serializePolicy(policy),
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
  };
}

async function listEmploymentTypes() {
  const [types, policies] = await Promise.all([
    EmploymentType.find().sort({ name: 1 }).lean(),
    LeavePolicy.find().lean(),
  ]);

  const policiesByTypeId = new Map(
    policies.map((policy) => [policy.employmentTypeId.toString(), policy]),
  );

  return types.map((type) =>
    serializeEmploymentType(type, policiesByTypeId.get(type._id.toString())),
  );
}

async function listEmploymentTypeOptions() {
  const [types, policies] = await Promise.all([
    EmploymentType.find({ isActive: true }).sort({ name: 1 }).select('name code').lean(),
    LeavePolicy.find().select('employmentTypeId rules').lean(),
  ]);

  const policyMap = new Map(
    policies.map((policy) => [
      policy.employmentTypeId.toString(),
      Array.isArray(policy.rules) && policy.rules.length > 0,
    ]),
  );

  return types.map((type) => ({
    id: type._id.toString(),
    name: type.name,
    code: type.code,
    hasLeavePolicy: policyMap.get(type._id.toString()) === true,
  }));
}

async function getEmploymentTypeById(id) {
  const type = await EmploymentType.findById(id);

  if (!type) {
    throw new ApiError(404, 'Employment type not found.');
  }

  const policy = await LeavePolicy.findOne({ employmentTypeId: type.id });

  return serializeEmploymentType(type, policy);
}

async function getEmploymentTypeByCode(code) {
  return EmploymentType.findOne({ code: code?.trim().toLowerCase() });
}

async function getLeavePolicyByEmploymentCode(code) {
  const type = await getEmploymentTypeByCode(code);

  if (!type) {
    return null;
  }

  const policy = await LeavePolicy.findOne({ employmentTypeId: type.id }).lean();

  return {
    employmentType: {
      id: type.id,
      name: type.name,
      code: type.code,
    },
    leavePolicy: serializePolicy(policy),
  };
}

async function ensureEmploymentTypeHasLeavePolicy(code) {
  const policyBundle = await getLeavePolicyByEmploymentCode(code);

  if (!policyBundle?.employmentType) {
    throw new ApiError(400, 'Select a valid active employment type.');
  }

  if (!policyBundle.leavePolicy.rules.length) {
    throw new ApiError(
      400,
      `The "${policyBundle.employmentType.name}" employment type does not have a leave policy yet. Please configure its leave policy before creating or updating an employee.`,
    );
  }

  return policyBundle;
}

async function createEmploymentType(payload) {
  const { name, description, isActive, leaveRules } = payload;

  if (!name?.trim()) {
    throw new ApiError(400, 'Employment type name is required.');
  }

  const code = slugifyEmploymentType(name);

  if (!code) {
    throw new ApiError(400, 'Employment type name is invalid.');
  }

  const existing = await EmploymentType.findOne({ code });

  if (existing) {
    throw new ApiError(409, 'An employment type with this name already exists.');
  }

  const normalizedRules = normalizeLeaveRules(leaveRules);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [type] = await EmploymentType.create(
      [
        {
          name: name.trim(),
          code,
          description: description?.trim() || '',
          isActive: isActive ?? true,
        },
      ],
      { session },
    );

    const [policy] = await LeavePolicy.create(
      [
        {
          employmentTypeId: type._id,
          rules: normalizedRules,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return serializeEmploymentType(type, policy);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      throw new ApiError(409, 'Employment type must be unique.');
    }

    throw error;
  }
}

async function updateEmploymentType(id, payload) {
  const type = await EmploymentType.findById(id);

  if (!type) {
    throw new ApiError(404, 'Employment type not found.');
  }

  if (payload.name?.trim()) {
    type.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    type.description = payload.description?.trim() || '';
  }

  if (payload.isActive !== undefined) {
    type.isActive = Boolean(payload.isActive);
  }

  await type.save();

  const policy = await LeavePolicy.findOne({ employmentTypeId: type.id });

  return serializeEmploymentType(type, policy);
}

async function updateLeavePolicy(id, leaveRules) {
  const type = await EmploymentType.findById(id);

  if (!type) {
    throw new ApiError(404, 'Employment type not found.');
  }

  const normalizedRules = normalizeLeaveRules(leaveRules);

  const policy = await LeavePolicy.findOneAndUpdate(
    { employmentTypeId: type.id },
    {
      rules: normalizedRules,
    },
    {
      new: true,
      upsert: true,
    },
  );

  const employees = await Employee.find({ employmentType: type.code }).select('_id');
  const currentYear = new Date().getFullYear();
  const { syncLeaveBalanceForEmployee } = require('./leave.service');

  for (const employee of employees) {
    const existingYears = await LeaveBalance.find({ employeeId: employee.id }).distinct('year');
    const yearsToSync = Array.from(new Set([...existingYears, currentYear]));

    for (const year of yearsToSync) {
      await syncLeaveBalanceForEmployee(employee.id, type.code, year);
    }
  }

  return serializeEmploymentType(type, policy);
}

module.exports = {
  listEmploymentTypes,
  listEmploymentTypeOptions,
  getEmploymentTypeById,
  getEmploymentTypeByCode,
  getLeavePolicyByEmploymentCode,
  ensureEmploymentTypeHasLeavePolicy,
  createEmploymentType,
  updateEmploymentType,
  updateLeavePolicy,
};
