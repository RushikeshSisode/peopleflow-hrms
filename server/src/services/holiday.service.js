const Holiday = require('../models/Holiday');
const ApiError = require('../utils/apiError');

function normalizeDate(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function serializeHoliday(record) {
  return {
    id: record._id?.toString?.() || record.id,
    name: record.name,
    date: record.date,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function listHolidays(query = {}) {
  const filters = {};

  if (query.year) {
    const year = Number(query.year);
    filters.date = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    };
  }

  const holidays = await Holiday.find(filters).sort({ date: 1 }).lean();
  return holidays.map((holiday) => serializeHoliday(holiday));
}

async function getHolidayById(id) {
  const holiday = await Holiday.findById(id);

  if (!holiday) {
    throw new ApiError(404, 'Holiday not found.');
  }

  return serializeHoliday(holiday);
}

async function createHoliday(payload) {
  const { name, date, description } = payload;

  if (!name?.trim() || !date) {
    throw new ApiError(400, 'Holiday name and date are required.');
  }

  const normalizedDate = normalizeDate(date);

  const existingHoliday = await Holiday.findOne({ date: normalizedDate });

  if (existingHoliday) {
    throw new ApiError(409, 'A holiday already exists for this date.');
  }

  const holiday = await Holiday.create({
    name: name.trim(),
    date: normalizedDate,
    description: description?.trim() || '',
  });

  return serializeHoliday(holiday);
}

async function updateHoliday(id, payload) {
  const holiday = await Holiday.findById(id);

  if (!holiday) {
    throw new ApiError(404, 'Holiday not found.');
  }

  if (payload.name?.trim()) {
    holiday.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    holiday.description = payload.description?.trim() || '';
  }

  if (payload.date) {
    const normalizedDate = normalizeDate(payload.date);
    const existingHoliday = await Holiday.findOne({
      date: normalizedDate,
      _id: { $ne: holiday._id },
    });

    if (existingHoliday) {
      throw new ApiError(409, 'Another holiday already exists for this date.');
    }

    holiday.date = normalizedDate;
  }

  await holiday.save();
  return serializeHoliday(holiday);
}

async function deleteHoliday(id) {
  const holiday = await Holiday.findById(id);

  if (!holiday) {
    throw new ApiError(404, 'Holiday not found.');
  }

  await holiday.deleteOne();

  return {
    id,
    name: holiday.name,
  };
}

module.exports = {
  listHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
