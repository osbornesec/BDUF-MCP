import { BaseError, UnknownError, RetryFailedError } from './base-error.js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitorInterval: number;
}

export interface TimeoutOptions {
  timeoutMs: number;
  abortController?: AbortController;
}

// Async handler wrapper that provides consistent error handling
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

// Error boundary for async operations with fallback support
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

// Safe async operation that never throws
export async function safeAsync<T>(
  operation: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await operation();
  } catch {
    return defaultValue;
  }
}

// Retry with exponential backoff
export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry
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

        // Check if we should retry this error
        if (!shouldRetry(lastError, attempt)) {
          reject(lastError);
          return;
        }

        // Notify about retry
        if (onRetry) {
          onRetry(lastError, attempt);
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

// Timeout wrapper for async operations
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, abortController } = options;

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort();
      }
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = await operation();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.options.recoveryTimeout) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
}

// Batch operation with error handling
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    stopOnError?: boolean;
    onItemError?: (error: Error, item: T, index: number) => void;
  } = {}
): Promise<Array<R | Error>> {
  const {
    batchSize = items.length,
    concurrency = 5,
    stopOnError = false,
    onItemError
  } = options;

  const results: Array<R | Error> = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        return await processor(item, globalIndex);
      } catch (error) {
        if (onItemError) {
          onItemError(error, item, globalIndex);
        }
        if (stopOnError) {
          throw error;
        }
        return error;
      }
    });

    // Process batch with limited concurrency
    const batchResults = await processConcurrently(batchPromises, concurrency);
    results.push(...batchResults);
  }

  return results;
}

// Helper function to process promises with limited concurrency
async function processConcurrently<T>(
  promises: Promise<T>[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < promises.length; i += concurrency) {
    const batch = promises.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  
  return results;
}

// Debounced async operation
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  }) as T;
}

// Throttled async operation
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  intervalMs: number
): T {
  let lastExecution = 0;
  let pending: Promise<any> | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecution >= intervalMs && !pending) {
      lastExecution = now;
      pending = fn(...args);
      pending.finally(() => {
        pending = null;
      });
      return pending;
    }
    
    if (pending) {
      return pending;
    }
    
    return Promise.reject(new Error('Function call throttled'));
  }) as T;
}

// Promise pool for managing concurrent operations
export class PromisePool {
  private running: Set<Promise<any>> = new Set();
  
  constructor(private maxConcurrency: number) {}
  
  async add<T>(promiseFactory: () => Promise<T>): Promise<T> {
    while (this.running.size >= this.maxConcurrency) {
      await Promise.race(this.running);
    }
    
    const promise = promiseFactory();
    this.running.add(promise);
    
    promise.finally(() => {
      this.running.delete(promise);
    });
    
    return promise;
  }
  
  async drain(): Promise<void> {
    while (this.running.size > 0) {
      await Promise.all(this.running);
    }
  }
  
  get activeCount(): number {
    return this.running.size;
  }
}