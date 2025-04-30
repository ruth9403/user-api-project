const { AppError } = require('../utils/error');

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    status: err.status,
    code: err.code,
    details: err.details
  });

  // Handle database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Username or email already exists'
      }
    });
  }

  // Handle validation errors from isSouthOrNorth
  if (err.message.includes('Bad values')) {
    return res.status(400).json({
      error: {
        code: 'INVALID_COORDINATES',
        message: 'Coordinates are invalid'
      }
    });
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: err.message
    }
  });
};

module.exports = errorHandler;