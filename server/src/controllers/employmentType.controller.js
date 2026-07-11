const asyncHandler = require('../utils/asyncHandler');
const {
  listEmploymentTypes,
  listEmploymentTypeOptions,
  getEmploymentTypeById,
  createEmploymentType,
  updateEmploymentType,
  updateLeavePolicy,
} = require('../services/employmentType.service');

const listEmploymentTypesHandler = asyncHandler(async (req, res) => {
  const types = await listEmploymentTypes();

  res.json({
    success: true,
    data: types,
  });
});

const listEmploymentTypeOptionsHandler = asyncHandler(async (req, res) => {
  const options = await listEmploymentTypeOptions();

  res.json({
    success: true,
    data: options,
  });
});

const getEmploymentTypeHandler = asyncHandler(async (req, res) => {
  const type = await getEmploymentTypeById(req.params.id);

  res.json({
    success: true,
    data: type,
  });
});

const createEmploymentTypeHandler = asyncHandler(async (req, res) => {
  const type = await createEmploymentType(req.body);

  res.status(201).json({
    success: true,
    message: 'Employment type created successfully.',
    data: type,
  });
});

const updateEmploymentTypeHandler = asyncHandler(async (req, res) => {
  const type = await updateEmploymentType(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Employment type updated successfully.',
    data: type,
  });
});

const updateLeavePolicyHandler = asyncHandler(async (req, res) => {
  const type = await updateLeavePolicy(req.params.id, req.body.leaveRules);

  res.json({
    success: true,
    message: 'Leave policy updated successfully.',
    data: type,
  });
});

module.exports = {
  listEmploymentTypesHandler,
  listEmploymentTypeOptionsHandler,
  getEmploymentTypeHandler,
  createEmploymentTypeHandler,
  updateEmploymentTypeHandler,
  updateLeavePolicyHandler,
};
