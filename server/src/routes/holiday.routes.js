const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');
const {
  listHolidaysHandler,
  getHolidayHandler,
  createHolidayHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
} = require('../controllers/holiday.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', listHolidaysHandler);
router.get('/:id', getHolidayHandler);
router.post('/', authorize(ROLES.ADMIN), createHolidayHandler);
router.patch('/:id', authorize(ROLES.ADMIN), updateHolidayHandler);
router.delete('/:id', authorize(ROLES.ADMIN), deleteHolidayHandler);

module.exports = router;
