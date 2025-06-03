import { BaseError, ErrorMetadata, ErrorSeverityLevel } from './base-error.js';

export class ExternalServiceError extends BaseError {
  readonly statusCode = 502;
  readonly errorCode = 'EXTERNAL_SERVICE_ERROR';
  readonly category = 'external';
  readonly severity: ErrorSeverityLevel = {
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

  static forConnectionFailure(service: string, operation: string): ExternalServiceError {
    return new ExternalServiceError(
      service,
      operation,
      new Error('Connection failed'),
      { reason: 'connection_failure' }
    );
  }

  static forInvalidResponse(service: string, operation: string, responseCode?: number): ExternalServiceError {
    return new ExternalServiceError(
      service,
      operation,
      new Error(`Invalid response received${responseCode ? ` (${responseCode})` : ''}`),
      { responseCode, reason: 'invalid_response' }
    );
  }

  static forAuthentication(service: string): ExternalServiceError {
    return new ExternalServiceError(
      service,
      'authentication',
      new Error('Authentication failed'),
      { reason: 'authentication_failure' }
    );
  }

  static forContext7(operation: string, libraryId?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Context7',
      operation,
      new Error(`Context7 API operation failed`),
      { libraryId, service: 'context7' }
    );
  }

  static forPerplexity(operation: string, query?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Perplexity',
      operation,
      new Error(`Perplexity API operation failed`),
      { query, service: 'perplexity' }
    );
  }

  static forOpenAI(operation: string, model?: string): ExternalServiceError {
    return new ExternalServiceError(
      'OpenAI',
      operation,
      new Error(`OpenAI API operation failed`),
      { model, service: 'openai' }
    );
  }

  static forDatabase(operation: string, table?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Database',
      operation,
      new Error(`Database operation failed`),
      { table, service: 'database' }
    );
  }

  static forRedis(operation: string, key?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Redis',
      operation,
      new Error(`Redis operation failed`),
      { key, service: 'redis' }
    );
  }

  static forWebSocket(operation: string, connectionId?: string): ExternalServiceError {
    return new ExternalServiceError(
      'WebSocket',
      operation,
      new Error(`WebSocket operation failed`),
      { connectionId, service: 'websocket' }
    );
  }
}