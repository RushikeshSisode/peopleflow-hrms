const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  createEmployeeHandler,
  listEmployeesHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  updateEmployeeStatusHandler,
  deleteEmployeeHandler,
  listManagersHandler,
} = require('../controllers/employee.controller');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/managers', listManagersHandler);
router.post('/', createEmployeeHandler);
router.get('/', listEmployeesHandler);
router.get('/:id', getEmployeeHandler);
router.patch('/:id', updateEmployeeHandler);
router.patch('/:id/status', updateEmployeeStatusHandler);
router.delete('/:id', deleteEmployeeHandler);

module.exports = router;
