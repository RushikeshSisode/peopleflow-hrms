const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  listEmploymentTypesHandler,
  listEmploymentTypeOptionsHandler,
  getEmploymentTypeHandler,
  createEmploymentTypeHandler,
  updateEmploymentTypeHandler,
  updateLeavePolicyHandler,
} = require('../controllers/employmentType.controller');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/options', listEmploymentTypeOptionsHandler);
router.get('/', listEmploymentTypesHandler);
router.get('/:id', getEmploymentTypeHandler);
router.post('/', createEmploymentTypeHandler);
router.patch('/:id', updateEmploymentTypeHandler);
router.patch('/:id/policy', updateLeavePolicyHandler);

module.exports = router;
