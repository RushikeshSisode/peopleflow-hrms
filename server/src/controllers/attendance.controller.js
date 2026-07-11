const asyncHandler = require('../utils/asyncHandler');
const {
  getTodayAttendanceForUser,
  punchIn,
  punchOut,
  getMyAttendanceCalendar,
  getMyAttendanceHistory,
  getMyAttendanceDay,
  getAdminAttendanceRecords,
  getAdminAttendanceReport,
} = require('../services/attendance.service');

const getTodayAttendanceHandler = asyncHandler(async (req, res) => {
  const attendance = await getTodayAttendanceForUser(req.user.id);

  res.json({
    success: true,
    data: attendance,
  });
});

const punchInHandler = asyncHandler(async (req, res) => {
  const attendance = await punchIn(req.user.id);

  res.status(201).json({
    success: true,
    message: 'Punched in successfully.',
    data: attendance,
  });
});

const punchOutHandler = asyncHandler(async (req, res) => {
  const attendance = await punchOut(req.user.id);

  res.json({
    success: true,
    message: 'Punched out successfully.',
    data: attendance,
  });
});

const getMyAttendanceCalendarHandler = asyncHandler(async (req, res) => {
  const calendar = await getMyAttendanceCalendar(req.user.id, req.query);

  res.json({
    success: true,
    data: calendar,
  });
});

const getMyAttendanceHistoryHandler = asyncHandler(async (req, res) => {
  const history = await getMyAttendanceHistory(req.user.id, req.query);

  res.json({
    success: true,
    data: history,
  });
});

const getMyAttendanceDayHandler = asyncHandler(async (req, res) => {
  const day = await getMyAttendanceDay(req.user.id, req.query);

  res.json({
    success: true,
    data: day,
  });
});

const getAdminAttendanceRecordsHandler = asyncHandler(async (req, res) => {
  const records = await getAdminAttendanceRecords(req.query);

  res.json({
    success: true,
    data: records,
  });
});

const getAdminAttendanceReportHandler = asyncHandler(async (req, res) => {
  const report = await getAdminAttendanceReport(req.query);

  res.json({
    success: true,
    data: report,
  });
});

module.exports = {
  getTodayAttendanceHandler,
  punchInHandler,
  punchOutHandler,
  getMyAttendanceCalendarHandler,
  getMyAttendanceHistoryHandler,
  getMyAttendanceDayHandler,
  getAdminAttendanceRecordsHandler,
  getAdminAttendanceReportHandler,
};
