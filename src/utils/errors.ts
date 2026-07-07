/**
 * CAPITAL-AI Centralized Error Architecture
 * Version 0.6.0-Beta
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly timestamp: string;
  public readonly details?: any;
  public readonly cause?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    details?: any,
    cause?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.cause = cause;

    // Maintain proper stack trace (only in V8 engines like Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, cause?: any) {
    super(message, 400, 'VALIDATION_ERROR', details, cause);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any, cause?: any) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', details, cause);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any, cause?: any) {
    super(message, 403, 'ACCESS_DENIED', details, cause);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any, cause?: any) {
    super(message, 500, 'DATABASE_ERROR', details, cause);
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string, details?: any, cause?: any) {
    super(message, 502, 'EXTERNAL_API_ERROR', details, cause);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later', details?: any, cause?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details, cause);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: any, cause?: any) {
    super(message, 500, 'CONFIGURATION_ERROR', details, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any, cause?: any) {
    super(message, 404, 'RESOURCE_NOT_FOUND', details, cause);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred', details?: any, cause?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, cause);
  }
}
