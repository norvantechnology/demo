export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function errorResponse(err) {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'SERVER_ERROR' : 'ERROR');
  const body = {
    error: {
      code,
      message: err.message || 'Internal server error',
    },
  };
  if (err.fields) body.error.fields = err.fields;
  return { status, body };
}

export const Errors = {
  validation: (message, fields) => new AppError(400, 'VALIDATION_ERROR', message, fields),
  unauthorized: (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Not found') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message = 'Conflict') => new AppError(409, 'CONFLICT', message),
};
