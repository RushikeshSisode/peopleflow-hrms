const asyncHandler = require('../utils/asyncHandler');
const {
  listHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../services/holiday.service');

const listHolidaysHandler = asyncHandler(async (req, res) => {
  const holidays = await listHolidays(req.query);

  res.json({
    success: true,
    data: holidays,
  });
});

const getHolidayHandler = asyncHandler(async (req, res) => {
  const holiday = await getHolidayById(req.params.id);

  res.json({
    success: true,
    data: holiday,
  });
});

const createHolidayHandler = asyncHandler(async (req, res) => {
  const holiday = await createHoliday(req.body);

  res.status(201).json({
    success: true,
    message: 'Holiday created successfully.',
    data: holiday,
  });
});

const updateHolidayHandler = asyncHandler(async (req, res) => {
  const holiday = await updateHoliday(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Holiday updated successfully.',
    data: holiday,
  });
});

const deleteHolidayHandler = asyncHandler(async (req, res) => {
  const deletedHoliday = await deleteHoliday(req.params.id);

  res.json({
    success: true,
    message: `Holiday "${deletedHoliday.name}" deleted successfully.`,
    data: deletedHoliday,
  });
});

module.exports = {
  listHolidaysHandler,
  getHolidayHandler,
  createHolidayHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
};
