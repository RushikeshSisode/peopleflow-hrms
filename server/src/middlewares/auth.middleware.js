const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [, token] = authorization.split(' ');

  if (!token) {
    return next(new ApiError(401, 'Authentication token is missing.'));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('-passwordHash -refreshTokenHash');

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'User is not authorized.'));
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired access token.'));
  }
}

module.exports = authenticate;
