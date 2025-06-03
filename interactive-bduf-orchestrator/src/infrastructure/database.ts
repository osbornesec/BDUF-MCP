/**
 * Database Infrastructure
 * PostgreSQL connection and Prisma client initialization
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../shared/logger.js';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private logger: Logger;
  private isConnected = false;

  private constructor() {
    this.logger = new Logger('DatabaseManager');
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupEventHandlers();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventHandlers(): void {
    this.prisma.$on('query', (e: any) => {
      this.logger.debug('Database query executed', {
        metadata: {
          query: e.query,
          params: e.params,
          duration: e.duration,
          target: e.target
        }
      });
    });

    this.prisma.$on('error', (e: any) => {
      this.logger.error('Database error occurred', new Error(e.message), {
        metadata: {
          target: e.target
        }
      });
    });

    this.prisma.$on('info', (e: any) => {
      this.logger.info('Database info', {
        metadata: {
          message: e.message,
          target: e.target
        }
      });
    });

    this.prisma.$on('warn', (e: any) => {
      this.logger.warn('Database warning', {
        metadata: {
          message: e.message,
          target: e.target
        }
      });
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.logger.info('Connecting to database...');
      
      // Test the connection
      await this.prisma.$connect();
      
      // Run a simple query to ensure connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      this.isConnected = true;
      this.logger.info('Database connection established successfully');
      
    } catch (error) {
      this.logger.error('Failed to connect to database', error as Error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      this.logger.info('Disconnecting from database...');
      await this.prisma.$disconnect();
      this.isConnected = false;
      this.logger.info('Database disconnected successfully');
      
    } catch (error) {
      this.logger.error('Error during database disconnection', error as Error);
      throw error;
    }
  }

  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      const responseTime = Date.now() - startTime;
      
      // Get database info
      const dbInfo = await this.prisma.$queryRaw`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as host,
          inet_server_port() as port
      ` as any[];

      return {
        status: 'healthy',
        details: {
          responseTime: `${responseTime}ms`,
          connected: this.isConnected,
          database: dbInfo[0]?.database,
          user: dbInfo[0]?.user,
          version: dbInfo[0]?.version,
          host: dbInfo[0]?.host,
          port: dbInfo[0]?.port
        }
      };

    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: this.isConnected
        }
      };
    }
  }

  async runMigrations(): Promise<void> {
    try {
      this.logger.info('Running database migrations...');
      
      // In production, migrations should be run separately
      // This is mainly for development/testing
      if (process.env['NODE_ENV'] === 'development') {
        // Note: Prisma migrations are typically run via CLI
        // This is a placeholder for any custom migration logic
        this.logger.info('Development mode: migrations should be run via CLI');
      }
      
      this.logger.info('Database migrations completed');
      
    } catch (error) {
      this.logger.error('Database migration failed', error as Error);
      throw error;
    }
  }

  async seed(): Promise<void> {
    try {
      this.logger.info('Seeding database with initial data...');
      
      // Create default organization if it doesn't exist
      const existingOrg = await this.prisma.organization.findFirst();
      
      if (!existingOrg) {
        await this.prisma.organization.create({
          data: {
            name: 'Default Organization',
            slug: 'default',
            plan: 'STARTER',
            status: 'ACTIVE'
          }
        });
        
        this.logger.info('Default organization created');
      }
      
      this.logger.info('Database seeding completed');
      
    } catch (error) {
      this.logger.error('Database seeding failed', error as Error);
      throw error;
    }
  }

  // Utility methods for common operations
  async withTransaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  // Row-level security helpers for multi-tenant architecture
  async setTenantContext(organizationId: string): Promise<void> {
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_tenant_id', ${organizationId}, true)
    `;
  }

  async clearTenantContext(): Promise<void> {
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_tenant_id', '', true)
    `;
  }
}

// Global database initialization function
export async function initializeDatabase(): Promise<DatabaseManager> {
  const dbManager = DatabaseManager.getInstance();
  await dbManager.connect();
  
  // Run migrations in development
  if (process.env.NODE_ENV === 'development') {
    await dbManager.runMigrations();
    await dbManager.seed();
  }
  
  return dbManager;
}

// Export singleton instance
export const db = DatabaseManager.getInstance();

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await db.disconnect();
});

process.on('SIGTERM', async () => {
  await db.disconnect();
});

process.on('SIGINT', async () => {
  await db.disconnect();
});