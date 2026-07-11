const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  runPayrollHandler,
  listAdminPayrollsHandler,
  getAdminPayrollHandler,
  listMyPayrollsHandler,
  downloadSalarySlipHandler,
} = require('../controllers/payroll.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize(ROLES.EMPLOYEE), listMyPayrollsHandler);
router.post('/run', authorize(ROLES.ADMIN), runPayrollHandler);
router.get('/admin', authorize(ROLES.ADMIN), listAdminPayrollsHandler);
router.get('/admin/:id', authorize(ROLES.ADMIN), getAdminPayrollHandler);
router.get('/:id/slip', downloadSalarySlipHandler);

module.exports = router;
