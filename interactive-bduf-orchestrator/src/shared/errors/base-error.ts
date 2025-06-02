import { ErrorSeverity } from '../types/common.js';

export interface ErrorMetadata {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  timestamp?: Date;
  operation?: string;
  component?: string;
  context?: Record<string, unknown>;
  stack?: string;
  cause?: Error;
  // Allow any additional metadata
  [key: string]: unknown;
}

export interface ErrorSeverityLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  impact: 'user' | 'system' | 'data' | 'security';
  recovery: 'automatic' | 'manual' | 'none';
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    correlationId: string;
    category: string;
    stack?: string;
  };
}

export abstract class BaseError extends Error {
  public readonly timestamp: Date;
  public readonly correlationId: string;
  public readonly isOperational: boolean = true;
  
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly severity: ErrorSeverityLevel;
  abstract readonly category: string;

  constructor(
    message: string,
    public readonly metadata: ErrorMetadata = {},
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.correlationId = metadata.correlationId || generateCorrelationId();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Preserve original error stack if available
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      metadata: this.sanitizeMetadata(this.metadata),
      isOperational: this.isOperational
    };
  }

  public getSanitizedResponse(includeStack: boolean = false): ErrorResponse {
    const response: ErrorResponse = {
      error: {
        code: this.errorCode,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        correlationId: this.correlationId,
        category: this.category
      }
    };

    if (includeStack && process.env.NODE_ENV !== 'production') {
      response.error.stack = this.stack;
    }

    return response;
  }

  private sanitizeMetadata(metadata: ErrorMetadata): Record<string, unknown> {
    const sanitized = { ...metadata };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

function generateCorrelationId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Unknown Error for unexpected errors
export class UnknownError extends BaseError {
  readonly statusCode = 500;
  readonly errorCode = 'UNKNOWN_ERROR';
  readonly category = 'internal';
  readonly severity: ErrorSeverityLevel = {
    level: 'high',
    impact: 'system',
    recovery: 'manual'
  };

  constructor(
    message: string,
    metadata: ErrorMetadata = {},
    cause?: Error
  ) {
    super(message, {
      ...metadata,
      operation: 'unknown_operation'
    }, cause);
  }
}

// Retry Failed Error for retry mechanisms
export class RetryFailedError extends BaseError {
  readonly statusCode = 503;
  readonly errorCode = 'RETRY_FAILED';
  readonly category = 'external';
  readonly severity: ErrorSeverityLevel = {
    level: 'medium',
    impact: 'system',
    recovery: 'automatic'
  };

  constructor(
    message: string,
    cause?: Error,
    metadata: ErrorMetadata = {}
  ) {
    super(message, {
      ...metadata,
      operation: 'retry_operation'
    }, cause);
  }
}