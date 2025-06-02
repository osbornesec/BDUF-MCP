/**
 * Example usage of the Error Handling Framework
 * This file demonstrates how to use the comprehensive error handling system
 * in the Interactive BDUF Orchestrator MCP Server.
 */

import {
  ErrorManager,
  createDefaultErrorManagerConfig,
  initializeErrorManager,
  getErrorManager
} from '../src/shared/error-manager.js';

import {
  ErrorFactory,
  ValidationError,
  NotFoundError,
  ExternalServiceError,
  asyncHandler,
  retryWithBackoff,
  CircuitBreaker,
  withErrorBoundary,
  ErrorUtils
} from '../src/shared/errors/index.js';

// Example 1: Initialize Error Manager
function initializeErrorSystem() {
  const config = createDefaultErrorManagerConfig('example-service');
  
  // Customize configuration for your needs
  config.enableNotifications = true;
  config.notificationThreshold = 'high';
  config.notificationEndpoints = ['slack://alerts', 'email://ops@company.com'];
  
  const errorManager = initializeErrorManager(config);
  
  console.log('Error management system initialized');
  return errorManager;
}

// Example 2: Basic Error Handling in Functions
async function processUserData(userData: any) {
  // Validate input data
  if (!userData.email) {
    throw ErrorFactory.missingField('email');
  }
  
  if (!userData.email.includes('@')) {
    throw ErrorFactory.invalidFormat('email', 'email format', userData.email);
  }
  
  if (userData.age && (userData.age < 13 || userData.age > 120)) {
    throw ErrorFactory.outOfRange('age', userData.age, 13, 120);
  }
  
  return { id: 'user-123', ...userData };
}

// Example 3: External Service Integration with Error Handling
const externalApiCall = asyncHandler(async (endpoint: string, params: any) => {
  try {
    // Simulate API call
    if (Math.random() < 0.3) {
      throw new Error('Network timeout');
    }
    
    return { data: 'api response', endpoint, params };
  } catch (error) {
    throw ErrorFactory.context7Error('api-call', endpoint);
  }
});

// Example 4: Circuit Breaker Pattern
const apiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 5000,
  monitorInterval: 1000
});

async function robustApiCall(endpoint: string) {
  return apiCircuitBreaker.execute(async () => {
    return externalApiCall(endpoint, {});
  });
}

// Example 5: Retry with Exponential Backoff
async function resilientDatabaseOperation(query: string) {
  return retryWithBackoff(
    async () => {
      // Simulate database operation
      if (Math.random() < 0.5) {
        throw ErrorFactory.databaseError('query_execution', 'users');
      }
      return { result: 'database response' };
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      factor: 2,
      shouldRetry: (error) => ErrorUtils.shouldRetry(error),
      onRetry: (error, attempt) => {
        console.log(`Retrying database operation, attempt ${attempt + 1}`);
      }
    }
  );
}

// Example 6: Error Boundary for Critical Operations
async function criticalBusinessOperation(data: any) {
  return withErrorBoundary(
    async () => {
      // Critical operation that must not fail the entire application
      await processUserData(data);
      await resilientDatabaseOperation('INSERT INTO users...');
      await robustApiCall('/notify-user');
      
      return { success: true };
    },
    { success: false, error: 'Operation failed safely' }, // Fallback value
    (error) => {
      // Error handler - log but don't crash
      console.error('Critical operation failed:', error);
    }
  );
}

// Example 7: Express.js Middleware Integration
function setupExpressErrorHandling(app: any) {
  const errorManager = getErrorManager();
  
  // Use error middleware
  app.use(errorManager.getExpressMiddleware());
  
  // Example route with error handling
  app.post('/users', errorManager.wrapAsync(async (req: any, res: any) => {
    const userData = await processUserData(req.body);
    res.json({ success: true, user: userData });
  }));
  
  // Example route that might fail
  app.get('/external-data/:id', errorManager.wrapAsync(async (req: any, res: any) => {
    const data = await robustApiCall(`/data/${req.params.id}`);
    res.json(data);
  }));
}

// Example 8: Custom Error Types for Domain-Specific Logic
class ProjectNotFoundError extends NotFoundError {
  constructor(projectId: string) {
    super('Project', projectId, {
      projectId,
      operation: 'project_lookup',
      suggestions: ['Check project ID', 'Verify access permissions']
    });
  }
}

class InsufficientProjectPermissionsError extends ValidationError {
  constructor(userId: string, projectId: string, requiredRole: string) {
    super(
      `User ${userId} requires ${requiredRole} role to access project ${projectId}`,
      'permissions',
      { userId, projectId, requiredRole },
      [`role:${requiredRole}`]
    );
  }
}

// Example 9: Service Layer with Comprehensive Error Handling
class ProjectService {
  private errorManager = getErrorManager();
  
  async getProject(projectId: string, userId: string) {
    try {
      // Check permissions first
      const hasAccess = await this.checkProjectAccess(userId, projectId);
      if (!hasAccess) {
        throw new InsufficientProjectPermissionsError(userId, projectId, 'viewer');
      }
      
      // Get project data
      const project = await this.fetchProjectData(projectId);
      if (!project) {
        throw new ProjectNotFoundError(projectId);
      }
      
      return project;
    } catch (error) {
      // Let error manager handle logging and metrics
      await this.errorManager.handleError(error, {
        operation: 'getProject',
        userId,
        projectId
      });
      throw error; // Re-throw for caller to handle
    }
  }
  
  private async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    return withErrorBoundary(
      async () => {
        // Simulate permission check
        return Math.random() > 0.1; // 90% success rate
      },
      false, // Default to no access on error
      (error) => {
        console.warn('Permission check failed, defaulting to no access:', error);
      }
    );
  }
  
  private async fetchProjectData(projectId: string) {
    return retryWithBackoff(async () => {
      // Simulate data fetching
      if (Math.random() < 0.2) {
        throw ErrorFactory.databaseError('select', 'projects');
      }
      
      return projectId === 'invalid' ? null : {
        id: projectId,
        name: 'Example Project',
        status: 'active'
      };
    });
  }
}

// Example 10: Error Monitoring and Health Checks
class HealthMonitor {
  private errorManager = getErrorManager();
  
  async getHealthStatus() {
    const summary = await this.errorManager.getErrorSummary(1); // Last hour
    
    return {
      status: summary.totalErrors < 10 ? 'healthy' : 'degraded',
      errors: {
        total: summary.totalErrors,
        byCategory: summary.errorsByCategory,
        bySeverity: summary.errorsBySeverity
      },
      timestamp: new Date().toISOString()
    };
  }
  
  async runHealthChecks() {
    const checks = [
      this.checkDatabaseConnection(),
      this.checkExternalServices(),
      this.checkMemoryUsage()
    ];
    
    const results = await Promise.allSettled(checks);
    
    return results.map((result, index) => ({
      check: ['database', 'external_services', 'memory'][index],
      status: result.status === 'fulfilled' ? 'pass' : 'fail',
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }
  
  private async checkDatabaseConnection() {
    // Simulate database health check
    if (Math.random() < 0.05) {
      throw ErrorFactory.databaseError('connection_check');
    }
    return true;
  }
  
  private async checkExternalServices() {
    // Simulate external service health check
    if (Math.random() < 0.1) {
      throw ErrorFactory.connectionFailure('external_api', 'health_check');
    }
    return true;
  }
  
  private async checkMemoryUsage() {
    const usage = process.memoryUsage();
    const limit = 1024 * 1024 * 1024; // 1GB
    
    if (usage.heapUsed > limit) {
      throw new Error(`Memory usage too high: ${usage.heapUsed} bytes`);
    }
    
    return true;
  }
}

// Example Usage
async function runExamples() {
  try {
    console.log('=== Error Handling Framework Examples ===\n');
    
    // Initialize error system
    const errorManager = initializeErrorSystem();
    
    // Example 1: Basic validation
    console.log('1. Testing basic validation...');
    try {
      await processUserData({ name: 'John' }); // Missing email
    } catch (error) {
      console.log('   Caught validation error:', error.message);
    }
    
    // Example 2: Successful operation
    console.log('\n2. Testing successful operation...');
    const user = await processUserData({ 
      email: 'john@example.com', 
      age: 25 
    });
    console.log('   User created:', user);
    
    // Example 3: Circuit breaker
    console.log('\n3. Testing circuit breaker...');
    try {
      await robustApiCall('/test-endpoint');
      console.log('   API call successful');
    } catch (error) {
      console.log('   API call failed:', error.message);
    }
    
    // Example 4: Error boundary
    console.log('\n4. Testing error boundary...');
    const result = await criticalBusinessOperation({ email: 'invalid' });
    console.log('   Critical operation result:', result);
    
    // Example 5: Health monitoring
    console.log('\n5. Testing health monitoring...');
    const healthMonitor = new HealthMonitor();
    const healthStatus = await healthMonitor.getHealthStatus();
    console.log('   Health status:', healthStatus);
    
    // Example 6: Project service
    console.log('\n6. Testing project service...');
    const projectService = new ProjectService();
    try {
      const project = await projectService.getProject('test-project', 'user-123');
      console.log('   Project retrieved:', project);
    } catch (error) {
      console.log('   Project access failed:', error.message);
    }
    
    console.log('\n=== Examples completed successfully! ===');
    
  } catch (error) {
    console.error('Example execution failed:', error);
  } finally {
    // Graceful shutdown
    const errorManager = getErrorManager();
    await errorManager.shutdown();
  }
}

// Export for use in other files
export {
  ProjectService,
  HealthMonitor,
  ProjectNotFoundError,
  InsufficientProjectPermissionsError,
  runExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}