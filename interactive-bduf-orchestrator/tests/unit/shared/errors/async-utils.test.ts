import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  asyncHandler,
  withErrorBoundary,
  safeAsync,
  retryWithBackoff,
  withTimeout,
  CircuitBreaker,
  batchProcess,
  debounceAsync,
  throttleAsync,
  PromisePool
} from '../../../../src/shared/errors/async-utils.js';
import { UnknownError, RetryFailedError } from '../../../../src/shared/errors/base-error.js';

describe('Async Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('asyncHandler', () => {
    it('should wrap async function and preserve return value', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should re-throw BaseError as-is', async () => {
      const error = new UnknownError('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await expect(wrappedFn()).rejects.toBe(error);
    });

    it('should wrap unknown errors in UnknownError', async () => {
      const error = new Error('Unknown error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      await expect(wrappedFn()).rejects.toBeInstanceOf(UnknownError);
    });
  });

  describe('withErrorBoundary', () => {
    it('should return operation result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withErrorBoundary(operation);

      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const fallback = 'fallback-value';

      const result = await withErrorBoundary(operation, fallback);

      expect(result).toBe(fallback);
    });

    it('should call error handler on error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const errorHandler = jest.fn();

      await withErrorBoundary(operation, 'fallback', errorHandler);

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw error when no fallback provided', async () => {
      const error = new Error('Failed');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withErrorBoundary(operation)).rejects.toBe(error);
    });
  });

  describe('safeAsync', () => {
    it('should return operation result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await safeAsync(operation, 'default');

      expect(result).toBe('success');
    });

    it('should return default value on error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));

      const result = await safeAsync(operation, 'default');

      expect(result).toBe('default');
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(operation, { maxRetries: 3 });
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(operation, { 
        maxRetries: 3,
        baseDelay: 100,
        jitter: false 
      });

      // Advance timers for retries
      setTimeout(() => {
        jest.advanceTimersByTime(100); // First retry
        setTimeout(() => {
          jest.advanceTimersByTime(200); // Second retry
        }, 0);
      }, 0);

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryFailedError after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      const promise = retryWithBackoff(operation, { 
        maxRetries: 2,
        baseDelay: 100,
        jitter: false 
      });

      // Advance timers for all retries
      setTimeout(() => {
        jest.advanceTimersByTime(100);
        setTimeout(() => {
          jest.advanceTimersByTime(200);
        }, 0);
      }, 0);

      await expect(promise).rejects.toBeInstanceOf(RetryFailedError);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect shouldRetry function', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Should not retry'));
      const shouldRetry = jest.fn().mockReturnValue(false);

      const promise = retryWithBackoff(operation, { shouldRetry });

      await expect(promise).rejects.toThrow('Should not retry');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 0);
    });

    it('should call onRetry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      const onRetry = jest.fn();

      const promise = retryWithBackoff(operation, { 
        onRetry,
        baseDelay: 100,
        jitter: false 
      });

      setTimeout(() => {
        jest.advanceTimersByTime(100);
      }, 0);

      await promise;

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 0);
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return result if operation completes within timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const promise = withTimeout(operation, { timeoutMs: 1000 });
      const result = await promise;

      expect(result).toBe('success');
    });

    it('should throw timeout error if operation takes too long', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('too late'), 2000))
      );

      const promise = withTimeout(operation, { timeoutMs: 1000 });

      // Advance timer past timeout
      setTimeout(() => {
        jest.advanceTimersByTime(1001);
      }, 0);

      await expect(promise).rejects.toThrow('Operation timed out after 1000ms');
    });

    it('should abort controller when timeout occurs', async () => {
      const abortController = new AbortController();
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('too late'), 2000))
      );

      const promise = withTimeout(operation, { 
        timeoutMs: 1000, 
        abortController 
      });

      setTimeout(() => {
        jest.advanceTimersByTime(1001);
      }, 0);

      await expect(promise).rejects.toThrow('Operation timed out');
      expect(abortController.signal.aborted).toBe(true);
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow operations when circuit is closed', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 5000,
        monitorInterval: 1000
      });

      const operation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should open circuit after threshold failures', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 5000,
        monitorInterval: 1000
      });

      const operation = jest.fn().mockRejectedValue(new Error('Failed'));

      // First failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
      expect(circuitBreaker.getState()).toBe('closed');

      // Second failure - should open circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
      expect(circuitBreaker.getState()).toBe('open');

      // Next call should be rejected immediately
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset to closed state on success', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeout: 5000,
        monitorInterval: 1000
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue('success');

      // Failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed');
      
      // Success - should reset
      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('batchProcess', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4];
      const processor = jest.fn().mockImplementation((item: number) => 
        Promise.resolve(item * 2)
      );

      const results = await batchProcess(items, processor, { batchSize: 2 });

      expect(results).toEqual([2, 4, 6, 8]);
      expect(processor).toHaveBeenCalledTimes(4);
    });

    it('should handle errors without stopping when stopOnError is false', async () => {
      const items = [1, 2, 3, 4];
      const processor = jest.fn()
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(8);

      const onItemError = jest.fn();
      const results = await batchProcess(items, processor, { 
        stopOnError: false,
        onItemError 
      });

      expect(results).toHaveLength(4);
      expect(results[0]).toBe(2);
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe(6);
      expect(results[3]).toBe(8);
      expect(onItemError).toHaveBeenCalledWith(expect.any(Error), 2, 1);
    });

    it('should stop on error when stopOnError is true', async () => {
      const items = [1, 2, 3, 4];
      const processor = jest.fn()
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('Failed'));

      await expect(batchProcess(items, processor, { stopOnError: true }))
        .rejects.toThrow('Failed');
    });
  });

  describe('PromisePool', () => {
    it('should limit concurrent operations', async () => {
      const pool = new PromisePool(2);
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createOperation = (delay: number) => () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        return new Promise(resolve => {
          setTimeout(() => {
            concurrentCount--;
            resolve(delay);
          }, delay);
        });
      };

      const promises = [
        pool.add(createOperation(50)),
        pool.add(createOperation(50)),
        pool.add(createOperation(50)),
        pool.add(createOperation(50))
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([50, 50, 50, 50]);
      expect(maxConcurrent).toBe(2);
    });

    it('should track active count', async () => {
      const pool = new PromisePool(2);

      expect(pool.activeCount).toBe(0);

      const promise1 = pool.add(() => new Promise(resolve => setTimeout(resolve, 100)));
      expect(pool.activeCount).toBe(1);

      const promise2 = pool.add(() => new Promise(resolve => setTimeout(resolve, 100)));
      expect(pool.activeCount).toBe(2);

      await Promise.all([promise1, promise2]);
      expect(pool.activeCount).toBe(0);
    });

    it('should drain all operations', async () => {
      const pool = new PromisePool(2);

      pool.add(() => new Promise(resolve => setTimeout(resolve, 50)));
      pool.add(() => new Promise(resolve => setTimeout(resolve, 100)));

      expect(pool.activeCount).toBeGreaterThan(0);

      await pool.drain();

      expect(pool.activeCount).toBe(0);
    });
  });
});