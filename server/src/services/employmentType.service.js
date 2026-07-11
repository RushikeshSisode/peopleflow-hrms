const mongoose = require('mongoose');
const EmploymentType = require('../models/EmploymentType');
const LeavePolicy = require('../models/LeavePolicy');
const ApiError = require('../utils/apiError');

function slugifyEmploymentType(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeLeaveRules(rules = []) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return [];
  }

  const seenTypes = new Set();

  return rules.map((rule) => {
    const leaveType = rule.leaveType?.trim();

    if (!leaveType) {
      throw new ApiError(400, 'Each leave rule must include a leave type.');
    }

    const normalizedKey = leaveType.toLowerCase();

    if (seenTypes.has(normalizedKey)) {
      throw new ApiError(400, 'Duplicate leave types are not allowed in one policy.');
    }

    seenTypes.add(normalizedKey);

    const isUnlimited = Boolean(rule.isUnlimited);
    const annualDays = isUnlimited ? 0 : Number(rule.annualDays || 0);

    if (!isUnlimited && Number.isNaN(annualDays)) {
      throw new ApiError(400, 'Annual days must be a valid number.');
    }

    return {
      leaveType,
      annualDays,
      isUnlimited,
    };
  });
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
    rules: policy.rules.map((rule) => ({
      leaveType: rule.leaveType,
      annualDays: rule.annualDays,
      isUnlimited: rule.isUnlimited,
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
