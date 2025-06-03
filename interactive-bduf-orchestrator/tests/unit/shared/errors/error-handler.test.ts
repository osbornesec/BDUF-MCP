import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ErrorHandler, ErrorHandlerConfig, MetricsCollector, ErrorNotificationService } from '../../../../src/shared/errors/error-handler.js';
import { Logger } from '../../../../src/shared/logger.js';
import { ValidationError, ExternalServiceError, UnknownError } from '../../../../src/shared/errors/index.js';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn()
} as jest.Mocked<Logger>;

const mockMetrics: jest.Mocked<MetricsCollector> = {
  increment: jest.fn(),
  histogram: jest.fn(),
  gauge: jest.fn()
};

const mockNotificationService: jest.Mocked<ErrorNotificationService> = {
  notifyError: jest.fn()
};

const defaultConfig: ErrorHandlerConfig = {
  enableAutoRecovery: true,
  includeStackTrace: false,
  notificationThreshold: 'high',
  maxRetries: 3,
  retryDelayMs: 1000
};

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    errorHandler = new ErrorHandler({
      logger: mockLogger,
      metrics: mockMetrics,
      config: defaultConfig
    });
    
    errorHandler.setNotificationService(mockNotificationService);
  });

  describe('handleError', () => {
    it('should handle BaseError correctly', async () => {
      const error = new ValidationError('Test validation error');
      const context = { requestId: 'req-123', userId: 'user-456' };

      await errorHandler.handleError(error, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Warning: Test validation error',
        expect.objectContaining({
          correlationId: error.correlationId
        })
      );

      expect(mockMetrics.increment).toHaveBeenCalledWith('errors.total', 1, {
        errorCode: 'VALIDATION_ERROR',
        category: 'client',
        severity: 'medium'
      });
    });

    it('should convert unknown errors to UnknownError', async () => {
      const error = new Error('Unknown error');
      
      await errorHandler.handleError(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        expect.any(UnknownError),
        expect.objectContaining({
          correlationId: expect.stringMatching(/^err_\d+_[a-z0-9]+$/)
        })
      );
    });

    it('should collect error metrics', async () => {
      const error = new ExternalServiceError('TestService', 'operation');
      
      await errorHandler.handleError(error);

      expect(mockMetrics.increment).toHaveBeenCalledWith('errors.total', 1, {
        errorCode: 'EXTERNAL_SERVICE_ERROR',
        category: 'external',
        severity: 'high'
      });

      expect(mockMetrics.histogram).toHaveBeenCalledWith(
        'errors.processing_time',
        expect.any(Number)
      );

      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'errors.by_type.ExternalServiceError',
        1
      );
    });

    it('should notify for high severity errors', async () => {
      const error = new ExternalServiceError('TestService', 'operation');
      const context = { requestId: 'req-123' };
      
      await errorHandler.handleError(error, context);

      expect(mockNotificationService.notifyError).toHaveBeenCalledWith(error, context);
    });

    it('should not notify for low severity errors', async () => {
      const error = new ValidationError('Test error');
      
      await errorHandler.handleError(error);

      expect(mockNotificationService.notifyError).not.toHaveBeenCalled();
    });

    it('should attempt recovery for operational errors', async () => {
      const config = { ...defaultConfig, enableAutoRecovery: true };
      const handler = new ErrorHandler({
        logger: mockLogger,
        metrics: mockMetrics,
        config
      });

      const error = new ExternalServiceError('TestService', 'operation');
      
      await handler.handleError(error);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Attempting external service recovery',
        expect.objectContaining({
          correlationId: error.correlationId
        })
      );
    });
  });

  describe('createErrorMiddleware', () => {
    it('should create Express error middleware', () => {
      const middleware = errorHandler.createErrorMiddleware();
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(4); // Express error middleware signature
    });

    it('should handle BaseError in middleware', () => {
      const middleware = errorHandler.createErrorMiddleware();
      const error = new ValidationError('Test error');
      
      const mockReq = {
        id: 'req-123',
        method: 'POST',
        url: '/test',
        get: jest.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1'
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
            message: 'Test error'
          })
        })
      );
    });

    it('should handle unknown errors in middleware', () => {
      const middleware = errorHandler.createErrorMiddleware();
      const error = new Error('Unknown error');
      
      const mockReq = { id: 'req-123', method: 'GET', url: '/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          })
        })
      );
    });
  });

  describe('createAsyncErrorWrapper', () => {
    it('should wrap async function and handle errors', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = errorHandler.createAsyncErrorWrapper(asyncFn);

      await expect(wrappedFn('arg1', 'arg2')).rejects.toThrow('Async error');
      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should pass through successful results', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = errorHandler.createAsyncErrorWrapper(asyncFn);

      const result = await wrappedFn('arg1');
      
      expect(result).toBe('success');
      expect(asyncFn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('getErrorSummary', () => {
    it('should return error summary', async () => {
      const summary = await errorHandler.getErrorSummary(24);
      
      expect(summary).toEqual({
        totalErrors: 0,
        errorsByCategory: {},
        errorsBySeverity: {},
        topErrors: [],
        timeRange: '24h'
      });
    });
  });

  describe('notification thresholds', () => {
    it('should respect notification threshold configuration', async () => {
      const config = { ...defaultConfig, notificationThreshold: 'critical' as const };
      const handler = new ErrorHandler({
        logger: mockLogger,
        metrics: mockMetrics,
        config
      });
      handler.setNotificationService(mockNotificationService);

      // High severity error should not trigger notification with critical threshold
      const highError = new ExternalServiceError('TestService', 'operation');
      await handler.handleError(highError);
      
      expect(mockNotificationService.notifyError).not.toHaveBeenCalled();

      // Critical error should trigger notification
      const criticalError = new UnknownError('Critical system failure');
      await handler.handleError(criticalError);
      
      expect(mockNotificationService.notifyError).toHaveBeenCalledWith(
        criticalError,
        undefined
      );
    });
  });

  describe('error recovery', () => {
    it('should skip recovery when disabled', async () => {
      const config = { ...defaultConfig, enableAutoRecovery: false };
      const handler = new ErrorHandler({
        logger: mockLogger,
        metrics: mockMetrics,
        config
      });

      const error = new ExternalServiceError('TestService', 'operation');
      await handler.handleError(error);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('recovery')
      );
    });

    it('should skip recovery for non-operational errors', async () => {
      // Create a non-operational error by extending BaseError
      class NonOperationalError extends ExternalServiceError {
        readonly isOperational = false;
      }

      const error = new NonOperationalError('TestService', 'operation');
      await handler.handleError(error);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('recovery')
      );
    });
  });
});