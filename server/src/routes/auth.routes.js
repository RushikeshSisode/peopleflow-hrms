const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const {
  loginAsAdmin,
  loginAsEmployee,
  refreshAccessToken,
  logout,
  me,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login/admin', loginAsAdmin);
router.post('/login/employee', loginAsEmployee);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
