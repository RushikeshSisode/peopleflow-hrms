function adminDashboard(req, res) {
  res.json({
    success: true,
    data: {
      title: 'Admin Dashboard',
      message: `Welcome back, ${req.user.fullName}.`,
      permissions: ['manage-employees', 'view-reports', 'run-payroll'],
    },
  });
}

function employeeDashboard(req, res) {
  res.json({
    success: true,
    data: {
      title: 'Employee Dashboard',
      message: `Welcome back, ${req.user.fullName}.`,
      permissions: ['mark-attendance', 'apply-leave', 'view-payslips'],
    },
  });
}

module.exports = {
  adminDashboard,
  employeeDashboard,
};
