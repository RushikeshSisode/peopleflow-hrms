const ApiError = require('../utils/apiError');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication is required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to this resource.'));
    }

    next();
  };
}

module.exports = authorize;
