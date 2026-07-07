import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger, requestIdStore } from './logger';
import { AppError } from './errors';

/**
 * CAPITAL-AI Request & Error Middleware
 * Version 0.6.0-Beta
 */

// Generates a cryptographically strong UUID or robust fallback
export function generateRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

// 1. Request ID context management middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId ? incomingId : generateRequestId();
  
  // Set the requestId on response header so clients can track it
  res.setHeader('x-request-id', requestId);
  
  // Bind request context to AsyncLocalStorage so all child logger calls automatically capture it
  requestIdStore.run(requestId, () => {
    next();
  });
}

// 2. Performance and request diagnostics middleware
export function performanceLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();
  const startMemory = process.memoryUsage().heapUsed;

  // Since we are running asynchronously, we capture request ID inside the run loop
  const requestId = requestIdStore.getStore() || '';

  // Intercept the response writing to calculate real content length if needed
  let responseSize = 0;
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk: any, ...args: any[]): boolean {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk.toString());
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk: any, ...args: any[]): Response {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk.toString());
    }
    return originalEnd.apply(res, [chunk, ...args]);
  };

  // Log on finish
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDiffKb = Math.round((endMemory - startMemory) / 1024);

    const logMeta = {
      module: 'http',
      function: 'performance',
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: durationMs,
      responseSizeBytes: responseSize,
      memoryDeltaKb: memoryDiffKb,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || req.socket.remoteAddress || ''
    };

    const message = `HTTP ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} in ${durationMs}ms (Size: ${responseSize}B)`;
    
    if (res.statusCode >= 500) {
      logger.error(message, logMeta);
    } else if (res.statusCode >= 400) {
      logger.warn(message, logMeta);
    } else {
      logger.info(message, logMeta);
    }
  });

  next();
}

// 3. Centralized global error handling middleware
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

  // Map errors
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

  // Log error with complete context
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

  // Build secure structured response
  const responseError: any = {
    code: errorCode,
    message: message,
    timestamp: new Date().toISOString(),
    requestId: requestId
  };

  // Only expose details/stack in development environment
  if (isDev) {
    if (details) responseError.details = details;
    if (err.stack) responseError.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: responseError
  });
}
