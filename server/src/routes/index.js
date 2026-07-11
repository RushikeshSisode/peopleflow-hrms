const express = require('express');
const authRoutes = require('./auth.routes');
const attendanceRoutes = require('./attendance.routes');
const demoRoutes = require('./demo.routes');
const employeeRoutes = require('./employee.routes');
const employmentTypeRoutes = require('./employmentType.routes');
const leaveRoutes = require('./leave.routes');
const holidayRoutes = require('./holiday.routes');
const payrollRoutes = require('./payroll.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HRMS API is running.',
  });
});

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/employees', employeeRoutes);
router.use('/employment-types', employmentTypeRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/payroll', payrollRoutes);
router.use('/', demoRoutes);

module.exports = router;
