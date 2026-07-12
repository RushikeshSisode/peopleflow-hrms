const asyncHandler = require('../utils/asyncHandler');
const {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  setEmployeeStatus,
  deleteEmployee,
  listManagers,
} = require('../services/employee.service');

const createEmployeeHandler = asyncHandler(async (req, res) => {
  const employee = await createEmployee(req.body);

  res.status(201).json({
    success: true,
    message: 'Employee created successfully.',
    data: employee,
  });
});

const listEmployeesHandler = asyncHandler(async (req, res) => {
  const result = await listEmployees(req.query);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
});

const getEmployeeHandler = asyncHandler(async (req, res) => {
  const employee = await getEmployeeById(req.params.id);

  res.json({
    success: true,
    data: employee,
  });
});

const updateEmployeeHandler = asyncHandler(async (req, res) => {
  const employee = await updateEmployee(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Employee updated successfully.',
    data: employee,
  });
});

const updateEmployeeStatusHandler = asyncHandler(async (req, res) => {
  const employee = await setEmployeeStatus(req.params.id, req.body.status);

  res.json({
    success: true,
    message: `Employee ${req.body.status} successfully.`,
    data: employee,
  });
});

const listManagersHandler = asyncHandler(async (req, res) => {
  const managers = await listManagers();

  res.json({
    success: true,
    data: managers,
  });
});

const deleteEmployeeHandler = asyncHandler(async (req, res) => {
  const employee = await deleteEmployee(req.params.id);

  res.json({
    success: true,
    message: 'Employee deleted successfully.',
    data: employee,
  });
});

module.exports = {
  createEmployeeHandler,
  listEmployeesHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  updateEmployeeStatusHandler,
  deleteEmployeeHandler,
  listManagersHandler,
};
