import { Logger } from '../logger.js';
import { BaseError, ErrorMetadata, ErrorSeverityLevel, UnknownError } from './base-error.js';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

export interface MetricsCollector {
  increment(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
}

export interface ErrorHandlerConfig {
  enableAutoRecovery: boolean;
  includeStackTrace: boolean;
  notificationThreshold: 'medium' | 'high' | 'critical';
  maxRetries: number;
  retryDelayMs: number;
}

export interface ErrorHandlerDependencies {
  logger: Logger;
  metrics: MetricsCollector;
  config: ErrorHandlerConfig;
}

export interface ErrorNotificationService {
  notifyError(error: BaseError, context?: ErrorContext): Promise<void>;
}

export class ErrorHandler {
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ErrorHandlerConfig;
  private notificationService?: ErrorNotificationService;

  constructor(dependencies: ErrorHandlerDependencies) {
    this.logger = dependencies.logger;
    this.metrics = dependencies.metrics;
    this.config = dependencies.config;
  }

  public setNotificationService(service: ErrorNotificationService): void {
    this.notificationService = service;
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
    if (this.shouldNotify(processedError.severity)) {
      await this.notifyMonitoring(processedError, context);
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

    switch (logLevel) {
      case 'error':
        this.logger.error(`Error occurred: ${error.message}`, error, { 
          correlationId: error.correlationId,
          ...logData 
        });
        break;
      case 'warn':
        this.logger.warn(`Warning: ${error.message}`, { 
          correlationId: error.correlationId,
          ...logData 
        });
        break;
      case 'info':
        this.logger.info(`Notice: ${error.message}`, { 
          correlationId: error.correlationId,
          ...logData 
        });
        break;
    }
  }

  private collectErrorMetrics(error: BaseError): void {
    this.metrics.increment('errors.total', 1, {
      errorCode: error.errorCode,
      category: error.category,
      severity: error.severity.level
    });

    this.metrics.histogram('errors.processing_time', Date.now() - error.timestamp.getTime());

    // Track specific error types
    this.metrics.increment(`errors.by_type.${error.constructor.name}`, 1);

    // Track error impact
    this.metrics.increment(`errors.by_impact.${error.severity.impact}`, 1);

    // Track recovery type
    this.metrics.increment(`errors.by_recovery.${error.severity.recovery}`, 1);
  }

  private getLogLevel(severity: ErrorSeverityLevel): 'error' | 'warn' | 'info' {
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

  private shouldNotify(severity: ErrorSeverityLevel): boolean {
    const thresholdOrder = ['low', 'medium', 'high', 'critical'];
    const configThreshold = thresholdOrder.indexOf(this.config.notificationThreshold);
    const errorThreshold = thresholdOrder.indexOf(severity.level);
    
    return errorThreshold >= configThreshold;
  }

  private async attemptRecovery(error: BaseError, context?: ErrorContext): Promise<void> {
    if (error.severity.recovery !== 'automatic') {
      return;
    }

    try {
      // Implement basic recovery strategies
      switch (error.category) {
        case 'external':
          await this.handleExternalServiceRecovery(error, context);
          break;
        case 'internal':
          await this.handleInternalErrorRecovery(error, context);
          break;
        default:
          this.logger.debug('No recovery strategy available for error category', {
            category: error.category,
            correlationId: error.correlationId
          });
      }
    } catch (recoveryError) {
      this.logger.error('Error recovery failed', recoveryError as Error, {
        originalError: error.correlationId,
        correlationId: error.correlationId
      });
    }
  }

  private async handleExternalServiceRecovery(error: BaseError, context?: ErrorContext): Promise<void> {
    // Implement circuit breaker logic, retry mechanisms, etc.
    this.logger.info('Attempting external service recovery', {
      correlationId: error.correlationId,
      service: error.metadata.service
    });
  }

  private async handleInternalErrorRecovery(error: BaseError, context?: ErrorContext): Promise<void> {
    // Implement internal error recovery logic
    this.logger.info('Attempting internal error recovery', {
      correlationId: error.correlationId,
      operation: error.metadata.operation
    });
  }

  private async notifyMonitoring(error: BaseError, context?: ErrorContext): Promise<void> {
    try {
      if (this.notificationService) {
        await this.notificationService.notifyError(error, context);
      }

      // Also log that notification was attempted
      this.logger.info('Error notification sent', {
        correlationId: error.correlationId,
        severity: error.severity.level,
        category: error.category
      });
    } catch (notificationError) {
      this.logger.error('Failed to send error notification', notificationError as Error, {
        originalError: error.correlationId
      });
    }
  }

  public createErrorMiddleware() {
    return (error: Error, req: any, res: any, next: any) => {
      // Handle the error asynchronously
      this.handleError(error, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.get?.('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      }).catch((handlingError) => {
        // Log error handling failure but don't throw
        this.logger.error('Error handling failed', handlingError as Error);
      });

      // Send response
      if (error instanceof BaseError) {
        const response = error.getSanitizedResponse(this.config.includeStackTrace);
        res.status(error.statusCode).json(response);
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
            correlationId: this.generateCorrelationId()
          }
        });
      }
    };
  }

  public createAsyncErrorWrapper<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: Parameters<T>) => {
      return Promise.resolve(fn(...args)).catch((error) => {
        // Handle the error but still throw for upstream handling
        this.handleError(error).catch(() => {
          // Ignore error handling failures in wrapper
        });
        throw error;
      });
    }) as T;
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility method for getting error summaries
  public getErrorSummary(timeRangeHours: number = 24): Promise<ErrorSummary> {
    // This would typically query metrics or logs
    // Implementation would depend on the metrics backend
    return Promise.resolve({
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      topErrors: [],
      timeRange: `${timeRangeHours}h`
    });
  }
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{
    errorCode: string;
    count: number;
    lastOccurrence: Date;
  }>;
  timeRange: string;
}