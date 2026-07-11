const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  getTodayAttendanceHandler,
  punchInHandler,
  punchOutHandler,
  getMyAttendanceCalendarHandler,
  getMyAttendanceHistoryHandler,
  getMyAttendanceDayHandler,
  getAdminAttendanceRecordsHandler,
  getAdminAttendanceReportHandler,
} = require('../controllers/attendance.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me/today', authorize(ROLES.EMPLOYEE), getTodayAttendanceHandler);
router.get('/me/calendar', authorize(ROLES.EMPLOYEE), getMyAttendanceCalendarHandler);
router.get('/me/history', authorize(ROLES.EMPLOYEE), getMyAttendanceHistoryHandler);
router.get('/me/day', authorize(ROLES.EMPLOYEE), getMyAttendanceDayHandler);
router.post('/punch-in', authorize(ROLES.EMPLOYEE), punchInHandler);
router.post('/punch-out', authorize(ROLES.EMPLOYEE), punchOutHandler);

router.get('/admin/records', authorize(ROLES.ADMIN), getAdminAttendanceRecordsHandler);
router.get('/admin/report', authorize(ROLES.ADMIN), getAdminAttendanceReportHandler);

module.exports = router;
