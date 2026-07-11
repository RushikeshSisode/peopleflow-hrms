const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  getMyLeaveBalancesHandler,
  applyLeaveRequestHandler,
  listMyLeaveRequestsHandler,
  listAllLeaveRequestsHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
  getAdminLeaveBalancesHandler,
} = require('../controllers/leave.controller');

const router = express.Router();

router.use(authenticate);

router.get('/my/balances', authorize(ROLES.EMPLOYEE), getMyLeaveBalancesHandler);
router.get('/my/requests', authorize(ROLES.EMPLOYEE), listMyLeaveRequestsHandler);
router.post('/apply', authorize(ROLES.EMPLOYEE), applyLeaveRequestHandler);

router.get('/admin/requests', authorize(ROLES.ADMIN), listAllLeaveRequestsHandler);
router.get(
  '/admin/balances/:employeeId',
  authorize(ROLES.ADMIN),
  getAdminLeaveBalancesHandler,
);
router.patch('/:id/approve', authorize(ROLES.ADMIN), approveLeaveRequestHandler);
router.patch('/:id/reject', authorize(ROLES.ADMIN), rejectLeaveRequestHandler);

module.exports = router;
