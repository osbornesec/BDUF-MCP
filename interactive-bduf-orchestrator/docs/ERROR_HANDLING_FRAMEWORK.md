# Error Handling Framework Documentation

## Overview

The Error Handling Framework provides comprehensive error management capabilities for the Interactive BDUF Orchestrator MCP Server. It includes hierarchical error types, correlation tracking, metrics collection, automatic recovery mechanisms, and integration with logging and monitoring systems.

## Architecture

### Core Components

1. **Base Error Classes**: Hierarchical error system with specialized types
2. **Error Handler**: Central error processing with logging and metrics
3. **Async Utilities**: Error-safe async operations and retry mechanisms
4. **Error Manager**: High-level service for application-wide error management
5. **Metrics Collection**: Performance and error tracking
6. **Integration Layer**: Express middleware and framework integration

### Error Hierarchy

```
BaseError (abstract)
├── ValidationError (client errors - 4xx)
├── NotFoundError (resource not found - 404)
├── PermissionError (security errors - 403)
├── ConflictError (state conflicts - 409)
├── ExternalServiceError (external service failures - 502)
├── UnknownError (unexpected errors - 500)
└── RetryFailedError (retry exhaustion - 503)
```

## Quick Start

### 1. Initialize Error Manager

```typescript
import { initializeErrorManager, createDefaultErrorManagerConfig } from './shared/error-manager.js';

const config = createDefaultErrorManagerConfig('my-service');
config.enableNotifications = true;
config.notificationThreshold = 'high';

const errorManager = initializeErrorManager(config);
```

### 2. Use Error Factory for Common Errors

```typescript
import { ErrorFactory } from './shared/errors/index.js';

// Validation errors
throw ErrorFactory.missingField('email');
throw ErrorFactory.invalidType('age', 'number', 'string');
throw ErrorFactory.outOfRange('score', 150, 0, 100);

// Not found errors
throw ErrorFactory.userNotFound('user-123');
throw ErrorFactory.projectNotFound('project-456');

// Permission errors
throw ErrorFactory.authenticationRequired('access_project');
throw ErrorFactory.projectAccessDenied('project-123', 'read');

// External service errors
throw ErrorFactory.context7Error('library-lookup', '/test/library');
throw ErrorFactory.databaseError('connection', 'users');
```

### 3. Express.js Integration

```typescript
import express from 'express';
import { getErrorManager } from './shared/error-manager.js';

const app = express();
const errorManager = getErrorManager();

// Add error middleware
app.use(errorManager.getExpressMiddleware());

// Wrap async routes
app.get('/users/:id', errorManager.wrapAsync(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
}));
```

### 4. Async Error Handling

```typescript
import { asyncHandler, retryWithBackoff, withErrorBoundary } from './shared/errors/index.js';

// Wrap async functions
const safeAsyncFn = asyncHandler(async (input) => {
  // Your async logic here
  return processInput(input);
});

// Retry with backoff
const result = await retryWithBackoff(
  () => callExternalAPI(),
  {
    maxRetries: 3,
    baseDelay: 1000,
    factor: 2
  }
);

// Error boundaries
const safeResult = await withErrorBoundary(
  () => riskyOperation(),
  'default-value', // fallback
  (error) => console.log('Operation failed safely:', error)
);
```

## Error Types Reference

### ValidationError

Used for client input validation failures.

```typescript
import { ValidationError } from './shared/errors/validation-error.js';

// Basic validation error
throw new ValidationError('Invalid email format', 'email', 'invalid-email');

// Using factory methods
throw ValidationError.forField('age', 15, 'minimum age is 18');
throw ValidationError.forMissingField('email');
throw ValidationError.forInvalidType('count', 'number', 'string');
throw ValidationError.forSchema({
  email: ['required', 'format:email'],
  age: ['minimum:18']
});
```

**Properties:**
- `statusCode`: 400
- `category`: 'client'
- `severity`: { level: 'medium', impact: 'user', recovery: 'manual' }

### NotFoundError

Used when requested resources cannot be found.

```typescript
import { NotFoundError } from './shared/errors/not-found-error.js';

// Basic not found error
throw new NotFoundError('User', 'user-123');

// Using factory methods
throw NotFoundError.forEntity('Project', 'proj-456');
throw NotFoundError.forUser('user-789');
throw NotFoundError.forPath('/api/nonexistent');
```

**Properties:**
- `statusCode`: 404
- `category`: 'client'
- `severity`: { level: 'low', impact: 'user', recovery: 'manual' }

### PermissionError

Used for authorization and authentication failures.

```typescript
import { PermissionError } from './shared/errors/permission-error.js';

// Basic permission error
throw new PermissionError('delete', 'project', ['admin']);

// Using factory methods
throw PermissionError.forAuthentication('access_system');
throw PermissionError.forProject('proj-123', 'write');
throw PermissionError.forTool('analyze-requirements', 'execute');
```

**Properties:**
- `statusCode`: 403
- `category`: 'security'
- `severity`: { level: 'high', impact: 'security', recovery: 'manual' }

### ExternalServiceError

Used for external service integration failures.

```typescript
import { ExternalServiceError } from './shared/errors/external-service-error.js';

// Basic external service error
throw new ExternalServiceError('Context7', 'library-lookup', originalError);

// Using factory methods
throw ExternalServiceError.forTimeout('PaymentService', 'process-payment', 5000);
throw ExternalServiceError.forRateLimit('OpenAI', 60);
throw ExternalServiceError.forConnectionFailure('Database', 'query');
```

**Properties:**
- `statusCode`: 502
- `category`: 'external'
- `severity`: { level: 'high', impact: 'system', recovery: 'automatic' }

### ConflictError

Used for resource state conflicts and concurrent modification issues.

```typescript
import { ConflictError } from './shared/errors/conflict-error.js';

// Basic conflict error
throw new ConflictError('User', 'Email already exists');

// Using factory methods
throw ConflictError.forDuplicate('User', 'email@example.com');
throw ConflictError.forConcurrency('Document', 'doc-123', 'v2');
throw ConflictError.forState('Project', 'archived', 'active');
```

**Properties:**
- `statusCode`: 409
- `category`: 'client'
- `severity`: { level: 'medium', impact: 'user', recovery: 'manual' }

## Advanced Features

### Circuit Breaker Pattern

Prevents cascading failures in external service calls:

```typescript
import { CircuitBreaker } from './shared/errors/async-utils.js';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,     // Open after 5 failures
  recoveryTimeout: 30000,  // Try again after 30 seconds
  monitorInterval: 5000    // Check every 5 seconds
});

const result = await circuitBreaker.execute(async () => {
  return await callExternalService();
});
```

### Promise Pool for Concurrency Control

Limit concurrent operations to prevent resource exhaustion:

```typescript
import { PromisePool } from './shared/errors/async-utils.js';

const pool = new PromisePool(3); // Max 3 concurrent operations

const results = await Promise.all([
  pool.add(() => operation1()),
  pool.add(() => operation2()),
  pool.add(() => operation3()),
  pool.add(() => operation4()) // Will wait for one of the above to complete
]);
```

### Batch Processing with Error Handling

Process collections with configurable error handling:

```typescript
import { batchProcess } from './shared/errors/async-utils.js';

const results = await batchProcess(
  items,
  async (item, index) => processItem(item),
  {
    batchSize: 10,
    concurrency: 3,
    stopOnError: false,
    onItemError: (error, item, index) => {
      console.log(`Item ${index} failed:`, error.message);
    }
  }
);
```

### Error Correlation and Tracing

Every error includes correlation IDs for distributed tracing:

```typescript
// Errors automatically include correlation IDs
const error = new ValidationError('Invalid input');
console.log(error.correlationId); // "err_1645123456789_abc123def"

// Custom correlation ID
const error2 = new ValidationError('Invalid input', 'field', 'value', [], {
  correlationId: 'custom-trace-id'
});
```

### Custom Error Types

Extend base errors for domain-specific requirements:

```typescript
import { NotFoundError } from './shared/errors/not-found-error.js';

class ProjectNotFoundError extends NotFoundError {
  constructor(projectId: string, organizationId?: string) {
    super('Project', projectId, {
      projectId,
      organizationId,
      operation: 'project_lookup',
      suggestions: [
        'Verify project ID',
        'Check organization access',
        'Contact project owner'
      ]
    });
  }
}
```

## Configuration

### Error Manager Configuration

```typescript
interface ErrorManagerConfig {
  component: string;                    // Service component name
  enableAutoRecovery: boolean;          // Enable automatic error recovery
  includeStackTrace: boolean;           // Include stack traces in responses
  notificationThreshold: 'medium' | 'high' | 'critical'; // When to notify
  maxRetries: number;                   // Default retry attempts
  retryDelayMs: number;                 // Base retry delay
  enableNotifications: boolean;         // Enable error notifications
  notificationEndpoints?: string[];     // Notification destinations
}
```

### Default Configuration

```typescript
const defaultConfig = {
  component: 'unknown',
  enableAutoRecovery: true,
  includeStackTrace: process.env.NODE_ENV !== 'production',
  notificationThreshold: process.env.NODE_ENV === 'production' ? 'high' : 'critical',
  maxRetries: 3,
  retryDelayMs: 1000,
  enableNotifications: process.env.NODE_ENV === 'production',
  notificationEndpoints: []
};
```

## Metrics and Monitoring

### Automatic Metrics Collection

The framework automatically collects metrics for:

- Total error count by type, category, and severity
- Error processing time
- Recovery attempt success/failure rates
- Circuit breaker state changes

### Health Monitoring

```typescript
import { getErrorManager } from './shared/error-manager.js';

const errorManager = getErrorManager();

// Get error summary for monitoring
const summary = await errorManager.getErrorSummary(24); // Last 24 hours
console.log({
  totalErrors: summary.totalErrors,
  errorsByCategory: summary.errorsByCategory,
  errorsBySeverity: summary.errorsBySeverity,
  topErrors: summary.topErrors
});
```

### Custom Metrics

```typescript
const metrics = errorManager.getMetrics();

// Custom counters
metrics.increment('custom.operation.count', 1, { operation: 'user_registration' });

// Custom timings
const startTime = Date.now();
// ... do work ...
metrics.timing('custom.operation.duration', Date.now() - startTime);

// Custom gauges
metrics.gauge('custom.active_connections', activeConnectionCount);
```

## Best Practices

### 1. Use Appropriate Error Types

Choose the most specific error type for your use case:

```typescript
// ❌ Too generic
throw new Error('User not found');

// ✅ Specific and actionable
throw ErrorFactory.userNotFound('user-123');
```

### 2. Include Relevant Context

Provide context that helps with debugging and monitoring:

```typescript
// ❌ Missing context
throw new ValidationError('Invalid input');

// ✅ Rich context
throw new ValidationError('Invalid email format', 'email', userInput.email, ['format:email'], {
  userId: request.userId,
  requestId: request.id,
  operation: 'user_registration'
});
```

### 3. Handle Errors at Appropriate Levels

- **Service Layer**: Convert external errors to domain errors
- **Controller Layer**: Handle errors and format responses
- **Application Layer**: Log errors and collect metrics

```typescript
// Service layer
class UserService {
  async createUser(userData: any) {
    try {
      return await this.database.insert('users', userData);
    } catch (dbError) {
      // Convert database error to domain error
      throw ErrorFactory.databaseError('user_creation', 'users');
    }
  }
}

// Controller layer
class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const user = await this.userService.createUser(req.body);
      res.json({ success: true, user });
    } catch (error) {
      // Error middleware will handle logging and response formatting
      throw error;
    }
  }
}
```

### 4. Use Async Utilities for Resilience

```typescript
// ❌ No error handling
const result = await externalAPI.call();

// ✅ Resilient with retry and circuit breaker
const result = await retryWithBackoff(
  () => circuitBreaker.execute(() => externalAPI.call()),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### 5. Implement Graceful Degradation

```typescript
const userPreferences = await withErrorBoundary(
  () => fetchUserPreferences(userId),
  { theme: 'default', language: 'en' }, // Fallback
  (error) => logger.warn('Failed to load user preferences, using defaults', { error })
);
```

## Testing

### Unit Testing Errors

```typescript
import { ValidationError, ErrorUtils } from './shared/errors/index.js';

describe('User validation', () => {
  it('should throw validation error for invalid email', () => {
    expect(() => validateEmail('invalid-email'))
      .toThrow(ValidationError);
  });
  
  it('should include proper error metadata', () => {
    try {
      validateEmail('invalid-email');
    } catch (error) {
      expect(ErrorUtils.isValidationError(error)).toBe(true);
      expect(error.field).toBe('email');
      expect(error.statusCode).toBe(400);
    }
  });
});
```

### Integration Testing

```typescript
import { ErrorManager, createDefaultErrorManagerConfig } from './shared/error-manager.js';

describe('Error handling integration', () => {
  let errorManager: ErrorManager;
  
  beforeEach(() => {
    const config = createDefaultErrorManagerConfig('test');
    config.enableNotifications = false;
    errorManager = new ErrorManager(config);
  });
  
  it('should handle errors with proper logging and metrics', async () => {
    const error = new ValidationError('Test error');
    
    await errorManager.handleError(error, { requestId: 'test-123' });
    
    // Verify metrics were collected
    const metrics = errorManager.getMetrics();
    expect(metrics.getMetricCount('errors.total')).toBeGreaterThan(0);
  });
});
```

## Migration Guide

### From Basic Error Handling

If you're currently using basic `Error` objects:

```typescript
// Old approach
if (!user) {
  throw new Error('User not found');
}

// New approach
if (!user) {
  throw ErrorFactory.userNotFound(userId);
}
```

### From Custom Error Classes

If you have existing custom error classes:

```typescript
// Old custom error
class CustomUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomUserError';
  }
}

// Migrate to framework
class CustomUserError extends NotFoundError {
  constructor(userId: string) {
    super('User', userId, {
      operation: 'user_lookup',
      service: 'user-service'
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Correlation IDs not propagating**
   - Ensure error context is passed through all layers
   - Use error manager's async wrappers

2. **Metrics not collecting**
   - Verify error manager is properly initialized
   - Check metrics collector configuration

3. **Stack traces in production**
   - Set `includeStackTrace: false` in production config
   - Verify `NODE_ENV=production`

4. **Notifications not sending**
   - Check notification service configuration
   - Verify notification threshold settings

### Debug Mode

Enable detailed error logging:

```typescript
const config = createDefaultErrorManagerConfig('my-service');
config.includeStackTrace = true;
// Set LOG_LEVEL=debug in environment variables
```

## Performance Considerations

- Error objects are lightweight with minimal overhead
- Metrics collection is asynchronous and non-blocking
- Stack trace generation can be disabled in production
- Error sanitization prevents sensitive data leakage
- Circuit breakers prevent resource exhaustion

## Security

- Sensitive data is automatically redacted from error logs
- Stack traces are hidden in production by default
- Correlation IDs don't contain sensitive information
- Error responses are sanitized for client consumption

## Changelog

### Version 1.0.0
- Initial implementation with comprehensive error hierarchy
- Error handler with logging and metrics integration
- Async utilities for resilient operations
- Express.js middleware integration
- Circuit breaker and retry mechanisms
- Comprehensive test coverage

For more examples and advanced usage patterns, see the `examples/error-handling-usage.ts` file.