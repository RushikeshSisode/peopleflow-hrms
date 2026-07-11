const asyncHandler = require('../utils/asyncHandler');
const {
  getLeaveBalancesForEmployee,
  applyLeaveRequest,
  listMyLeaveRequests,
  listAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getAdminLeaveBalances,
} = require('../services/leave.service');
const Employee = require('../models/Employee');

const getMyLeaveBalancesHandler = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user.id });
  const balances = await getLeaveBalancesForEmployee(
    employee.id,
    req.query.year ? Number(req.query.year) : undefined,
  );

  res.json({
    success: true,
    data: balances,
  });
});

const applyLeaveRequestHandler = asyncHandler(async (req, res) => {
  const leaveRequest = await applyLeaveRequest(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully.',
    data: leaveRequest,
  });
});

const listMyLeaveRequestsHandler = asyncHandler(async (req, res) => {
  const requests = await listMyLeaveRequests(req.user.id);

  res.json({
    success: true,
    data: requests,
  });
});

const listAllLeaveRequestsHandler = asyncHandler(async (req, res) => {
  const requests = await listAllLeaveRequests(req.query);

  res.json({
    success: true,
    data: requests,
  });
});

const approveLeaveRequestHandler = asyncHandler(async (req, res) => {
  const request = await approveLeaveRequest(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Leave request approved successfully.',
    data: request,
  });
});

const rejectLeaveRequestHandler = asyncHandler(async (req, res) => {
  const request = await rejectLeaveRequest(
    req.params.id,
    req.user.id,
    req.body.rejectionReason,
  );

  res.json({
    success: true,
    message: 'Leave request rejected successfully.',
    data: request,
  });
});

const getAdminLeaveBalancesHandler = asyncHandler(async (req, res) => {
  const balances = await getAdminLeaveBalances(
    req.params.employeeId,
    req.query.year ? Number(req.query.year) : undefined,
  );

  res.json({
    success: true,
    data: balances,
  });
});

module.exports = {
  getMyLeaveBalancesHandler,
  applyLeaveRequestHandler,
  listMyLeaveRequestsHandler,
  listAllLeaveRequestsHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
  getAdminLeaveBalancesHandler,
};
