# Implementation Prompt 032: Monitoring and Observability (4.3.2)

## Persona
You are a **Observability and SRE Engineer** with 15+ years of experience in building enterprise observability platforms, distributed system monitoring, and site reliability engineering solutions. You specialize in creating comprehensive observability systems that provide deep insights into system behavior, performance, and reliability across complex distributed architectures.

## Context: Interactive BDUF Orchestrator
You are implementing **Monitoring and Observability** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The Monitoring and Observability system you're building will be a critical component that:

1. **Provides comprehensive system observability** across all orchestration components and workflows
2. **Implements distributed tracing** for complex multi-service orchestration workflows
3. **Enables proactive monitoring** with intelligent alerting and anomaly detection
4. **Supports performance optimization** through detailed metrics and profiling
5. **Ensures system reliability** through SLA monitoring and incident response
6. **Provides business insights** through custom metrics and analytics dashboards

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle observability data from distributed orchestration clusters
- **Quality**: 95%+ test coverage, comprehensive error handling
- **Performance**: High-throughput observability with minimal system impact

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/monitoring-observability

# Regular commits with descriptive messages
git add .
git commit -m "feat(orchestration): implement monitoring and observability

- Add comprehensive distributed tracing and metrics collection
- Implement intelligent alerting and anomaly detection
- Create observability dashboards and analytics
- Add SLA monitoring and incident response automation
- Implement performance profiling and optimization tools"

# Push and create PR
git push origin feature/monitoring-observability
```

### Commit Message Format
```
<type>(orchestration): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any monitoring and observability components, you MUST use Context7 to research current best practices:

```typescript
// Research observability frameworks and platforms
await context7.getLibraryDocs('/open-telemetry/opentelemetry-js');
await context7.getLibraryDocs('/prometheus/client_nodejs');
await context7.getLibraryDocs('/jaegertracing/jaeger-client-node');

// Research APM and monitoring solutions
await context7.getLibraryDocs('/datadog/dd-trace-js');
await context7.getLibraryDocs('/newrelic/node-newrelic');
await context7.getLibraryDocs('/elastic/apm-agent-nodejs');

// Research logging and analytics
await context7.getLibraryDocs('/winstonjs/winston');
await context7.getLibraryDocs('/pino-js/pino');
```

## Implementation Requirements

### 1. Core Observability Architecture

Create a comprehensive observability system:

```typescript
// src/core/orchestration/ObservabilityEngine.ts
export interface ObservabilityConfig {
  tracing: {
    enableDistributedTracing: boolean;
    tracingProvider: TracingProvider;
    samplingRate: number;
    enableContextPropagation: boolean;
    traceExporters: TraceExporter[];
  };
  metrics: {
    enableMetrics: boolean;
    metricsProvider: MetricsProvider;
    collectionInterval: number;
    enableCustomMetrics: boolean;
    metricExporters: MetricExporter[];
  };
  logging: {
    enableStructuredLogging: boolean;
    logLevel: LogLevel;
    loggingProvider: LoggingProvider;
    enableLogCorrelation: boolean;
    logExporters: LogExporter[];
  };
  alerting: {
    enableIntelligentAlerting: boolean;
    alertingProvider: AlertingProvider;
    anomalyDetection: AnomalyDetectionConfig;
    escalationPolicies: EscalationPolicy[];
  };
  dashboards: {
    enableObservabilityDashboards: boolean;
    dashboardProvider: DashboardProvider;
    customDashboards: CustomDashboard[];
    enableRealTimeUpdates: boolean;
  };
  profiling: {
    enableContinuousProfiling: boolean;
    profilingProvider: ProfilingProvider;
    profileTypes: ProfileType[];
    samplingConfig: ProfilingSamplingConfig;
  };
}

export interface ObservabilityContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Map<string, string>;
  tags: Map<string, any>;
  logs: ContextLog[];
  metrics: ContextMetrics;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: ObservabilityStatus;
}

export enum ObservabilityStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

export interface DistributedTrace {
  traceId: string;
  rootSpan: TraceSpan;
  spans: TraceSpan[];
  services: ServiceInfo[];
  duration: number;
  status: TraceStatus;
  tags: Map<string, any>;
  events: TraceEvent[];
  errors: TraceError[];
  metadata: TraceMetadata;
}

export interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Map<string, any>;
  logs: SpanLog[];
  status: SpanStatus;
  kind: SpanKind;
  context: SpanContext;
}

export enum SpanKind {
  INTERNAL = 'internal',
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer'
}

export interface ObservabilityMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  tags: Map<string, string>;
  timestamp: Date;
  service: string;
  namespace: string;
  description: string;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  TIMER = 'timer'
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  threshold: AlertThreshold;
  evaluationWindow: number;
  cooldownPeriod: number;
  enabled: boolean;
  tags: Map<string, string>;
  notifications: NotificationTarget[];
}

export interface AnomalyDetection {
  algorithmType: AnomalyAlgorithm;
  sensitivity: number;
  trainigPeriod: number;
  detectionWindow: number;
  baselineMetrics: string[];
  enableSeasonalAdjustment: boolean;
  falsePositiveRate: number;
}

export enum AnomalyAlgorithm {
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  ISOLATION_FOREST = 'isolation_forest',
  AUTOENCODER = 'autoencoder',
  PROPHET = 'prophet'
}

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  service: string;
  slos: SLO[];
  errorBudget: ErrorBudget;
  alerting: SLAAlertingConfig;
  reporting: SLAReportingConfig;
}

export interface SLO {
  id: string;
  name: string;
  description: string;
  type: SLOType;
  target: number;
  timeWindow: TimeWindow;
  metric: SLOMetric;
  filters: SLOFilter[];
}

export enum SLOType {
  AVAILABILITY = 'availability',
  LATENCY = 'latency',
  ERROR_RATE = 'error_rate',
  THROUGHPUT = 'throughput',
  CUSTOM = 'custom'
}

export class ObservabilityEngine {
  private tracingSystem: TracingSystem;
  private metricsSystem: MetricsSystem;
  private loggingSystem: LoggingSystem;
  private alertingSystem: AlertingSystem;
  private dashboardSystem: DashboardSystem;
  private profilingSystem: ProfilingSystem;
  private anomalyDetector: AnomalyDetector;
  private slaMonitor: SLAMonitor;
  private incidentManager: IncidentManager;
  private observabilityData: ObservabilityDataStore;

  constructor(
    private config: ObservabilityConfig,
    private logger: Logger,
    private context7Client: Context7Client
  ) {
    this.setupObservabilityComponents();
    this.initializeProviders();
    this.startBackgroundProcesses();
  }

  async startObservation(
    operationName: string,
    serviceName: string,
    parentContext?: ObservabilityContext
  ): Promise<ObservabilityContext> {
    try {
      // Generate trace and span IDs
      const traceId = parentContext?.traceId || generateTraceId();
      const spanId = generateSpanId();
      const parentSpanId = parentContext?.spanId;

      // Create observability context
      const context: ObservabilityContext = {
        traceId,
        spanId,
        parentSpanId,
        baggage: new Map(parentContext?.baggage || []),
        tags: new Map(),
        logs: [],
        metrics: this.initializeContextMetrics(),
        startTime: new Date(),
        status: ObservabilityStatus.ACTIVE
      };

      // Start distributed trace span
      const span = await this.tracingSystem.startSpan(
        operationName,
        serviceName,
        context
      );

      // Initialize metrics collection
      await this.metricsSystem.startMetricsCollection(context);

      // Setup logging correlation
      await this.loggingSystem.setupLogCorrelation(context);

      // Start profiling if enabled
      if (this.config.profiling.enableContinuousProfiling) {
        await this.profilingSystem.startProfiling(context);
      }

      this.logger.info('Observability context started', {
        traceId: context.traceId,
        spanId: context.spanId,
        operationName,
        serviceName
      });

      return context;

    } catch (error) {
      this.logger.error('Failed to start observability context', { 
        error, 
        operationName, 
        serviceName 
      });
      throw new ObservabilityError('Failed to start observability context', error);
    }
  }

  async recordMetric(
    context: ObservabilityContext,
    metricName: string,
    value: number,
    type: MetricType = MetricType.GAUGE,
    tags: Map<string, string> = new Map()
  ): Promise<void> {
    try {
      const metric: ObservabilityMetric = {
        name: metricName,
        type,
        value,
        unit: this.getMetricUnit(metricName, type),
        tags: new Map([...context.tags, ...tags]),
        timestamp: new Date(),
        service: this.extractServiceName(context),
        namespace: this.extractNamespace(context),
        description: this.getMetricDescription(metricName)
      };

      // Record metric in metrics system
      await this.metricsSystem.recordMetric(metric, context);

      // Add to context metrics
      context.metrics[metricName] = value;

      // Check for alert conditions
      await this.checkMetricAlerts(metric, context);

      // Update anomaly detection
      await this.anomalyDetector.updateAnomalyDetection(metric);

      this.logger.debug('Metric recorded', {
        traceId: context.traceId,
        spanId: context.spanId,
        metricName,
        value,
        type
      });

    } catch (error) {
      this.logger.error('Failed to record metric', { 
        error, 
        context: context.traceId, 
        metricName 
      });
    }
  }

  async addSpanEvent(
    context: ObservabilityContext,
    eventName: string,
    attributes: Map<string, any> = new Map()
  ): Promise<void> {
    try {
      const event: SpanEvent = {
        name: eventName,
        attributes,
        timestamp: new Date()
      };

      // Add event to tracing system
      await this.tracingSystem.addSpanEvent(context, event);

      // Log the event
      const logEntry: ContextLog = {
        level: LogLevel.INFO,
        message: `Span event: ${eventName}`,
        timestamp: new Date(),
        attributes: Object.fromEntries(attributes)
      };
      context.logs.push(logEntry);

      await this.loggingSystem.log(logEntry, context);

    } catch (error) {
      this.logger.error('Failed to add span event', { 
        error, 
        context: context.traceId, 
        eventName 
      });
    }
  }

  async recordError(
    context: ObservabilityContext,
    error: Error,
    attributes: Map<string, any> = new Map()
  ): Promise<void> {
    try {
      // Record error in tracing system
      await this.tracingSystem.recordError(context, error, attributes);

      // Record error metric
      await this.recordMetric(
        context,
        'errors.count',
        1,
        MetricType.COUNTER,
        new Map([
          ['error.type', error.constructor.name],
          ['error.message', error.message]
        ])
      );

      // Log error
      const errorLog: ContextLog = {
        level: LogLevel.ERROR,
        message: error.message,
        timestamp: new Date(),
        attributes: {
          'error.name': error.name,
          'error.stack': error.stack,
          ...Object.fromEntries(attributes)
        }
      };
      context.logs.push(errorLog);

      await this.loggingSystem.log(errorLog, context);

      // Trigger error-based alerts
      await this.triggerErrorAlert(context, error);

      this.logger.error('Error recorded in observability context', {
        traceId: context.traceId,
        spanId: context.spanId,
        error: error.message
      });

    } catch (observabilityError) {
      this.logger.error('Failed to record error in observability', { 
        observabilityError, 
        originalError: error,
        context: context.traceId 
      });
    }
  }

  async completeObservation(
    context: ObservabilityContext,
    status: ObservabilityStatus = ObservabilityStatus.COMPLETED
  ): Promise<DistributedTrace> {
    try {
      const endTime = new Date();
      const duration = endTime.getTime() - context.startTime.getTime();

      // Update context
      context.endTime = endTime;
      context.duration = duration;
      context.status = status;

      // Complete tracing span
      const completedSpan = await this.tracingSystem.completeSpan(context, status);

      // Stop metrics collection
      await this.metricsSystem.stopMetricsCollection(context);

      // Stop profiling
      if (this.config.profiling.enableContinuousProfiling) {
        await this.profilingSystem.stopProfiling(context);
      }

      // Generate distributed trace
      const trace = await this.generateDistributedTrace(context, completedSpan);

      // Store observability data
      await this.observabilityData.storeTrace(trace);
      await this.observabilityData.storeMetrics(context.metrics, context);

      // Update SLA metrics
      await this.slaMonitor.updateSLAMetrics(context, duration, status);

      this.logger.info('Observability context completed', {
        traceId: context.traceId,
        spanId: context.spanId,
        duration,
        status
      });

      return trace;

    } catch (error) {
      this.logger.error('Failed to complete observability context', { 
        error, 
        context: context.traceId 
      });
      throw error;
    }
  }

  async queryTraces(
    traceQuery: TraceQuery
  ): Promise<TraceQueryResult> {
    try {
      // Query traces from storage
      const traces = await this.observabilityData.queryTraces(traceQuery);

      // Analyze trace patterns
      const analysis = await this.analyzeTracePatterns(traces);

      // Generate insights
      const insights = await this.generateTraceInsights(traces, analysis);

      return {
        traces,
        analysis,
        insights,
        totalCount: traces.length,
        queryExecutionTime: Date.now()
      };

    } catch (error) {
      this.logger.error('Failed to query traces', { error, traceQuery });
      throw error;
    }
  }

  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    try {
      // Collect current system metrics
      const currentMetrics = await this.metricsSystem.getCurrentSystemMetrics();

      // Get SLA status
      const slaStatus = await this.slaMonitor.getCurrentSLAStatus();

      // Get active alerts
      const activeAlerts = await this.alertingSystem.getActiveAlerts();

      // Check for anomalies
      const anomalies = await this.anomalyDetector.getCurrentAnomalies();

      // Calculate overall health score
      const healthScore = await this.calculateSystemHealthScore(
        currentMetrics,
        slaStatus,
        activeAlerts,
        anomalies
      );

      return {
        healthScore,
        metrics: currentMetrics,
        slaStatus,
        activeAlerts,
        anomalies,
        recommendations: await this.generateHealthRecommendations(healthScore),
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Failed to get system health metrics', { error });
      throw error;
    }
  }

  // Private implementation methods
  private setupObservabilityComponents(): void {
    // Setup tracing system
    this.tracingSystem = new TracingSystem(
      this.config.tracing,
      this.logger
    );

    // Setup metrics system
    this.metricsSystem = new MetricsSystem(
      this.config.metrics,
      this.logger
    );

    // Setup logging system
    this.loggingSystem = new LoggingSystem(
      this.config.logging,
      this.logger
    );

    // Setup alerting system
    this.alertingSystem = new AlertingSystem(
      this.config.alerting,
      this.logger
    );

    // Setup dashboard system
    this.dashboardSystem = new DashboardSystem(
      this.config.dashboards,
      this.logger
    );

    // Setup profiling system
    this.profilingSystem = new ProfilingSystem(
      this.config.profiling,
      this.logger
    );

    // Setup anomaly detector
    this.anomalyDetector = new AnomalyDetector(
      this.config.alerting.anomalyDetection,
      this.logger
    );

    // Setup SLA monitor
    this.slaMonitor = new SLAMonitor(
      this.config,
      this.logger
    );

    // Setup incident manager
    this.incidentManager = new IncidentManager(
      this.config,
      this.logger
    );

    // Setup observability data store
    this.observabilityData = new ObservabilityDataStore(
      this.config,
      this.logger
    );
  }

  private initializeProviders(): void {
    // Initialize tracing providers based on configuration
    if (this.config.tracing.tracingProvider === TracingProvider.JAEGER) {
      this.tracingSystem.initializeJaeger();
    } else if (this.config.tracing.tracingProvider === TracingProvider.ZIPKIN) {
      this.tracingSystem.initializeZipkin();
    }

    // Initialize metrics providers
    if (this.config.metrics.metricsProvider === MetricsProvider.PROMETHEUS) {
      this.metricsSystem.initializePrometheus();
    } else if (this.config.metrics.metricsProvider === MetricsProvider.DATADOG) {
      this.metricsSystem.initializeDatadog();
    }

    // Initialize logging providers
    if (this.config.logging.loggingProvider === LoggingProvider.ELASTICSEARCH) {
      this.loggingSystem.initializeElasticsearch();
    } else if (this.config.logging.loggingProvider === LoggingProvider.SPLUNK) {
      this.loggingSystem.initializeSplunk();
    }
  }

  private startBackgroundProcesses(): void {
    // Start metrics collection
    setInterval(async () => {
      await this.metricsSystem.collectSystemMetrics();
    }, this.config.metrics.collectionInterval);

    // Start alert evaluation
    setInterval(async () => {
      await this.alertingSystem.evaluateAlerts();
    }, 30000); // Every 30 seconds

    // Start anomaly detection
    setInterval(async () => {
      await this.anomalyDetector.detectAnomalies();
    }, 60000); // Every minute

    // Start SLA monitoring
    setInterval(async () => {
      await this.slaMonitor.evaluateSLAs();
    }, 300000); // Every 5 minutes

    // Start dashboard updates
    if (this.config.dashboards.enableRealTimeUpdates) {
      setInterval(async () => {
        await this.dashboardSystem.updateDashboards();
      }, 10000); // Every 10 seconds
    }
  }

  private async generateDistributedTrace(
    context: ObservabilityContext,
    completedSpan: TraceSpan
  ): Promise<DistributedTrace> {
    // Get all related spans for the trace
    const allSpans = await this.tracingSystem.getTraceSpans(context.traceId);

    // Identify services involved
    const services = this.extractServicesFromSpans(allSpans);

    // Calculate trace duration
    const duration = context.duration || 0;

    // Determine trace status
    const status = this.determineTraceStatus(allSpans);

    // Extract trace events and errors
    const events = this.extractTraceEvents(allSpans);
    const errors = this.extractTraceErrors(allSpans);

    return {
      traceId: context.traceId,
      rootSpan: completedSpan,
      spans: allSpans,
      services,
      duration,
      status,
      tags: context.tags,
      events,
      errors,
      metadata: {
        spanCount: allSpans.length,
        serviceCount: services.length,
        errorCount: errors.length,
        generatedAt: new Date()
      }
    };
  }

  private initializeContextMetrics(): ContextMetrics {
    return {
      'operation.duration': 0,
      'operation.count': 1,
      'errors.count': 0,
      'memory.usage': 0,
      'cpu.usage': 0
    };
  }

  private async checkMetricAlerts(
    metric: ObservabilityMetric,
    context: ObservabilityContext
  ): Promise<void> {
    // Get alert rules for this metric
    const alertRules = await this.alertingSystem.getAlertRulesForMetric(metric.name);

    for (const rule of alertRules) {
      if (rule.enabled && this.evaluateAlertCondition(rule, metric)) {
        await this.alertingSystem.triggerAlert(rule, metric, context);
      }
    }
  }

  private evaluateAlertCondition(
    rule: AlertRule,
    metric: ObservabilityMetric
  ): boolean {
    switch (rule.condition.operator) {
      case 'greater_than':
        return metric.value > rule.threshold.value;
      case 'less_than':
        return metric.value < rule.threshold.value;
      case 'equals':
        return metric.value === rule.threshold.value;
      case 'not_equals':
        return metric.value !== rule.threshold.value;
      default:
        return false;
    }
  }

  private async calculateSystemHealthScore(
    metrics: SystemMetrics,
    slaStatus: SLAStatus,
    alerts: Alert[],
    anomalies: Anomaly[]
  ): Promise<number> {
    let score = 100;

    // Deduct for SLA violations
    const slaViolations = slaStatus.violations.length;
    score -= slaViolations * 10;

    // Deduct for active alerts
    const criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    const highAlerts = alerts.filter(a => a.severity === AlertSeverity.HIGH).length;
    score -= criticalAlerts * 15 + highAlerts * 10;

    // Deduct for anomalies
    score -= anomalies.length * 5;

    // Consider resource utilization
    if (metrics.cpu.usage > 80) score -= 10;
    if (metrics.memory.usage > 80) score -= 10;
    if (metrics.disk.usage > 90) score -= 15;

    return Math.max(0, Math.min(100, score));
  }
}
```

### 2. Distributed Tracing System

```typescript
// src/core/orchestration/TracingSystem.ts
export class TracingSystem {
  private tracer: Tracer;
  private spanStorage: SpanStorage;
  private contextPropagator: ContextPropagator;

  constructor(
    private config: TracingConfig,
    private logger: Logger
  ) {
    this.setupTracer();
    this.spanStorage = new SpanStorage(config);
    this.contextPropagator = new ContextPropagator();
  }

  async startSpan(
    operationName: string,
    serviceName: string,
    context: ObservabilityContext
  ): Promise<TraceSpan> {
    try {
      const span: TraceSpan = {
        spanId: context.spanId,
        traceId: context.traceId,
        parentSpanId: context.parentSpanId,
        operationName,
        serviceName,
        startTime: context.startTime,
        tags: new Map([
          ['service.name', serviceName],
          ['operation.name', operationName],
          ['trace.id', context.traceId],
          ['span.id', context.spanId]
        ]),
        logs: [],
        status: SpanStatus.ACTIVE,
        kind: this.determineSpanKind(operationName),
        context: this.createSpanContext(context)
      };

      // Start span in tracer
      await this.tracer.startSpan(span);

      // Store span
      await this.spanStorage.storeSpan(span);

      return span;

    } catch (error) {
      this.logger.error('Failed to start span', { error, operationName });
      throw error;
    }
  }

  async completeSpan(
    context: ObservabilityContext,
    status: ObservabilityStatus
  ): Promise<TraceSpan> {
    try {
      const span = await this.spanStorage.getSpan(context.spanId);
      if (!span) {
        throw new Error(`Span not found: ${context.spanId}`);
      }

      // Update span
      span.endTime = context.endTime;
      span.duration = context.duration;
      span.status = this.mapObservabilityStatusToSpanStatus(status);

      // Add final tags
      span.tags.set('duration', context.duration || 0);
      span.tags.set('status', status);

      // Complete span in tracer
      await this.tracer.completeSpan(span);

      // Update storage
      await this.spanStorage.updateSpan(span);

      return span;

    } catch (error) {
      this.logger.error('Failed to complete span', { error, context: context.traceId });
      throw error;
    }
  }

  async addSpanEvent(
    context: ObservabilityContext,
    event: SpanEvent
  ): Promise<void> {
    try {
      const span = await this.spanStorage.getSpan(context.spanId);
      if (span) {
        const spanLog: SpanLog = {
          timestamp: event.timestamp,
          fields: Object.fromEntries(event.attributes),
          message: event.name
        };
        span.logs.push(spanLog);
        await this.spanStorage.updateSpan(span);
      }

    } catch (error) {
      this.logger.error('Failed to add span event', { error, event });
    }
  }

  async recordError(
    context: ObservabilityContext,
    error: Error,
    attributes: Map<string, any>
  ): Promise<void> {
    try {
      const span = await this.spanStorage.getSpan(context.spanId);
      if (span) {
        // Add error tags
        span.tags.set('error', true);
        span.tags.set('error.kind', error.constructor.name);
        span.tags.set('error.message', error.message);

        // Add error log
        const errorLog: SpanLog = {
          timestamp: new Date(),
          fields: {
            'error.object': error.toString(),
            'error.stack': error.stack,
            ...Object.fromEntries(attributes)
          },
          message: `Error: ${error.message}`
        };
        span.logs.push(errorLog);

        // Update span status
        span.status = SpanStatus.ERROR;

        await this.spanStorage.updateSpan(span);
      }

    } catch (tracingError) {
      this.logger.error('Failed to record error in span', { tracingError, error });
    }
  }

  async getTraceSpans(traceId: string): Promise<TraceSpan[]> {
    return await this.spanStorage.getTraceSpans(traceId);
  }

  private setupTracer(): void {
    // Setup tracer based on configuration
    if (this.config.tracingProvider === TracingProvider.OPENTELEMETRY) {
      this.tracer = new OpenTelemetryTracer(this.config, this.logger);
    } else if (this.config.tracingProvider === TracingProvider.JAEGER) {
      this.tracer = new JaegerTracer(this.config, this.logger);
    } else {
      this.tracer = new NoOpTracer();
    }
  }

  private determineSpanKind(operationName: string): SpanKind {
    if (operationName.includes('http') || operationName.includes('request')) {
      return SpanKind.CLIENT;
    } else if (operationName.includes('handler') || operationName.includes('endpoint')) {
      return SpanKind.SERVER;
    } else if (operationName.includes('publish') || operationName.includes('send')) {
      return SpanKind.PRODUCER;
    } else if (operationName.includes('consume') || operationName.includes('receive')) {
      return SpanKind.CONSUMER;
    }
    return SpanKind.INTERNAL;
  }

  private createSpanContext(context: ObservabilityContext): SpanContext {
    return {
      traceId: context.traceId,
      spanId: context.spanId,
      traceFlags: 1, // Sampled
      baggage: context.baggage
    };
  }

  private mapObservabilityStatusToSpanStatus(status: ObservabilityStatus): SpanStatus {
    switch (status) {
      case ObservabilityStatus.COMPLETED:
        return SpanStatus.OK;
      case ObservabilityStatus.ERROR:
        return SpanStatus.ERROR;
      case ObservabilityStatus.TIMEOUT:
        return SpanStatus.TIMEOUT;
      case ObservabilityStatus.CANCELLED:
        return SpanStatus.CANCELLED;
      default:
        return SpanStatus.UNKNOWN;
    }
  }
}
```

## File Structure

```
src/core/orchestration/
├── index.ts                              # Main exports
├── ObservabilityEngine.ts                # Core observability engine
├── TracingSystem.ts                      # Distributed tracing system
├── MetricsSystem.ts                      # Metrics collection and management
├── LoggingSystem.ts                      # Structured logging system
├── AlertingSystem.ts                     # Intelligent alerting system
├── DashboardSystem.ts                    # Observability dashboards
├── ProfilingSystem.ts                    # Continuous profiling
├── types/
│   ├── index.ts
│   ├── observability.ts                  # Observability type definitions
│   ├── tracing.ts                        # Tracing type definitions
│   ├── metrics.ts                        # Metrics type definitions
│   ├── logging.ts                        # Logging type definitions
│   ├── alerting.ts                       # Alerting type definitions
│   └── profiling.ts                      # Profiling type definitions
├── tracing/
│   ├── index.ts
│   ├── Tracer.ts                         # Base tracer interface
│   ├── OpenTelemetryTracer.ts            # OpenTelemetry tracer implementation
│   ├── JaegerTracer.ts                   # Jaeger tracer implementation
│   ├── SpanStorage.ts                    # Span storage and retrieval
│   ├── ContextPropagator.ts              # Context propagation
│   └── TraceAnalyzer.ts                  # Trace analysis and insights
├── metrics/
│   ├── index.ts
│   ├── MetricsCollector.ts               # Metrics collection
│   ├── MetricsExporter.ts                # Metrics export to external systems
│   ├── PrometheusExporter.ts             # Prometheus metrics export
│   ├── DatadogExporter.ts                # Datadog metrics export
│   ├── CustomMetricsRegistry.ts          # Custom metrics registry
│   └── MetricsAggregator.ts              # Metrics aggregation
├── logging/
│   ├── index.ts
│   ├── StructuredLogger.ts               # Structured logging implementation
│   ├── LogCorrelator.ts                  # Log correlation with traces
│   ├── LogExporter.ts                    # Log export to external systems
│   ├── ElasticsearchExporter.ts          # Elasticsearch log export
│   └── SplunkExporter.ts                 # Splunk log export
├── alerting/
│   ├── index.ts
│   ├── AlertEvaluator.ts                 # Alert condition evaluation
│   ├── AnomalyDetector.ts                # Anomaly detection system
│   ├── AlertNotifier.ts                  # Alert notification system
│   ├── EscalationManager.ts              # Alert escalation management
│   └── IncidentManager.ts                # Incident management
├── dashboards/
│   ├── index.ts
│   ├── DashboardBuilder.ts               # Dashboard building and management
│   ├── DashboardDataProvider.ts          # Dashboard data providers
│   ├── VisualizationEngine.ts            # Data visualization engine
│   └── RealTimeUpdater.ts                # Real-time dashboard updates
├── profiling/
│   ├── index.ts
│   ├── ContinuousProfiler.ts             # Continuous profiling system
│   ├── PerformanceProfiler.ts            # Performance profiling
│   ├── MemoryProfiler.ts                 # Memory profiling
│   ├── CPUProfiler.ts                    # CPU profiling
│   └── ProfileAnalyzer.ts                # Profile analysis and insights
├── sla/
│   ├── index.ts
│   ├── SLAMonitor.ts                     # SLA monitoring system
│   ├── SLOEvaluator.ts                   # SLO evaluation
│   ├── ErrorBudgetTracker.ts             # Error budget tracking
│   └── SLAReporter.ts                    # SLA reporting
├── storage/
│   ├── index.ts
│   ├── ObservabilityDataStore.ts         # Observability data storage
│   ├── TraceStorage.ts                   # Trace data storage
│   ├── MetricsStorage.ts                 # Metrics data storage
│   ├── LogStorage.ts                     # Log data storage
│   └── ProfileStorage.ts                 # Profile data storage
├── analysis/
│   ├── index.ts
│   ├── PerformanceAnalyzer.ts            # Performance analysis
│   ├── TrendAnalyzer.ts                  # Trend analysis
│   ├── PatternDetector.ts                # Pattern detection
│   ├── BottleneckIdentifier.ts           # Bottleneck identification
│   └── InsightGenerator.ts               # Insight generation
├── integration/
│   ├── index.ts
│   ├── PrometheusIntegration.ts          # Prometheus integration
│   ├── GrafanaIntegration.ts             # Grafana integration
│   ├── ElasticsearchIntegration.ts       # Elasticsearch integration
│   ├── JaegerIntegration.ts              # Jaeger integration
│   ├── DatadogIntegration.ts             # Datadog integration
│   └── NewRelicIntegration.ts            # New Relic integration
├── utils/
│   ├── index.ts
│   ├── ObservabilityUtils.ts             # Observability utilities
│   ├── TracingUtils.ts                   # Tracing utilities
│   ├── MetricsUtils.ts                   # Metrics utilities
│   ├── LoggingUtils.ts                   # Logging utilities
│   └── AlertingUtils.ts                  # Alerting utilities
└── __tests__/
    ├── unit/
    │   ├── ObservabilityEngine.test.ts
    │   ├── TracingSystem.test.ts
    │   ├── MetricsSystem.test.ts
    │   ├── AlertingSystem.test.ts
    │   └── ProfilingSystem.test.ts
    ├── integration/
    │   ├── observability-integration.test.ts
    │   ├── tracing-integration.test.ts
    │   ├── metrics-integration.test.ts
    │   └── alerting-integration.test.ts
    ├── performance/
    │   ├── observability-overhead.test.ts
    │   ├── tracing-performance.test.ts
    │   └── metrics-performance.test.ts
    └── fixtures/
        ├── test-traces.json
        ├── test-metrics.json
        ├── test-alerts.json
        └── test-profiles.json
```

## Success Criteria

### Functional Requirements
1. **Comprehensive Observability**: Full visibility into system behavior and performance
2. **Distributed Tracing**: End-to-end tracing across complex orchestration workflows
3. **Intelligent Alerting**: Smart alerting with anomaly detection and escalation
4. **Performance Monitoring**: Detailed performance metrics and profiling
5. **SLA Monitoring**: Service level agreement monitoring and reporting
6. **Real-time Dashboards**: Rich dashboards with real-time data visualization
7. **Incident Management**: Automated incident detection and response

### Technical Requirements
1. **Low Overhead**: Minimal performance impact on system operations
2. **High Throughput**: Handle observability data from large-scale systems
3. **Real-time Processing**: Real-time data collection and analysis
4. **Scalability**: Linear scaling with system complexity
5. **Integration**: Support for multiple observability backends
6. **Testing**: 95%+ code coverage with comprehensive test scenarios
7. **Documentation**: Complete observability setup and configuration guides

### Quality Standards
1. **Reliability**: Robust observability that doesn't impact system performance
2. **Accuracy**: Precise metrics and tracing with minimal data loss
3. **Usability**: Intuitive dashboards and alerting interfaces
4. **Maintainability**: Clean, extensible observability architecture
5. **Actionability**: Actionable insights and recommendations from observability data

## Output Format

### Implementation Deliverables
1. **Core Engine**: Complete observability engine with all monitoring capabilities
2. **Tracing System**: Comprehensive distributed tracing with multiple backend support
3. **Metrics System**: Advanced metrics collection and analysis system
4. **Alerting System**: Intelligent alerting with anomaly detection
5. **Dashboard System**: Rich observability dashboards with real-time updates
6. **Profiling System**: Continuous profiling for performance optimization
7. **Unit Tests**: Comprehensive test suite with 95%+ coverage

### Documentation Requirements
1. **Architecture Documentation**: System design and observability strategy
2. **API Reference**: Complete observability engine API documentation
3. **Integration Guide**: Integrating with external observability tools
4. **Dashboard Guide**: Creating and configuring observability dashboards
5. **Alerting Guide**: Setting up intelligent alerts and escalation policies
6. **Performance Guide**: Observability system optimization and tuning

### Testing Requirements
1. **Unit Tests**: Test individual observability components
2. **Integration Tests**: Test observability workflows and data flows
3. **Performance Tests**: Measure observability overhead and scalability
4. **Load Tests**: Verify behavior under high observability loads
5. **Alerting Tests**: Validate alert conditions and anomaly detection
6. **Dashboard Tests**: Test dashboard functionality and real-time updates

Remember to leverage Context7 throughout the implementation to ensure you're using the most current observability best practices and optimal tools for enterprise monitoring and observability systems.