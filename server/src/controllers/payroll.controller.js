const asyncHandler = require('../utils/asyncHandler');
const {
  runPayroll,
  listAdminPayrolls,
  getAdminPayrollById,
  listMyPayrolls,
  buildSalarySlipDownload,
} = require('../services/payroll.service');

const runPayrollHandler = asyncHandler(async (req, res) => {
  const payrolls = await runPayroll(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Payroll processed successfully.',
    data: payrolls,
  });
});

const listAdminPayrollsHandler = asyncHandler(async (req, res) => {
  const payrolls = await listAdminPayrolls(req.query);

  res.json({
    success: true,
    data: payrolls,
  });
});

const getAdminPayrollHandler = asyncHandler(async (req, res) => {
  const payroll = await getAdminPayrollById(req.params.id);

  res.json({
    success: true,
    data: payroll,
  });
});

const listMyPayrollsHandler = asyncHandler(async (req, res) => {
  const payrolls = await listMyPayrolls(req.user.id);

  res.json({
    success: true,
    data: payrolls,
  });
});

const downloadSalarySlipHandler = asyncHandler(async (req, res) => {
  const slip = await buildSalarySlipDownload(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slip.filename}"`);
  res.send(slip.buffer);
});

module.exports = {
  runPayrollHandler,
  listAdminPayrollsHandler,
  getAdminPayrollHandler,
  listMyPayrollsHandler,
  downloadSalarySlipHandler,
};
