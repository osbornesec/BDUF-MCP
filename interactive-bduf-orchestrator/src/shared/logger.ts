import winston from 'winston';
import path from 'path';

export interface LogContext {
  userId?: string;
  projectId?: string;
  sessionId?: string;
  correlationId: string;
  component: string;
  operation: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private logger: winston.Logger;
  private component: string;

  constructor(component: string) {
    this.component = component;
    
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          component,
          message,
          ...meta
        });
      })
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { component: this.component },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log')
        })
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'exceptions.log')
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'rejections.log')
        })
      ]
    });
  }

  private formatMessage(message: string, context?: Partial<LogContext>): [string, object] {
    const logContext = {
      component: this.component,
      correlationId: this.generateCorrelationId(),
      ...context
    };

    return [message, logContext];
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  info(message: string, context?: Partial<LogContext>): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.info(msg, ctx);
  }

  warn(message: string, context?: Partial<LogContext>): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.warn(msg, ctx);
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.error(msg, { ...ctx, error: error?.stack || error?.message });
  }

  debug(message: string, context?: Partial<LogContext>): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.debug(msg, ctx);
  }

  verbose(message: string, context?: Partial<LogContext>): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.verbose(msg, ctx);
  }
}