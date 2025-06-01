# Prompt 004: Metrics Collection Framework Implementation

## Persona
You are a **Senior Observability Engineer** with 8+ years of experience building enterprise-grade monitoring and metrics systems. You specialize in designing scalable metrics collection frameworks that provide deep insights into application performance, business metrics, and system health. You have extensive expertise in Prometheus, custom metrics systems, and performance monitoring for distributed applications.

## Context
You are implementing the metrics collection framework for the Interactive BDUF Orchestrator MCP Server. This system will collect, aggregate, and expose metrics for application performance monitoring, business intelligence, and system health tracking across all components of the orchestrator.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/004-metrics-collection-framework
```

## Required Context from Context7
- Enterprise metrics collection patterns and best practices
- Performance monitoring and observability frameworks
- Prometheus metrics format and patterns

## Implementation Requirements

### 1. Core Metrics Collection System
Create a comprehensive metrics collection framework:

```typescript
// Metric types and interfaces
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  quantiles?: number[]; // For summaries
}

export interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

// Core metrics collector
export class MetricsCollector {
  private metrics: Map<string, Metric>;
  private registry: MetricRegistry;
  
  constructor();
  
  // Metric registration
  registerMetric(definition: MetricDefinition): void;
  unregisterMetric(name: string): void;
  
  // Metric operations
  increment(name: string, labels?: Record<string, string>, value?: number): void;
  decrement(name: string, labels?: Record<string, string>, value?: number): void;
  set(name: string, value: number, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
  
  // Timer utilities
  startTimer(name: string, labels?: Record<string, string>): Timer;
  recordDuration<T>(name: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T>;
  
  // Metric retrieval
  getMetric(name: string): Metric | undefined;
  getAllMetrics(): Metric[];
  exportMetrics(format: MetricFormat): string;
}
```

### 2. Application Performance Metrics
Implement comprehensive application monitoring:

```typescript
// Application performance metrics
export const ApplicationMetrics = {
  // Request/Response metrics
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION: 'http_request_duration_seconds',
  HTTP_REQUEST_SIZE: 'http_request_size_bytes',
  HTTP_RESPONSE_SIZE: 'http_response_size_bytes',
  
  // MCP Protocol metrics
  MCP_TOOL_EXECUTIONS_TOTAL: 'mcp_tool_executions_total',
  MCP_TOOL_DURATION: 'mcp_tool_duration_seconds',
  MCP_TOOL_ERRORS_TOTAL: 'mcp_tool_errors_total',
  MCP_SESSION_DURATION: 'mcp_session_duration_seconds',
  
  // Database metrics
  DATABASE_QUERIES_TOTAL: 'database_queries_total',
  DATABASE_QUERY_DURATION: 'database_query_duration_seconds',
  DATABASE_CONNECTIONS_ACTIVE: 'database_connections_active',
  DATABASE_CONNECTIONS_IDLE: 'database_connections_idle',
  
  // Cache metrics
  CACHE_OPERATIONS_TOTAL: 'cache_operations_total',
  CACHE_HIT_RATIO: 'cache_hit_ratio',
  CACHE_SIZE_BYTES: 'cache_size_bytes',
  CACHE_EVICTIONS_TOTAL: 'cache_evictions_total',
  
  // Error metrics
  ERROR_RATE: 'error_rate',
  ERROR_COUNT_BY_TYPE: 'error_count_by_type',
  CRITICAL_ERRORS_TOTAL: 'critical_errors_total'
} as const;

// Performance monitoring middleware
export class PerformanceMonitor {
  constructor(private metrics: MetricsCollector);
  
  // Express middleware for HTTP metrics
  httpMetricsMiddleware(): Express.RequestHandler;
  
  // Database query monitoring
  wrapDatabaseQuery<T>(
    operation: string,
    query: () => Promise<T>
  ): Promise<T>;
  
  // Cache operation monitoring
  wrapCacheOperation<T>(
    operation: 'get' | 'set' | 'delete',
    key: string,
    fn: () => Promise<T>
  ): Promise<T>;
  
  // Tool execution monitoring
  wrapToolExecution<T>(
    toolName: string,
    execution: () => Promise<T>
  ): Promise<T>;
}
```

### 3. Business Intelligence Metrics
Implement business and operational metrics:

```typescript
// Business metrics definitions
export const BusinessMetrics = {
  // Project metrics
  PROJECTS_CREATED_TOTAL: 'projects_created_total',
  PROJECTS_COMPLETED_TOTAL: 'projects_completed_total',
  PROJECT_DURATION: 'project_duration_days',
  PROJECT_COMPLEXITY_DISTRIBUTION: 'project_complexity_distribution',
  
  // Task metrics
  TASKS_CREATED_TOTAL: 'tasks_created_total',
  TASKS_COMPLETED_TOTAL: 'tasks_completed_total',
  TASK_COMPLETION_TIME: 'task_completion_time_hours',
  TASK_ESTIMATION_ACCURACY: 'task_estimation_accuracy_ratio',
  
  // User engagement metrics
  ACTIVE_USERS_TOTAL: 'active_users_total',
  USER_SESSION_DURATION: 'user_session_duration_minutes',
  COLLABORATION_SESSIONS_TOTAL: 'collaboration_sessions_total',
  APPROVAL_WORKFLOW_DURATION: 'approval_workflow_duration_hours',
  
  // Analysis metrics
  REQUIREMENTS_ANALYSIS_DURATION: 'requirements_analysis_duration_seconds',
  ARCHITECTURE_GENERATION_DURATION: 'architecture_generation_duration_seconds',
  ANALYSIS_ACCURACY_SCORE: 'analysis_accuracy_score',
  CONTEXT_ASSEMBLY_OPERATIONS: 'context_assembly_operations_total',
  
  // External API usage
  CONTEXT7_API_CALLS_TOTAL: 'context7_api_calls_total',
  PERPLEXITY_API_CALLS_TOTAL: 'perplexity_api_calls_total',
  EXTERNAL_API_ERRORS_TOTAL: 'external_api_errors_total',
  API_RATE_LIMIT_HITS: 'api_rate_limit_hits_total'
} as const;

// Business metrics collector
export class BusinessMetricsCollector {
  constructor(private metrics: MetricsCollector);
  
  // Project lifecycle metrics
  recordProjectCreated(complexity: ComplexityLevel, stakeholderCount: number): void;
  recordProjectCompleted(projectId: string, durationDays: number): void;
  recordProjectStatusChange(from: ProjectStatus, to: ProjectStatus): void;
  
  // Task lifecycle metrics
  recordTaskCreated(taskType: string, estimatedHours: number): void;
  recordTaskCompleted(taskId: string, actualHours: number, estimatedHours: number): void;
  recordTaskStatusChange(from: TaskStatus, to: TaskStatus): void;
  
  // User engagement metrics
  recordUserLogin(userId: string): void;
  recordSessionStart(sessionType: 'collaboration' | 'individual'): void;
  recordSessionEnd(sessionId: string, durationMinutes: number): void;
  
  // Analysis performance metrics
  recordAnalysisOperation(
    operation: 'requirements' | 'architecture' | 'risk',
    durationSeconds: number,
    complexity: ComplexityLevel
  ): void;
  
  // External API usage metrics
  recordExternalApiCall(
    service: 'context7' | 'perplexity',
    operation: string,
    success: boolean,
    responseTime: number
  ): void;
}
```

### 4. System Health Metrics
Implement system monitoring and health checks:

```typescript
// System health metrics
export const SystemMetrics = {
  // Resource utilization
  CPU_USAGE_PERCENT: 'cpu_usage_percent',
  MEMORY_USAGE_BYTES: 'memory_usage_bytes',
  MEMORY_USAGE_PERCENT: 'memory_usage_percent',
  DISK_USAGE_BYTES: 'disk_usage_bytes',
  DISK_USAGE_PERCENT: 'disk_usage_percent',
  
  // Network metrics
  NETWORK_BYTES_SENT: 'network_bytes_sent_total',
  NETWORK_BYTES_RECEIVED: 'network_bytes_received_total',
  NETWORK_CONNECTIONS_ACTIVE: 'network_connections_active',
  
  // Process metrics
  PROCESS_UPTIME_SECONDS: 'process_uptime_seconds',
  PROCESS_RESTART_COUNT: 'process_restart_count_total',
  PROCESS_CPU_TIME: 'process_cpu_time_seconds',
  
  // Health check metrics
  HEALTH_CHECK_STATUS: 'health_check_status',
  HEALTH_CHECK_DURATION: 'health_check_duration_seconds',
  COMPONENT_AVAILABILITY: 'component_availability'
} as const;

// System health monitor
export class SystemHealthMonitor {
  private healthChecks: Map<string, HealthCheck>;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private metrics: MetricsCollector,
    private intervalMs: number = 60000
  );
  
  // Health check registration
  registerHealthCheck(name: string, check: HealthCheck): void;
  unregisterHealthCheck(name: string): void;
  
  // System monitoring
  startMonitoring(): void;
  stopMonitoring(): void;
  
  // Resource monitoring
  private collectSystemMetrics(): Promise<void>;
  private collectProcessMetrics(): void;
  private collectNetworkMetrics(): Promise<void>;
  
  // Health checks
  async runHealthChecks(): Promise<HealthCheckResult[]>;
  async runHealthCheck(name: string): Promise<HealthCheckResult>;
}

// Health check interface
export interface HealthCheck {
  name: string;
  description: string;
  timeout: number;
  check: () => Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration: number;
  timestamp: Date;
}
```

### 5. Metrics Export and Integration
Implement metrics export in multiple formats:

```typescript
// Metrics export formats
export enum MetricFormat {
  PROMETHEUS = 'prometheus',
  JSON = 'json',
  INFLUXDB = 'influxdb',
  STATSD = 'statsd'
}

// Metrics exporter
export class MetricsExporter {
  constructor(private collector: MetricsCollector);
  
  // Format-specific exporters
  exportPrometheus(): string;
  exportJSON(): string;
  exportInfluxDB(): string;
  exportStatsD(): string[];
  
  // Export endpoints
  createPrometheusEndpoint(): Express.RequestHandler;
  createHealthEndpoint(): Express.RequestHandler;
  createMetricsApiEndpoint(): Express.RequestHandler;
}

// Metrics aggregation
export class MetricsAggregator {
  constructor(private collector: MetricsCollector);
  
  // Time-based aggregation
  aggregateByTime(
    metricName: string,
    timeRange: TimeRange,
    granularity: TimeGranularity
  ): AggregatedMetric[];
  
  // Label-based aggregation
  aggregateByLabels(
    metricName: string,
    groupByLabels: string[]
  ): Record<string, number>;
  
  // Statistical aggregation
  calculatePercentiles(
    metricName: string,
    percentiles: number[]
  ): Record<number, number>;
  
  // Trend analysis
  calculateTrend(
    metricName: string,
    timeRange: TimeRange
  ): TrendAnalysis;
}

// Integration with external systems
export class MetricsIntegration {
  constructor(
    private exporter: MetricsExporter,
    private config: MetricsConfig
  );
  
  // Push metrics to external systems
  async pushToPrometheus(): Promise<void>;
  async pushToInfluxDB(): Promise<void>;
  async pushToCloudWatch(): Promise<void>;
  async pushToDatadog(): Promise<void>;
  
  // Pull-based integration
  startPrometheusServer(port: number): void;
  createPrometheusRegistry(): any; // prometheus-client registry
}
```

### 6. Alerting and Notification System
Implement alerting based on metrics:

```typescript
// Alerting rules and conditions
export interface AlertRule {
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  duration: number; // seconds
  severity: Severity;
  labels: Record<string, string>;
  notifications: NotificationChannel[];
}

export enum AlertCondition {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  RATE_INCREASE = 'rate_increase',
  RATE_DECREASE = 'rate_decrease'
}

// Alert manager
export class AlertManager {
  private rules: Map<string, AlertRule>;
  private activeAlerts: Map<string, ActiveAlert>;
  
  constructor(
    private metrics: MetricsCollector,
    private notificationService: NotificationService
  );
  
  // Rule management
  addRule(rule: AlertRule): void;
  removeRule(ruleName: string): void;
  updateRule(ruleName: string, rule: AlertRule): void;
  
  // Alert evaluation
  evaluateRules(): Promise<void>;
  evaluateRule(rule: AlertRule): Promise<boolean>;
  
  // Alert lifecycle
  private triggerAlert(rule: AlertRule, value: number): void;
  private resolveAlert(alertId: string): void;
  
  // Alert status
  getActiveAlerts(): ActiveAlert[];
  getAlertHistory(timeRange: TimeRange): AlertEvent[];
}

// Pre-configured alert rules
export const DefaultAlertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    description: 'Error rate exceeds 5%',
    metric: ApplicationMetrics.ERROR_RATE,
    condition: AlertCondition.GREATER_THAN,
    threshold: 0.05,
    duration: 300,
    severity: Severity.ERROR,
    labels: { team: 'platform' },
    notifications: ['email', 'slack']
  },
  {
    name: 'slow_tool_execution',
    description: 'Tool execution time exceeds 30 seconds',
    metric: ApplicationMetrics.MCP_TOOL_DURATION,
    condition: AlertCondition.GREATER_THAN,
    threshold: 30,
    duration: 60,
    severity: Severity.WARNING,
    labels: { component: 'mcp-tools' },
    notifications: ['slack']
  },
  {
    name: 'database_connection_exhaustion',
    description: 'Available database connections below 5',
    metric: SystemMetrics.DATABASE_CONNECTIONS_ACTIVE,
    condition: AlertCondition.GREATER_THAN,
    threshold: 15, // Alert when > 15 out of 20 connections used
    duration: 120,
    severity: Severity.CRITICAL,
    labels: { component: 'database' },
    notifications: ['email', 'slack', 'pagerduty']
  }
];
```

## File Structure
```
src/shared/metrics/
├── collector.ts           # Core metrics collection system
├── definitions.ts         # Metric definitions and constants
├── performance-monitor.ts # Application performance monitoring
├── business-metrics.ts    # Business intelligence metrics
├── system-health.ts       # System health monitoring
├── exporter.ts           # Metrics export functionality
├── aggregator.ts         # Metrics aggregation and analysis
├── integration.ts        # External system integration
├── alerting.ts           # Alert management and rules
├── types.ts             # TypeScript type definitions
└── index.ts             # Main exports
```

## Advanced Features

### 1. Custom Metric Types
```typescript
// Custom metric implementations
export class CustomHistogram {
  private buckets: Map<number, number>;
  private sum: number = 0;
  private count: number = 0;
  
  constructor(buckets: number[]);
  observe(value: number): void;
  getPercentile(p: number): number;
  export(): HistogramData;
}

export class RollingCounter {
  private windows: number[];
  private currentIndex: number = 0;
  private windowSize: number;
  
  constructor(windowCount: number, windowSizeMs: number);
  increment(value: number = 1): void;
  getRate(): number; // per second
  getRollingSum(): number;
}
```

### 2. Metrics Middleware Integration
```typescript
// Express middleware for automatic metrics collection
export function createMetricsMiddleware(
  collector: MetricsCollector
): Express.RequestHandler {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const labels = {
        method: req.method,
        route: req.route?.path || 'unknown',
        status_code: res.statusCode.toString()
      };
      
      collector.increment(ApplicationMetrics.HTTP_REQUESTS_TOTAL, labels);
      collector.observe(ApplicationMetrics.HTTP_REQUEST_DURATION, duration, labels);
    });
    
    next();
  };
}
```

### 3. Metrics Dashboard Data
```typescript
// Dashboard data provider
export class MetricsDashboard {
  constructor(private aggregator: MetricsAggregator);
  
  async getSystemOverview(): Promise<SystemOverviewData>;
  async getPerformanceMetrics(): Promise<PerformanceMetricsData>;
  async getBusinessMetrics(): Promise<BusinessMetricsData>;
  async getAlertStatus(): Promise<AlertStatusData>;
  
  // Real-time metrics for dashboard
  async streamMetrics(callback: (data: MetricsSnapshot) => void): Promise<void>;
}
```

## Success Criteria
- [ ] Complete metrics collection system with all metric types
- [ ] Performance monitoring for all application components
- [ ] Business intelligence metrics for project insights
- [ ] System health monitoring with automated checks
- [ ] Multiple export formats (Prometheus, JSON, InfluxDB)
- [ ] Alerting system with configurable rules
- [ ] Integration with external monitoring systems
- [ ] Real-time metrics streaming capabilities

## Quality Standards
- Minimal performance overhead (<1% CPU impact)
- Thread-safe metric operations
- Configurable metric retention policies
- Proper error handling for metric collection failures
- Comprehensive documentation with examples
- Memory-efficient storage for high-cardinality metrics
- Support for metric sampling and downsampling

## Testing Requirements
- Unit tests for all metric operations
- Performance benchmarks for metric collection
- Integration tests with external systems
- Load testing for high-volume metric scenarios
- Alert rule validation tests
- Dashboard data accuracy tests

## Output Format
Implement the complete metrics collection framework with:
1. Core metrics collector with all metric types
2. Performance monitoring middleware and wrappers
3. Business metrics collection system
4. System health monitoring and checks
5. Export functionality for multiple formats
6. Alerting and notification system
7. Integration examples with monitoring platforms
8. Comprehensive test suite and documentation

Focus on creating a production-ready metrics system that provides comprehensive observability while maintaining excellent performance and reliability.