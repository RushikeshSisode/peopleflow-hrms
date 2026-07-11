const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const ROLES = require('../constants/roles');
const ApiError = require('../utils/apiError');
const { compareValue, hashValue } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

function buildAccessPayload(user) {
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
  };
}

async function buildUserProfile(user) {
  const profile = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  if (user.role === ROLES.EMPLOYEE) {
    const employee = await Employee.findOne({ userId: user.id }).lean();

    if (employee) {
      profile.employee = {
        employeeId: employee.employeeId,
        phoneNumber: employee.phoneNumber,
        designation: employee.designation,
        department: employee.department,
        dateOfJoining: employee.dateOfJoining,
        monthlySalary: employee.monthlySalary,
        employmentType: employee.employmentType,
        status: employee.status,
      };
    }
  }

  return profile;
}

async function persistRefreshToken(userId, refreshToken) {
  const refreshTokenHash = await hashValue(refreshToken);

  await User.findByIdAndUpdate(userId, {
    refreshTokenHash,
  });
}

async function createSession(user) {
  const accessToken = signAccessToken(buildAccessPayload(user));
  const refreshToken = signRefreshToken({
    sub: user.id,
    tokenId: crypto.randomUUID(),
  });

  await persistRefreshToken(user.id, refreshToken);
  await User.findByIdAndUpdate(user.id, { lastLoginAt: new Date() });

  return {
    accessToken,
    refreshToken,
    user: await buildUserProfile(user),
  };
}

async function login({ email, password, expectedRole }) {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account is inactive. Please contact admin.');
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new ApiError(403, `This login is only available for ${expectedRole}s.`);
  }

  const isPasswordValid = await compareValue(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return createSession(user);
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing.');
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw new ApiError(401, 'User session is no longer valid.');
  }

  const isTokenMatch = await compareValue(refreshToken, user.refreshTokenHash);

  if (!isTokenMatch) {
    throw new ApiError(401, 'Refresh token does not match active session.');
  }

  return createSession(user);
}

async function clearSession(userId) {
  if (!userId) {
    return;
  }

  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: null,
  });
}

async function clearSessionByRefreshToken(refreshToken) {
  if (!refreshToken) {
    return;
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return;
  }

  await clearSession(decoded.sub);
}

module.exports = {
  login,
  refreshSession,
  clearSession,
  clearSessionByRefreshToken,
  buildUserProfile,
};
