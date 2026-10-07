const { ZodError } = require('zod');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, null, 'NOT_FOUND'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code || 'SERVER_ERROR';
  let details = err.details || null;

  if (err instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    message = details[0] ? details[0].message : 'Invalid input';
  } else if (err.name === 'ValidationError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0] ? details[0].message : 'Invalid input';
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `That ${field} is already in use`;
    details = err.keyValue;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    code = 'UNAUTHENTICATED';
    message = 'Session expired. Log in again.';
  } else if (err.name === 'MulterError') {
    status = 400;
    code = 'UPLOAD_ERROR';
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'BAD_JSON';
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (status >= 500) {
    // Operational errors (gateway down, not configured) carry a safe message; anything else is a bug.
    if (err.isOperational) logger.error(`${req.method} ${req.originalUrl} -> ${status} ${message}`);
    else {
      logger.error(`${req.method} ${req.originalUrl}`, err);
      if (env.isProd) {
        message = 'Something went wrong';
        details = null;
      }
    }
  }
  res.status(status).json({ success: false, message, error: { code, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
