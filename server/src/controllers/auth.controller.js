const env = require('../config/env');
const ROLES = require('../constants/roles');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const {
  login,
  refreshSession,
  clearSessionByRefreshToken,
  buildUserProfile,
} = require('../services/auth.service');

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.cookieName, refreshToken, {
    ...getCookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.cookieName, getCookieBaseOptions());
}

const loginAsAdmin = asyncHandler(async (req, res) => {
  const session = await login({
    email: req.body.email,
    password: req.body.password,
    expectedRole: ROLES.ADMIN,
  });

  setRefreshCookie(res, session.refreshToken);

  res.json({
    success: true,
    message: 'Admin login successful.',
    data: {
      accessToken: session.accessToken,
      user: session.user,
    },
  });
});

const loginAsEmployee = asyncHandler(async (req, res) => {
  const session = await login({
    email: req.body.email,
    password: req.body.password,
    expectedRole: ROLES.EMPLOYEE,
  });

  setRefreshCookie(res, session.refreshToken);

  res.json({
    success: true,
    message: 'Employee login successful.',
    data: {
      accessToken: session.accessToken,
      user: session.user,
    },
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const session = await refreshSession(req.cookies[env.cookieName]);

  setRefreshCookie(res, session.refreshToken);

  res.json({
    success: true,
    message: 'Access token refreshed successfully.',
    data: {
      accessToken: session.accessToken,
      user: session.user,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[env.cookieName];

  await clearSessionByRefreshToken(refreshToken);

  clearRefreshCookie(res);

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    clearRefreshCookie(res);
    return res.status(401).json({
      success: false,
      message: 'User not found.',
    });
  }

  const profile = await buildUserProfile(user);

  res.json({
    success: true,
    data: profile,
  });
});

module.exports = {
  loginAsAdmin,
  loginAsEmployee,
  refreshAccessToken,
  logout,
  me,
};
