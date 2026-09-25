import { errorResponse, AppError } from '../utils/errors.js';

export function errorHandler(err, _req, res, _next) {
  if (!(err instanceof AppError) && err.name === 'ValidationError') {
    const fields = {};
    for (const [k, v] of Object.entries(err.errors || {})) fields[k] = v.message;
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message, fields },
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Duplicate key' },
    });
  }
  const { status, body } = errorResponse(err);
  if (status >= 500) console.error(err);
  res.status(status).json(body);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
