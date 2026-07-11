function errorMiddleware(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate record detected.';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorMiddleware;

