import { config } from 'dotenv';
import { Logger } from './logger';

config(); // Load environment variables

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetries: number;
  retryDelayOnFailover: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigin: string;
  corsCredentials: boolean;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  sessionSecret: string;
  sessionMaxAge: number;
}

export interface ExternalApiConfig {
  context7ApiKey?: string;
  perplexityApiKey?: string;
  openaiApiKey?: string;
}

export interface LoggingConfig {
  level: string;
  format: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
  externalApis: ExternalApiConfig;
  logging: LoggingConfig;
  rateLimit: RateLimitConfig;
  features: Record<string, boolean>;
}

export class ConfigManager {
  private logger: Logger;
  private config: AppConfig;

  constructor() {
    this.logger = new Logger('ConfigManager');
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        corsCredentials: process.env.CORS_CREDENTIALS === 'true'
      },
      database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        database: process.env.DATABASE_NAME || 'bduf_orchestrator',
        user: process.env.DATABASE_USER || 'user',
        password: process.env.DATABASE_PASSWORD || 'password',
        ssl: process.env.DATABASE_SSL === 'true',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
        idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000', 10)
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10)
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
        sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10)
      },
      externalApis: {
        context7ApiKey: process.env.CONTEXT7_API_KEY,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
      },
      features: {
        enableCollaboration: process.env.ENABLE_COLLABORATION !== 'false',
        enableAiAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false',
        enableApprovalWorkflows: process.env.ENABLE_APPROVAL_WORKFLOWS !== 'false',
        enableMetrics: process.env.ENABLE_METRICS === 'true'
      }
    };
  }

  get<T = unknown>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: unknown = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  async load(): Promise<void> {
    this.logger.info('Loading configuration');
    
    // Validate required configuration
    this.validateRequiredConfig();
    
    this.logger.info('Configuration loaded successfully', {
      operation: 'load',
      metadata: {
        nodeEnv: this.config.server.nodeEnv,
        port: this.config.server.port,
        featuresEnabled: Object.keys(this.config.features).filter(key => this.config.features[key])
      }
    });
  }

  private validateRequiredConfig(): void {
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (this.config.server.nodeEnv === 'production') {
      const productionRequiredVars = ['DATABASE_PASSWORD', 'REDIS_PASSWORD'];
      const missingProdVars = productionRequiredVars.filter(varName => !process.env[varName]);

      if (missingProdVars.length > 0) {
        this.logger.warn('Missing recommended production environment variables', {
          operation: 'validateRequiredConfig',
          metadata: { missingVars: missingProdVars }
        });
      }
    }
  }

  isDevelopment(): boolean {
    return this.config.server.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.server.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.server.nodeEnv === 'test';
  }
}

// Global configuration instance
const configManager = new ConfigManager();

// Export convenience function
export async function loadConfig(): Promise<AppConfig> {
  await configManager.load();
  return configManager.getConfig();
}

// Export singleton instance
export { configManager as config };