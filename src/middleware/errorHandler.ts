import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger, requestIdStore } from '../server/logger';

/**
 * CAPITAL-AI Global Error Handler Middleware
 * Version 0.5.5 (Beta-Phase)
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = requestIdStore.getStore() || '';
  const isDev = (process.env.NODE_ENV || 'development') === 'development';

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;
  let cause: any = undefined;

  // Type identification and normalization
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
    cause = err.cause;
  } else if (err.name === 'ValidationError' || err.status === 400) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message || 'Invalid request payload';
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_REQUIRED';
    message = err.message || 'Authentication required';
  } else if (err.name === 'ForbiddenError' || err.status === 403) {
    statusCode = 403;
    errorCode = 'ACCESS_DENIED';
    message = err.message || 'Access denied';
  } else if (err.status === 404) {
    statusCode = 404;
    errorCode = 'RESOURCE_NOT_FOUND';
    message = err.message || 'Resource not found';
  } else if (err.status === 429) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = err.message || 'Too many requests';
  }

  // Log full error trace securely via centralized logger
  logger.error(`Exception handled by Global Middleware: ${err.message || err}`, {
    module: 'middleware',
    function: 'globalErrorHandler',
    requestId,
    statusCode,
    errorCode,
    details,
    cause: cause ? (cause.message || cause) : undefined,
    stack: err.stack
  });

  // Prepare standard secure response payload
  const responseError: any = {
    code: errorCode,
    message: message,
    timestamp: new Date().toISOString(),
    requestId: requestId
  };

  // Expose detailed diagnostic stack only during non-production development
  if (isDev) {
    if (details) responseError.details = details;
    if (err.stack) responseError.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: responseError
  });
}
