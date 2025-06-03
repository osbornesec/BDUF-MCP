import { describe, it, expect, beforeEach } from '@jest/globals';
import { BaseError, UnknownError, RetryFailedError, ErrorSeverityLevel } from '../../../../src/shared/errors/base-error.js';

// Test implementation of BaseError
class TestError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'TEST_ERROR';
  readonly category = 'test';
  readonly severity: ErrorSeverityLevel = {
    level: 'medium',
    impact: 'user',
    recovery: 'manual'
  };
}

describe('BaseError', () => {
  describe('constructor', () => {
    it('should create a basic error with message', () => {
      const error = new TestError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TestError');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should include metadata in error', () => {
      const metadata = {
        userId: 'user-123',
        operation: 'test-op'
      };
      const error = new TestError('Test message', metadata);
      
      expect(error.metadata).toEqual(expect.objectContaining(metadata));
    });

    it('should include cause error', () => {
      const cause = new Error('Original error');
      const error = new TestError('Test message', {}, cause);
      
      expect(error.cause).toBe(cause);
      expect(error.stack).toContain('Caused by:');
    });

    it('should use provided correlation ID', () => {
      const correlationId = 'custom-correlation-id';
      const error = new TestError('Test message', { correlationId });
      
      expect(error.correlationId).toBe(correlationId);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new TestError('Test message', {
        userId: 'user-123',
        operation: 'test-op'
      });
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        name: 'TestError',
        message: 'Test message',
        errorCode: 'TEST_ERROR',
        statusCode: 400,
        severity: {
          level: 'medium',
          impact: 'user',
          recovery: 'manual'
        },
        category: 'test',
        timestamp: error.timestamp.toISOString(),
        correlationId: error.correlationId,
        metadata: expect.objectContaining({
          userId: 'user-123',
          operation: 'test-op'
        }),
        isOperational: true
      });
    });

    it('should sanitize sensitive metadata', () => {
      const error = new TestError('Test message', {
        password: 'secret123',
        apiKey: 'api-secret',
        token: 'auth-token',
        normalField: 'normal-value'
      });
      
      const json = error.toJSON();
      
      expect(json.metadata).toEqual({
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
        token: '[REDACTED]',
        normalField: 'normal-value'
      });
    });
  });

  describe('getSanitizedResponse', () => {
    it('should return sanitized response without stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new TestError('Test message');
      const response = error.getSanitizedResponse();
      
      expect(response).toEqual({
        error: {
          code: 'TEST_ERROR',
          message: 'Test message',
          timestamp: error.timestamp.toISOString(),
          correlationId: error.correlationId,
          category: 'test'
        }
      });
      expect(response.error.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development when requested', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new TestError('Test message');
      const response = error.getSanitizedResponse(true);
      
      expect(response.error.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('prototype chain', () => {
    it('should maintain proper instanceof checks', () => {
      const error = new TestError('Test message');
      
      expect(error instanceof TestError).toBe(true);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe('UnknownError', () => {
  it('should create unknown error with default properties', () => {
    const error = new UnknownError('Something went wrong');
    
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe('UNKNOWN_ERROR');
    expect(error.category).toBe('internal');
    expect(error.severity).toEqual({
      level: 'high',
      impact: 'system',
      recovery: 'manual'
    });
  });

  it('should include original error as cause', () => {
    const originalError = new Error('Original error');
    const error = new UnknownError('Wrapped error', {}, originalError);
    
    expect(error.cause).toBe(originalError);
  });
});

describe('RetryFailedError', () => {
  it('should create retry failed error with default properties', () => {
    const error = new RetryFailedError('Retry failed');
    
    expect(error.statusCode).toBe(503);
    expect(error.errorCode).toBe('RETRY_FAILED');
    expect(error.category).toBe('external');
    expect(error.severity).toEqual({
      level: 'medium',
      impact: 'system',
      recovery: 'automatic'
    });
  });

  it('should include cause error and metadata', () => {
    const cause = new Error('Network timeout');
    const metadata = { attempts: 3, operation: 'api_call' };
    const error = new RetryFailedError('Retry failed after 3 attempts', cause, metadata);
    
    expect(error.cause).toBe(cause);
    expect(error.metadata).toEqual(expect.objectContaining(metadata));
  });
});