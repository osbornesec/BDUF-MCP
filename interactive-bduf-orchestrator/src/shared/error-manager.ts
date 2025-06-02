import { Logger } from './logger.js';
import { ErrorHandler, ErrorHandlerConfig, ErrorNotificationService } from './errors/error-handler.js';
import { createMetricsCollector, MetricsCollector } from './metrics.js';
import { BaseError } from './errors/base-error.js';

export interface ErrorManagerConfig extends ErrorHandlerConfig {
  component: string;
  enableNotifications: boolean;
  notificationEndpoints?: string[];
}

export class DefaultErrorNotificationService implements ErrorNotificationService {
  private logger: Logger;
  private endpoints: string[];

  constructor(logger: Logger, endpoints: string[] = []) {
    this.logger = logger;
    this.endpoints = endpoints;
  }

  async notifyError(error: BaseError, context?: any): Promise<void> {
    try {
      // Log the notification attempt
      this.logger.info('Sending error notification', {
        correlationId: error.correlationId,
        errorCode: error.errorCode,
        severity: error.severity.level,
        endpoints: this.endpoints.length
      });

      // In a real implementation, you would send notifications to:
      // - Slack/Teams channels
      // - Email lists
      // - PagerDuty/OpsGenie
      // - Monitoring dashboards
      
      for (const endpoint of this.endpoints) {
        await this.sendNotification(endpoint, error, context);
      }
    } catch (notificationError) {
      this.logger.error('Failed to send error notification', notificationError as Error, {
        originalError: error.correlationId
      });
    }
  }

  private async sendNotification(endpoint: string, error: BaseError, context?: any): Promise<void> {
    // Placeholder for actual notification implementation
    this.logger.debug('Would send notification to endpoint', {
      endpoint,
      errorCode: error.errorCode,
      correlationId: error.correlationId
    });
  }
}

export class ErrorManager {
  private logger: Logger;
  private metrics: MetricsCollector;
  private errorHandler: ErrorHandler;
  private notificationService?: ErrorNotificationService;

  constructor(config: ErrorManagerConfig) {
    this.logger = new Logger(config.component);
    this.metrics = createMetricsCollector();
    
    this.errorHandler = new ErrorHandler({
      logger: this.logger,
      metrics: this.metrics,
      config
    });

    if (config.enableNotifications) {
      this.notificationService = new DefaultErrorNotificationService(
        this.logger,
        config.notificationEndpoints
      );
      this.errorHandler.setNotificationService(this.notificationService);
    }
  }

  // Main error handling method
  async handleError(error: Error, context?: any): Promise<void> {
    return this.errorHandler.handleError(error, context);
  }

  // Express middleware
  getExpressMiddleware() {
    return this.errorHandler.createErrorMiddleware();
  }

  // Async wrapper
  wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return this.errorHandler.createAsyncErrorWrapper(fn);
  }

  // Get error statistics
  async getErrorSummary(timeRangeHours: number = 24) {
    return this.errorHandler.getErrorSummary(timeRangeHours);
  }

  // Access to underlying components for advanced usage
  getLogger(): Logger {
    return this.logger;
  }

  getMetrics(): MetricsCollector {
    return this.metrics;
  }

  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await this.metrics.flush();
      this.logger.info('Error manager shutdown completed');
    } catch (error) {
      this.logger.error('Error during error manager shutdown', error as Error);
    }
  }
}

// Global error manager instance factory
let globalErrorManager: ErrorManager | undefined;

export function initializeErrorManager(config: ErrorManagerConfig): ErrorManager {
  if (globalErrorManager) {
    throw new Error('Error manager already initialized');
  }

  globalErrorManager = new ErrorManager(config);
  
  // Set up global error handlers
  setupGlobalErrorHandlers(globalErrorManager);
  
  return globalErrorManager;
}

export function getErrorManager(): ErrorManager {
  if (!globalErrorManager) {
    throw new Error('Error manager not initialized. Call initializeErrorManager() first.');
  }
  return globalErrorManager;
}

function setupGlobalErrorHandlers(errorManager: ErrorManager): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    errorManager.handleError(error, { 
      type: 'uncaughtException',
      fatal: true 
    }).finally(() => {
      // Give time for logging/notifications, then exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    errorManager.handleError(error, { 
      type: 'unhandledRejection',
      promise: promise.toString()
    });
  });

  // Handle graceful shutdown signals
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, async () => {
      errorManager.getLogger().info(`Received ${signal}, shutting down gracefully`);
      await errorManager.shutdown();
      process.exit(0);
    });
  });
}

// Default configuration factory
export function createDefaultErrorManagerConfig(component: string): ErrorManagerConfig {
  return {
    component,
    enableAutoRecovery: true,
    includeStackTrace: process.env.NODE_ENV !== 'production',
    notificationThreshold: process.env.NODE_ENV === 'production' ? 'high' : 'critical',
    maxRetries: 3,
    retryDelayMs: 1000,
    enableNotifications: process.env.NODE_ENV === 'production',
    notificationEndpoints: []
  };
}