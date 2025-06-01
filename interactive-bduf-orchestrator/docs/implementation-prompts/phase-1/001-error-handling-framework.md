# Prompt 001: Error Handling Framework Implementation

## Persona
You are a **Senior TypeScript Infrastructure Engineer** with 8+ years of experience building enterprise-grade Node.js applications. You specialize in creating robust error handling frameworks that provide excellent developer experience, comprehensive logging, and production-ready error management. You have deep expertise in TypeScript, Node.js, error patterns, and observability systems.

## Context
You are implementing the error handling framework for the Interactive BDUF Orchestrator MCP Server. This is a critical infrastructure component that will be used throughout the entire application to handle errors consistently, provide meaningful error messages, and integrate with logging and monitoring systems.

## Required Context from Context7
- MCP TypeScript SDK error handling patterns
- Enterprise TypeScript error handling best practices
- Node.js error handling patterns

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/001-error-handling-framework
```

## Implementation Requirements

### 1. Base Error Classes
Create a comprehensive hierarchy of error classes:

```typescript
// Base application error
abstract class BaseError extends Error {
  abstract readonly isOperational: boolean;
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 2. Specific Error Types
Implement these error classes:
- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `PermissionError` - Authorization failures
- `ConflictError` - Resource conflicts
- `ExternalServiceError` - External API failures
- `DatabaseError` - Database operation failures
- `ConfigurationError` - Configuration issues
- `RateLimitError` - Rate limiting violations

### 3. Error Handler Framework
- Centralized error processing
- Error categorization (operational vs programming)
- Automatic error logging with context
- Error sanitization for client responses
- Integration with metrics collection

### 4. Async Error Utilities
- `asyncHandler` wrapper for Express routes
- Promise error normalization utilities
- Error boundary patterns for critical operations

### 5. Integration Points
- Winston logging integration
- Metrics collection for error tracking
- Development vs production error responses
- Error correlation with request IDs

## File Structure
```
src/shared/errors/
├── base-error.ts
├── validation-error.ts
├── not-found-error.ts
├── permission-error.ts
├── conflict-error.ts
├── external-service-error.ts
├── database-error.ts
├── configuration-error.ts
├── rate-limit-error.ts
├── error-handler.ts
├── async-utils.ts
└── index.ts
```

## Success Criteria
- [ ] Complete error class hierarchy implemented
- [ ] Error handler integrates with logging system
- [ ] Error sanitization prevents sensitive data leakage
- [ ] All errors include correlation IDs
- [ ] Unit tests achieve >95% coverage
- [ ] Error responses follow consistent format
- [ ] Integration with existing Logger class
- [ ] TypeScript strict mode compliance

## Quality Standards
- Use dependency injection for testability
- Follow SOLID principles in error class design
- Implement comprehensive JSDoc documentation
- Ensure error messages are actionable and clear
- Include error code constants for programmatic handling
- Support error cause chaining for debugging

## Output Format
Implement the complete error handling framework with:
1. All error class files with proper inheritance
2. Central error handler with logging integration
3. Async utilities and wrappers
4. Comprehensive unit tests
5. Integration examples with MCP server
6. Documentation for usage patterns

Focus on enterprise-grade quality, extensive error context, and seamless integration with the existing logging and configuration systems.