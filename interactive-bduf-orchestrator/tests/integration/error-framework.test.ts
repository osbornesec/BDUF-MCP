import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ErrorManager, createDefaultErrorManagerConfig } from '../../src/shared/error-manager.js';
import { 
  ValidationError, 
  NotFoundError, 
  ExternalServiceError,
  ErrorFactory,
  asyncHandler,
  retryWithBackoff,
  CircuitBreaker
} from '../../src/shared/errors/index.js';

describe('Error Framework Integration', () => {
  let errorManager: ErrorManager;

  beforeEach(() => {
    const config = createDefaultErrorManagerConfig('test-component');
    config.enableNotifications = false; // Disable for testing
    errorManager = new ErrorManager(config);
  });

  afterEach(async () => {
    await errorManager.shutdown();
  });

  describe('End-to-End Error Handling', () => {
    it('should handle validation errors with proper logging and metrics', async () => {
      const error = ErrorFactory.validation('Invalid email format', 'email', 'invalid-email');
      
      await errorManager.handleError(error, {
        requestId: 'req-123',
        userId: 'user-456'
      });

      // Verify metrics were collected
      const metrics = errorManager.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should handle external service errors with retry logic', async () => {
      const error = ErrorFactory.context7Error('library-lookup', '/test/library');
      
      await errorManager.handleError(error);

      // Verify error was processed
      expect(error.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should integrate with async error wrapper', async () => {
      const failingAsyncFn = async (input: string): Promise<string> => {
        if (input === 'fail') {
          throw new Error('Async operation failed');
        }
        return `processed: ${input}`;
      };

      const wrappedFn = errorManager.wrapAsync(failingAsyncFn);

      // Should succeed normally
      const result = await wrappedFn('success');
      expect(result).toBe('processed: success');

      // Should handle errors
      await expect(wrappedFn('fail')).rejects.toThrow();
    });
  });

  describe('Express Middleware Integration', () => {
    it('should create Express error middleware', () => {
      const middleware = errorManager.getExpressMiddleware();
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(4); // Express error middleware signature
    });

    it('should handle errors in middleware format', () => {
      const middleware = errorManager.getExpressMiddleware();
      const error = new ValidationError('Test validation error');
      
      const mockReq = {
        id: 'req-123',
        method: 'POST',
        url: '/api/test',
        get: jest.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1',
        user: { id: 'user-456' }
      };
      
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const mockNext = jest.fn();

      middleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Test validation error'
          })
        })
      );
    });
  });

  describe('Async Utilities Integration', () => {
    it('should work with retry mechanism', async () => {
      let attempts = 0;
      const unreliableOperation = async (): Promise<string> => {
        attempts++;
        if (attempts < 3) {
          throw new ExternalServiceError('TestService', 'unreliable-op');
        }
        return 'success';
      };

      const result = await retryWithBackoff(unreliableOperation, {
        maxRetries: 3,
        baseDelay: 10, // Faster for testing
        jitter: false
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should work with circuit breaker', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 100,
        monitorInterval: 50
      });

      const failingOperation = async (): Promise<string> => {
        throw new ExternalServiceError('TestService', 'always-fails');
      };

      // First failure
      await expect(circuitBreaker.execute(failingOperation))
        .rejects.toThrow('External service error');
      expect(circuitBreaker.getState()).toBe('closed');

      // Second failure - should open circuit
      await expect(circuitBreaker.execute(failingOperation))
        .rejects.toThrow('External service error');
      expect(circuitBreaker.getState()).toBe('open');

      // Third attempt should be rejected immediately
      await expect(circuitBreaker.execute(failingOperation))
        .rejects.toThrow('Circuit breaker is open');
    });

    it('should work with async handler wrapper', async () => {
      const wrappedAsyncFn = asyncHandler(async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Operation failed');
        }
        return 'success';
      });

      const result = await wrappedAsyncFn(false);
      expect(result).toBe('success');

      await expect(wrappedAsyncFn(true)).rejects.toThrow();
    });
  });

  describe('Error Factory Integration', () => {
    it('should create proper error instances with factory methods', () => {
      const validationError = ErrorFactory.missingField('email');
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError.field).toBe('email');

      const notFoundError = ErrorFactory.userNotFound('user-123');
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError.metadata.userId).toBe('user-123');

      const serviceError = ErrorFactory.context7Error('library-lookup');
      expect(serviceError).toBeInstanceOf(ExternalServiceError);
      expect(serviceError.metadata.service).toBe('context7');
    });
  });

  describe('Error Correlation and Tracing', () => {
    it('should maintain correlation IDs across error handling', async () => {
      const error = new ValidationError('Test error');
      const originalCorrelationId = error.correlationId;

      await errorManager.handleError(error, {
        requestId: 'req-123'
      });

      // Correlation ID should be preserved
      expect(error.correlationId).toBe(originalCorrelationId);
    });

    it('should add context to errors during handling', async () => {
      const error = new ExternalServiceError('TestService', 'test-op');
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        operation: 'test-context'
      };

      await errorManager.handleError(error, context);

      // Context should be added to error metadata
      expect(error.metadata.context).toEqual(expect.objectContaining(context));
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large volumes of errors efficiently', async () => {
      const startTime = Date.now();
      const errors: Promise<void>[] = [];

      // Generate 100 errors concurrently
      for (let i = 0; i < 100; i++) {
        const error = new ValidationError(`Error ${i}`);
        errors.push(errorManager.handleError(error, { index: i }));
      }

      await Promise.all(errors);
      const endTime = Date.now();

      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not leak memory with repeated error handling', async () => {
      // This is a basic test - in practice you'd use more sophisticated memory monitoring
      const initialMemory = process.memoryUsage().heapUsed;

      // Handle many errors
      for (let i = 0; i < 1000; i++) {
        const error = new ValidationError(`Error ${i}`);
        await errorManager.handleError(error);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 1000 errors)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});