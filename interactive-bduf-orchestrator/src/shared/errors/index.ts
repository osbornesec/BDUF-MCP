// Base error infrastructure
export {
  BaseError,
  UnknownError,
  RetryFailedError,
  ErrorMetadata,
  ErrorSeverityLevel,
  ErrorResponse
} from './base-error.js';

// Specialized error types
export { ValidationError } from './validation-error.js';
export { NotFoundError } from './not-found-error.js';
export { PermissionError } from './permission-error.js';
export { ExternalServiceError } from './external-service-error.js';
export { ConflictError } from './conflict-error.js';

// Error handling infrastructure
export {
  ErrorHandler,
  ErrorContext,
  MetricsCollector,
  ErrorHandlerConfig,
  ErrorHandlerDependencies,
  ErrorNotificationService,
  ErrorSummary
} from './error-handler.js';

// Async utilities
export {
  asyncHandler,
  withErrorBoundary,
  safeAsync,
  retryWithBackoff,
  withTimeout,
  CircuitBreaker,
  batchProcess,
  debounceAsync,
  throttleAsync,
  PromisePool,
  RetryOptions,
  CircuitBreakerOptions,
  TimeoutOptions
} from './async-utils.js';

// Common error factory functions
export class ErrorFactory {
  // Validation errors
  static validation(message: string, field?: string, value?: unknown): ValidationError {
    return new ValidationError(message, field, value);
  }

  static missingField(field: string): ValidationError {
    return ValidationError.forMissingField(field);
  }

  static invalidType(field: string, expected: string, actual: string): ValidationError {
    return ValidationError.forInvalidType(field, expected, actual);
  }

  static invalidFormat(field: string, format: string, value?: unknown): ValidationError {
    return ValidationError.forInvalidFormat(field, format, value);
  }

  static outOfRange(field: string, value: unknown, min?: number, max?: number): ValidationError {
    return ValidationError.forOutOfRange(field, value, min, max);
  }

  // Not found errors
  static notFound(resource: string, identifier?: string | number): NotFoundError {
    return new NotFoundError(resource, identifier);
  }

  static entityNotFound(entityType: string, id: string | number): NotFoundError {
    return NotFoundError.forEntity(entityType, id);
  }

  static userNotFound(userId: string): NotFoundError {
    return NotFoundError.forUser(userId);
  }

  static projectNotFound(projectId: string): NotFoundError {
    return NotFoundError.forProject(projectId);
  }

  static sessionNotFound(sessionId: string): NotFoundError {
    return NotFoundError.forSession(sessionId);
  }

  static toolNotFound(toolName: string): NotFoundError {
    return NotFoundError.forTool(toolName);
  }

  // Permission errors
  static insufficientPermissions(action: string, resource?: string): PermissionError {
    return new PermissionError(action, resource);
  }

  static authenticationRequired(action: string): PermissionError {
    return PermissionError.forAuthentication(action);
  }

  static invalidApiKey(action: string): PermissionError {
    return PermissionError.forApiKey(action);
  }

  static projectAccessDenied(projectId: string, action: string): PermissionError {
    return PermissionError.forProject(projectId, action);
  }

  static toolExecutionDenied(toolName: string, action: string): PermissionError {
    return PermissionError.forTool(toolName, action);
  }

  // External service errors
  static externalService(service: string, operation: string, originalError?: Error): ExternalServiceError {
    return new ExternalServiceError(service, operation, originalError);
  }

  static serviceTimeout(service: string, operation: string, timeoutMs: number): ExternalServiceError {
    return ExternalServiceError.forTimeout(service, operation, timeoutMs);
  }

  static rateLimited(service: string, retryAfter?: number): ExternalServiceError {
    return ExternalServiceError.forRateLimit(service, retryAfter);
  }

  static connectionFailure(service: string, operation: string): ExternalServiceError {
    return ExternalServiceError.forConnectionFailure(service, operation);
  }

  static context7Error(operation: string, libraryId?: string): ExternalServiceError {
    return ExternalServiceError.forContext7(operation, libraryId);
  }

  static perplexityError(operation: string, query?: string): ExternalServiceError {
    return ExternalServiceError.forPerplexity(operation, query);
  }

  static databaseError(operation: string, table?: string): ExternalServiceError {
    return ExternalServiceError.forDatabase(operation, table);
  }

  // Conflict errors
  static conflict(resource: string, reason: string): ConflictError {
    return new ConflictError(resource, reason);
  }

  static duplicate(resource: string, identifier: string): ConflictError {
    return ConflictError.forDuplicate(resource, identifier);
  }

  static concurrencyConflict(resource: string, identifier: string, version?: string): ConflictError {
    return ConflictError.forConcurrency(resource, identifier, version);
  }

  static invalidState(resource: string, currentState: string, requiredState: string): ConflictError {
    return ConflictError.forState(resource, currentState, requiredState);
  }

  static resourceLocked(resource: string, lockHolder?: string): ConflictError {
    return ConflictError.forLock(resource, lockHolder);
  }

  // Unknown errors
  static unknown(message: string, originalError?: Error): UnknownError {
    return new UnknownError(message, {}, originalError);
  }

  static retryFailed(message: string, originalError?: Error, attempts?: number): RetryFailedError {
    return new RetryFailedError(message, originalError, { attempts });
  }
}

// Type guards for error checking
export class ErrorUtils {
  static isBaseError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  }

  static isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  }

  static isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
  }

  static isPermissionError(error: unknown): error is PermissionError {
    return error instanceof PermissionError;
  }

  static isExternalServiceError(error: unknown): error is ExternalServiceError {
    return error instanceof ExternalServiceError;
  }

  static isConflictError(error: unknown): error is ConflictError {
    return error instanceof ConflictError;
  }

  static isOperationalError(error: unknown): boolean {
    return ErrorUtils.isBaseError(error) && error.isOperational;
  }

  static getErrorCode(error: unknown): string {
    if (ErrorUtils.isBaseError(error)) {
      return error.errorCode;
    }
    return 'UNKNOWN_ERROR';
  }

  static getErrorCategory(error: unknown): string {
    if (ErrorUtils.isBaseError(error)) {
      return error.category;
    }
    return 'unknown';
  }

  static getCorrelationId(error: unknown): string | undefined {
    if (ErrorUtils.isBaseError(error)) {
      return error.correlationId;
    }
    return undefined;
  }

  static shouldRetry(error: unknown): boolean {
    if (!ErrorUtils.isBaseError(error)) {
      return false;
    }

    // Don't retry client errors (4xx)
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }

    // Retry server errors and external service errors
    return error.category === 'external' || error.category === 'internal';
  }

  static formatErrorForLogging(error: unknown): Record<string, unknown> {
    if (ErrorUtils.isBaseError(error)) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return {
      error: String(error)
    };
  }
}