const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  adminDashboard,
  employeeDashboard,
} = require('../controllers/demo.controller');

const router = express.Router();

router.get('/admin/dashboard', authenticate, authorize(ROLES.ADMIN), adminDashboard);
router.get(
  '/employee/dashboard',
  authenticate,
  authorize(ROLES.EMPLOYEE),
  employeeDashboard,
);

module.exports = router;
