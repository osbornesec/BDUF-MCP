# Implementation Prompt 001: Error Handling Framework (1.1.2)

## Persona
You are a **Senior TypeScript Infrastructure Engineer and Error Management Specialist** with 12+ years of experience building enterprise-grade error handling systems for mission-critical applications. You specialize in creating comprehensive error frameworks that provide exceptional developer experience, robust error categorization, and production-ready error management with integrated observability. You have deep expertise in TypeScript advanced error patterns, Node.js error handling, enterprise logging systems, and resilient system design.

## Context: Interactive BDUF Orchestrator
You are implementing the **Error Handling Framework** as the foundational component of the Interactive Big Design Up Front (BDUF) Orchestrator. This system will provide the critical error management infrastructure that ensures reliable operation, comprehensive error tracking, and excellent debugging capabilities across all MCP operations.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Error Handling Framework you're building will:

1. **Provide consistent error classification** across all system components
2. **Enable comprehensive error tracking** with correlation and context
3. **Support graceful error recovery** with fallback mechanisms
4. **Integrate with monitoring systems** for real-time error visibility
5. **Ensure secure error responses** that don't leak sensitive information
6. **Enable debugging efficiency** with rich error context and stack traces

### Technical Context
- **Dependencies**: Base infrastructure component with no external dependencies
- **Architecture**: Hierarchical error system with specialized error types
- **Integration**: Core foundation for all application components
- **Scalability**: Handle high-volume error processing with minimal overhead
- **Quality**: 95%+ test coverage, comprehensive error scenarios and edge cases

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/error-handling-framework

# Regular commits with descriptive messages
git add .
git commit -m "feat(errors): implement comprehensive error handling framework

- Add hierarchical error class system with specialized types
- Implement error handler with logging and correlation integration
- Create async error utilities and middleware wrappers
- Add error sanitization for secure client responses
- Implement error metrics collection and monitoring
- Add comprehensive error context and stack trace management"

# Push and create PR
git push origin feature/error-handling-framework
```

## Required Context7 Integration

Before implementing any error handling components, you MUST use Context7 to research error patterns:

```typescript
// Research error handling patterns and best practices
await context7.getLibraryDocs('/typescript/error-handling');
await context7.getLibraryDocs('/nodejs/error-patterns');
await context7.getLibraryDocs('/enterprise/error-management');

// Research logging and monitoring integration
await context7.getLibraryDocs('/logging/winston');
await context7.getLibraryDocs('/monitoring/metrics');
await context7.getLibraryDocs('/observability/error-tracking');

// Research security and error sanitization
await context7.getLibraryDocs('/security/error-sanitization');
await context7.getLibraryDocs('/api-design/error-responses');
await context7.getLibraryDocs('/production/error-handling');
```

## Implementation Requirements

### 1. Base Error Class Hierarchy

```typescript
// src/shared/errors/base-error.ts
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
}

export interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical';
  impact: 'user' | 'system' | 'data' | 'security';
  recovery: 'automatic' | 'manual' | 'none';
}

export abstract class BaseError extends Error {
  public readonly timestamp: Date;
  public readonly correlationId: string;
  public readonly isOperational: boolean = true;
  
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly severity: ErrorSeverity;
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
```

### 2. Specialized Error Types

```typescript
// src/shared/errors/validation-error.ts
export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly category = 'client';
  readonly severity: ErrorSeverity = {
    level: 'medium',
    impact: 'user',
    recovery: 'manual'
  };

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    public readonly constraints?: string[],
    metadata: ErrorMetadata = {}
  ) {
    super(message, {
      ...metadata,
      field,
      value: typeof value === 'object' ? '[OBJECT]' : value,
      constraints,
      operation: 'validation'
    });
  }

  static forField(field: string, value: unknown, constraint: string): ValidationError {
    return new ValidationError(
      `Validation failed for field '${field}': ${constraint}`,
      field,
      value,
      [constraint]
    );
  }

  static forSchema(errors: Record<string, string[]>): ValidationError {
    const fieldCount = Object.keys(errors).length;
    const totalErrors = Object.values(errors).flat().length;
    
    return new ValidationError(
      `Schema validation failed: ${totalErrors} errors across ${fieldCount} fields`,
      undefined,
      undefined,
      Object.values(errors).flat(),
      { validationErrors: errors }
    );
  }
}

// src/shared/errors/not-found-error.ts
export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';
  readonly category = 'client';
  readonly severity: ErrorSeverity = {
    level: 'low',
    impact: 'user',
    recovery: 'manual'
  };

  constructor(
    resource: string,
    identifier?: string | number,
    metadata: ErrorMetadata = {}
  ) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, {
      ...metadata,
      resource,
      identifier,
      operation: 'resource_lookup'
    });
  }
}

// src/shared/errors/permission-error.ts
export class PermissionError extends BaseError {
  readonly statusCode = 403;
  readonly errorCode = 'INSUFFICIENT_PERMISSIONS';
  readonly category = 'security';
  readonly severity: ErrorSeverity = {
    level: 'high',
    impact: 'security',
    recovery: 'manual'
  };

  constructor(
    action: string,
    resource?: string,
    requiredPermissions?: string[],
    metadata: ErrorMetadata = {}
  ) {
    const message = resource 
      ? `Insufficient permissions to ${action} ${resource}`
      : `Insufficient permissions to ${action}`;
    
    super(message, {
      ...metadata,
      action,
      resource,
      requiredPermissions,
      operation: 'authorization'
    });
  }
}

// src/shared/errors/external-service-error.ts
export class ExternalServiceError extends BaseError {
  readonly statusCode = 502;
  readonly errorCode = 'EXTERNAL_SERVICE_ERROR';
  readonly category = 'external';
  readonly severity: ErrorSeverity = {
    level: 'high',
    impact: 'system',
    recovery: 'automatic'
  };

  constructor(
    service: string,
    operation: string,
    originalError?: Error,
    metadata: ErrorMetadata = {}
  ) {
    super(
      `External service error: ${service} failed during ${operation}`,
      {
        ...metadata,
        service,
        operation,
        originalError: originalError?.message
      },
      originalError
    );
  }

  static forTimeout(service: string, operation: string, timeoutMs: number): ExternalServiceError {
    return new ExternalServiceError(
      service,
      operation,
      new Error(`Operation timed out after ${timeoutMs}ms`),
      { timeoutMs, reason: 'timeout' }
    );
  }

  static forRateLimit(service: string, retryAfter?: number): ExternalServiceError {
    return new ExternalServiceError(
      service,
      'api_call',
      new Error('Rate limit exceeded'),
      { retryAfter, reason: 'rate_limit' }
    );
  }
}
```

### 3. Error Handler and Processing

```typescript
// src/shared/errors/error-handler.ts
export class ErrorHandler {
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ErrorHandlerConfig;

  constructor(dependencies: ErrorHandlerDependencies) {
    this.logger = dependencies.logger;
    this.metrics = dependencies.metrics;
    this.config = dependencies.config;
  }

  public async handleError(error: Error, context?: ErrorContext): Promise<void> {
    const processedError = this.processError(error, context);
    
    // Log error with appropriate level
    await this.logError(processedError);
    
    // Collect metrics
    this.collectErrorMetrics(processedError);
    
    // Handle recovery if possible
    if (processedError.isOperational && this.config.enableAutoRecovery) {
      await this.attemptRecovery(processedError, context);
    }
    
    // Notify monitoring systems for critical errors
    if (processedError.severity.level === 'critical') {
      await this.notifyMonitoring(processedError);
    }
  }

  private processError(error: Error, context?: ErrorContext): BaseError {
    if (error instanceof BaseError) {
      // Add context to existing error
      if (context) {
        error.metadata.context = { ...error.metadata.context, ...context };
      }
      return error;
    }

    // Convert unknown error to BaseError
    return new UnknownError(
      error.message || 'An unexpected error occurred',
      {
        originalError: error.name,
        stack: error.stack,
        context
      },
      error
    );
  }

  private async logError(error: BaseError): Promise<void> {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      error: error.toJSON(),
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      category: error.category,
      severity: error.severity
    };

    this.logger[logLevel]('Error occurred', logData);
  }

  private collectErrorMetrics(error: BaseError): void {
    this.metrics.increment('errors.total', 1, {
      errorCode: error.errorCode,
      category: error.category,
      severity: error.severity.level
    });

    this.metrics.histogram('errors.processing_time', Date.now() - error.timestamp.getTime());
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity.level) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  public createErrorMiddleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      this.handleError(error, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      if (error instanceof BaseError) {
        const response = error.getSanitizedResponse(this.config.includeStackTrace);
        res.status(error.statusCode).json(response);
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
            correlationId: generateCorrelationId()
          }
        });
      }
    };
  }
}
```

### 4. Async Error Utilities

```typescript
// src/shared/errors/async-utils.ts
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      // Re-throw with additional context
      if (error instanceof BaseError) {
        throw error;
      }
      
      throw new UnknownError(
        'Async operation failed',
        { operation: fn.name, args: args.length },
        error
      );
    });
  }) as T;
}

export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorHandler?: (error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    jitter = true
  } = options;

  return new Promise(async (resolve, reject) => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          reject(new RetryFailedError(
            `Operation failed after ${maxRetries + 1} attempts`,
            lastError,
            { attempts: maxRetries + 1, operation: operation.name }
          ));
          return;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
        
        if (jitter) {
          delay *= (0.5 + Math.random() * 0.5);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  });
}
```

## Success Criteria

### Functional Requirements
1. **Complete Error Hierarchy**: All error types with proper inheritance
2. **Comprehensive Error Context**: Correlation IDs, metadata, and stack traces
3. **Secure Error Responses**: Sanitized client responses without sensitive data
4. **Logging Integration**: Seamless integration with Winston logging system
5. **Metrics Collection**: Error tracking and monitoring capabilities
6. **Recovery Mechanisms**: Automatic recovery for operational errors

### Technical Requirements
1. **High Performance**: Sub-1ms error processing overhead
2. **Type Safety**: 100% TypeScript coverage with strict mode
3. **Memory Efficiency**: Minimal memory footprint for error objects
4. **Thread Safety**: Safe for concurrent error handling
5. **Extensibility**: Easy to add new error types and handlers

### Quality Standards
1. **Testing**: 95%+ code coverage with comprehensive error scenarios
2. **Documentation**: Complete JSDoc for all public APIs
3. **Security**: No sensitive data leakage in error responses
4. **Maintainability**: Clean, SOLID-principle-compliant code
5. **Observability**: Rich error context for debugging and monitoring

Remember that this error handling framework is the foundation for all application reliability and must provide comprehensive error management while maintaining excellent performance and security standards.