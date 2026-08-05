import { HttpStatusMessage } from '../constants/http-status-message.constant';
import { HttpStatusCode } from '../constants/http-status.constant';

export default class AppError extends Error {
  statusCode: number;
  isOperational: boolean; // ← bedakan error yang "expected" vs bug
  details?: unknown; // ← untuk validation errors, dll

  constructor(
    message: HttpStatusMessage | string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name; // ← otomatis ambil nama class
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// 4xx — Client Errors
// ============================================

export class ErrorBadRequest extends AppError {
  constructor(message: string = HttpStatusMessage.BAD_REQUEST, details?: unknown) {
    super(message, HttpStatusCode.BAD_REQUEST, details);
  }
}

export class ErrorUnauthorized extends AppError {
  constructor(message: string = HttpStatusMessage.UNAUTHORIZED, details?: unknown) {
    super(message, HttpStatusCode.UNAUTHORIZED, details);
  }
}

export class ErrorForbidden extends AppError {
  constructor(message: string = HttpStatusMessage.FORBIDDEN, details?: unknown) {
    super(message, HttpStatusCode.FORBIDDEN, details);
  }
}

export class ErrorNotFound extends AppError {
  constructor(message: string = HttpStatusMessage.NOT_FOUND, details?: unknown) {
    super(message, HttpStatusCode.NOT_FOUND, details);
  }
}

export class ErrorConflict extends AppError {
  constructor(message: string = HttpStatusMessage.CONFLICT, details?: unknown) {
    super(message, HttpStatusCode.CONFLICT, details);
  }
}

export class ErrorValidation extends AppError {
  constructor(message: string = HttpStatusMessage.UNPROCESSABLE_ENTITY, details?: unknown) {
    super(message, HttpStatusCode.UNPROCESSABLE_ENTITY, details);
  }
}

export class ErrorPreconditionFailed extends AppError {
  constructor(message: string = HttpStatusMessage.PRECONDITION_FAILED, details?: unknown) {
    super(message, HttpStatusCode.PRECONDITION_FAILED, details);
  }
}

export class ErrorTooManyRequests extends AppError {
  constructor(message: string = HttpStatusMessage.TOO_MANY_REQUESTS, details?: unknown) {
    super(message, HttpStatusCode.TOO_MANY_REQUESTS, details);
  }
}

// ============================================
// 5xx — Server Errors
// ============================================

export class ErrorInternalServer extends AppError {
  constructor(message: string = HttpStatusMessage.INTERNAL_SERVER_ERROR, details?: unknown) {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, details);
  }
}

export class ErrorNotImplemented extends AppError {
  constructor(message: string = HttpStatusMessage.NOT_IMPLEMENTED, details?: unknown) {
    super(message, HttpStatusCode.NOT_IMPLEMENTED, details);
  }
}

export class ErrorServiceUnavailable extends AppError {
  constructor(message: string = HttpStatusMessage.SERVICE_UNAVAILABLE, details?: unknown) {
    super(message, HttpStatusCode.SERVICE_UNAVAILABLE, details);
  }
}

// ============================================
// Type Guards
// ============================================

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
