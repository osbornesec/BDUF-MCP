# Implementation Prompt 004: Metrics Collection Framework (1.1.2)

## Persona
You are a **Senior Observability Engineer and Performance Architect** with 10+ years of experience in building comprehensive metrics collection systems, application performance monitoring, and observability platforms. You specialize in designing high-performance metrics frameworks that provide deep insights into system behavior while maintaining minimal overhead.

## Context: Interactive BDUF Orchestrator
You are implementing the **Metrics Collection Framework** component as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system will provide comprehensive observability into all aspects of the BDUF orchestration process, enabling performance optimization, troubleshooting, and operational excellence.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Metrics Collection Framework you're building will:

1. **Collect comprehensive metrics** from all system components
2. **Provide real-time monitoring** of BDUF orchestration processes
3. **Enable performance analysis** and optimization opportunities
4. **Support alerting and anomaly detection** for operational excellence
5. **Track business metrics** for ROI analysis and system effectiveness
6. **Maintain high performance** with minimal impact on core system operations

### Technical Context
- **Dependencies**: Integrates with logging system and configuration management
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Core observability foundation for all other components
- **Scalability**: Handle high-volume metrics with efficient aggregation
- **Quality**: 90%+ test coverage, comprehensive error handling and fallbacks

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/metrics-collection-framework

# Regular commits with descriptive messages
git add .
git commit -m "feat(metrics): implement comprehensive metrics collection framework

- Add MetricsCollector with multiple metric types and aggregation
- Implement PerformanceTracker for detailed timing analysis
- Create BusinessMetricsTracker for ROI and effectiveness metrics
- Add MetricsReporter with multiple output formats and destinations
- Implement real-time metrics streaming and alerting capabilities"

# Push and create PR
git push origin feature/metrics-collection-framework
```

### Commit Message Format
```
<type>(metrics): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any metrics components, you MUST use Context7 to research metrics collection patterns and best practices:

```typescript
// Research metrics collection patterns and architectures
await context7.getLibraryDocs('/prometheus/client-node');
await context7.getLibraryDocs('/opentelemetry/opentelemetry-js');
await context7.getLibraryDocs('/metrics/statsd');

// Research observability and monitoring patterns
await context7.getLibraryDocs('/observability/grafana');
await context7.getLibraryDocs('/monitoring/prometheus');
await context7.getLibraryDocs('/tracing/jaeger');

// Research performance monitoring patterns
await context7.getLibraryDocs('/performance/clinic-js');
await context7.getLibraryDocs('/profiling/node-profiler');
await context7.getLibraryDocs('/benchmarking/benchmark-js');
```

## Implementation Requirements

### 1. Core Metrics Collector

Create a comprehensive metrics collection system:

```typescript
// src/shared/metrics/MetricsCollector.ts
export interface MetricsCollector {
  // Counter metrics (increment only)
  increment(name: string, value?: number, tags?: MetricTags): void;
  decrement(name: string, value?: number, tags?: MetricTags): void;
  
  // Gauge metrics (current value)
  gauge(name: string, value: number, tags?: MetricTags): void;
  
  // Histogram metrics (distribution of values)
  histogram(name: string, value: number, tags?: MetricTags): void;
  
  // Timer metrics (measure durations)
  timer(name: string): Timer;
  timing(name: string, duration: number, tags?: MetricTags): void;
  
  // Business metrics
  businessMetric(name: string, value: number, unit: MetricUnit, tags?: MetricTags): void;
  
  // Performance metrics
  performance(name: string, measurement: PerformanceMeasurement): void;
  
  // Custom metrics
  custom(metric: CustomMetric): void;
  
  // Batch operations
  batch(metrics: MetricBatch): void;
  
  // Real-time streaming
  startStreaming(config: StreamingConfig): StreamingSession;
  stopStreaming(sessionId: string): void;
  
  // Metrics aggregation
  getAggregatedMetrics(query: MetricsQuery): Promise<AggregatedMetrics>;
  
  // Health and diagnostics
  getCollectorHealth(): MetricsCollectorHealth;
  getCollectorStats(): MetricsCollectorStats;
}

export interface MetricTags {
  [key: string]: string | number | boolean;
}

export interface Timer {
  stop(tags?: MetricTags): number;
  split(name: string, tags?: MetricTags): number;
  cancel(): void;
}

export interface PerformanceMeasurement {
  duration: number;
  cpuUsage?: NodeJS.CpuUsage;
  memoryUsage?: NodeJS.MemoryUsage;
  eventLoopDelay?: number;
  gcStats?: GCStats;
  customData?: Record<string, any>;
}

export interface CustomMetric {
  name: string;
  type: MetricType;
  value: number;
  unit?: MetricUnit;
  tags?: MetricTags;
  timestamp?: Date;
  metadata?: MetricMetadata;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom'
}

export enum MetricUnit {
  COUNT = 'count',
  MILLISECONDS = 'ms',
  SECONDS = 's',
  BYTES = 'bytes',
  PERCENTAGE = 'percent',
  REQUESTS_PER_SECOND = 'rps',
  DOLLARS = 'usd',
  POINTS = 'points'
}

export class MetricsCollectorImpl implements MetricsCollector {
  private storage: MetricsStorage;
  private aggregator: MetricsAggregator;
  private reporter: MetricsReporter;
  private streamer: MetricsStreamer;
  private config: MetricsConfig;
  private timers: Map<string, TimerInstance>;
  private streamingSessions: Map<string, StreamingSession>;
  private logger: Logger;
  
  constructor(config: MetricsConfig) {
    this.config = config;
    this.storage = new MetricsStorage(config.storage);
    this.aggregator = new MetricsAggregator(config.aggregation);
    this.reporter = new MetricsReporter(config.reporting);
    this.streamer = new MetricsStreamer(config.streaming);
    this.timers = new Map();
    this.streamingSessions = new Map();
    this.logger = new Logger('MetricsCollector');
    
    this.startBackgroundTasks();
  }
  
  increment(name: string, value: number = 1, tags: MetricTags = {}): void {
    try {
      const metric: Metric = {
        name: this.normalizeMetricName(name),
        type: MetricType.COUNTER,
        value,
        tags: this.normalizeTags(tags),
        timestamp: new Date(),
        metadata: this.generateMetadata()
      };
      
      this.processMetric(metric);
      
    } catch (error) {
      this.logger.error('Failed to record increment metric', { error, name, value, tags });
    }
  }
  
  decrement(name: string, value: number = 1, tags: MetricTags = {}): void {
    this.increment(name, -value, tags);
  }
  
  gauge(name: string, value: number, tags: MetricTags = {}): void {
    try {
      const metric: Metric = {
        name: this.normalizeMetricName(name),
        type: MetricType.GAUGE,
        value,
        tags: this.normalizeTags(tags),
        timestamp: new Date(),
        metadata: this.generateMetadata()
      };
      
      this.processMetric(metric);
      
    } catch (error) {
      this.logger.error('Failed to record gauge metric', { error, name, value, tags });
    }
  }
  
  histogram(name: string, value: number, tags: MetricTags = {}): void {
    try {
      const metric: Metric = {
        name: this.normalizeMetricName(name),
        type: MetricType.HISTOGRAM,
        value,
        tags: this.normalizeTags(tags),
        timestamp: new Date(),
        metadata: this.generateMetadata()
      };
      
      this.processMetric(metric);
      
    } catch (error) {
      this.logger.error('Failed to record histogram metric', { error, name, value, tags });
    }
  }
  
  timer(name: string): Timer {
    const timerId = generateId();
    const startTime = process.hrtime.bigint();
    const startCpu = process.cpuUsage();
    const startMemory = process.memoryUsage();
    
    const timerInstance: TimerInstance = {
      id: timerId,
      name: this.normalizeMetricName(name),
      startTime,
      startCpu,
      startMemory,
      splits: new Map()
    };
    
    this.timers.set(timerId, timerInstance);
    
    return {
      stop: (tags: MetricTags = {}) => {
        const timer = this.timers.get(timerId);
        if (!timer) {
          this.logger.warn('Timer not found', { timerId, name });
          return 0;
        }
        
        const endTime = process.hrtime.bigint();
        const endCpu = process.cpuUsage(timer.startCpu);
        const endMemory = process.memoryUsage();
        
        const duration = Number(endTime - timer.startTime) / 1e6; // Convert to milliseconds
        
        const performanceMeasurement: PerformanceMeasurement = {
          duration,
          cpuUsage: endCpu,
          memoryUsage: {
            rss: endMemory.rss - timer.startMemory.rss,
            heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
            external: endMemory.external - timer.startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - timer.startMemory.arrayBuffers
          }
        };
        
        this.timing(timer.name, duration, tags);
        this.performance(`${timer.name}.performance`, performanceMeasurement);
        
        this.timers.delete(timerId);
        return duration;
      },
      
      split: (splitName: string, tags: MetricTags = {}) => {
        const timer = this.timers.get(timerId);
        if (!timer) {
          this.logger.warn('Timer not found for split', { timerId, splitName });
          return 0;
        }
        
        const splitTime = process.hrtime.bigint();
        const duration = Number(splitTime - timer.startTime) / 1e6;
        
        timer.splits.set(splitName, { time: splitTime, duration });
        this.timing(`${timer.name}.${splitName}`, duration, tags);
        
        return duration;
      },
      
      cancel: () => {
        this.timers.delete(timerId);
      }
    };
  }
  
  timing(name: string, duration: number, tags: MetricTags = {}): void {
    try {
      const metric: Metric = {
        name: this.normalizeMetricName(name),
        type: MetricType.TIMER,
        value: duration,
        unit: MetricUnit.MILLISECONDS,
        tags: this.normalizeTags(tags),
        timestamp: new Date(),
        metadata: this.generateMetadata()
      };
      
      this.processMetric(metric);
      
    } catch (error) {
      this.logger.error('Failed to record timing metric', { error, name, duration, tags });
    }
  }
  
  businessMetric(name: string, value: number, unit: MetricUnit, tags: MetricTags = {}): void {
    try {
      const metric: Metric = {
        name: this.normalizeMetricName(name),
        type: MetricType.BUSINESS,
        value,
        unit,
        tags: { ...this.normalizeTags(tags), business: true },
        timestamp: new Date(),
        metadata: this.generateMetadata()
      };
      
      this.processMetric(metric);
      
    } catch (error) {
      this.logger.error('Failed to record business metric', { error, name, value, unit, tags });
    }
  }
  
  performance(name: string, measurement: PerformanceMeasurement): void {
    try {
      // Record duration
      this.timing(`${name}.duration`, measurement.duration);
      
      // Record CPU usage if available
      if (measurement.cpuUsage) {
        this.gauge(`${name}.cpu.user`, measurement.cpuUsage.user / 1000); // Convert to milliseconds
        this.gauge(`${name}.cpu.system`, measurement.cpuUsage.system / 1000);
      }
      
      // Record memory usage if available
      if (measurement.memoryUsage) {
        this.gauge(`${name}.memory.rss`, measurement.memoryUsage.rss, { unit: MetricUnit.BYTES });
        this.gauge(`${name}.memory.heap_total`, measurement.memoryUsage.heapTotal, { unit: MetricUnit.BYTES });
        this.gauge(`${name}.memory.heap_used`, measurement.memoryUsage.heapUsed, { unit: MetricUnit.BYTES });
        this.gauge(`${name}.memory.external`, measurement.memoryUsage.external, { unit: MetricUnit.BYTES });
      }
      
      // Record event loop delay if available
      if (measurement.eventLoopDelay) {
        this.histogram(`${name}.event_loop_delay`, measurement.eventLoopDelay);
      }
      
      // Record GC stats if available
      if (measurement.gcStats) {
        this.gauge(`${name}.gc.duration`, measurement.gcStats.duration);
        this.increment(`${name}.gc.count`, 1, { type: measurement.gcStats.type });
      }
      
      // Record custom data if available
      if (measurement.customData) {
        Object.entries(measurement.customData).forEach(([key, value]) => {
          if (typeof value === 'number') {
            this.gauge(`${name}.${key}`, value);
          }
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to record performance metric', { error, name, measurement });
    }
  }
  
  custom(metric: CustomMetric): void {
    try {
      const processedMetric: Metric = {
        name: this.normalizeMetricName(metric.name),
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        tags: this.normalizeTags(metric.tags || {}),
        timestamp: metric.timestamp || new Date(),
        metadata: { ...this.generateMetadata(), ...metric.metadata }
      };
      
      this.processMetric(processedMetric);
      
    } catch (error) {
      this.logger.error('Failed to record custom metric', { error, metric });
    }
  }
  
  private processMetric(metric: Metric): void {
    // Store the metric
    this.storage.store(metric);
    
    // Add to real-time aggregation
    this.aggregator.addMetric(metric);
    
    // Stream to real-time subscribers
    this.streamer.stream(metric);
    
    // Check for alerts
    this.checkAlerts(metric);
    
    // Update collector stats
    this.updateCollectorStats(metric);
  }
  
  private normalizeMetricName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  private normalizeTags(tags: MetricTags): MetricTags {
    const normalized: MetricTags = {};
    
    Object.entries(tags).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      normalized[normalizedKey] = value;
    });
    
    // Add default tags
    normalized.service = this.config.serviceName;
    normalized.version = this.config.serviceVersion;
    normalized.environment = this.config.environment;
    normalized.instance = this.config.instanceId;
    
    return normalized;
  }
  
  private generateMetadata(): MetricMetadata {
    return {
      collectorVersion: this.config.version,
      instanceId: this.config.instanceId,
      processId: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }
}
```

### 2. Performance Tracking System

```typescript
// src/shared/metrics/PerformanceTracker.ts
export interface PerformanceTracker {
  trackFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    options?: TrackingOptions
  ): T;
  
  trackAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name: string,
    options?: TrackingOptions
  ): T;
  
  trackClass(target: any, options?: ClassTrackingOptions): void;
  
  startTracking(name: string, options?: TrackingOptions): TrackingSession;
  stopTracking(sessionId: string): PerformanceMeasurement;
  
  profile(name: string, options?: ProfilingOptions): Promise<ProfilingResult>;
  benchmark(name: string, fn: () => any, options?: BenchmarkOptions): Promise<BenchmarkResult>;
  
  getPerformanceReport(filter?: PerformanceFilter): PerformanceReport;
}

export interface TrackingOptions {
  tags?: MetricTags;
  includeArgs?: boolean;
  includeResult?: boolean;
  sampleRate?: number;
  threshold?: number;
  trackMemory?: boolean;
  trackCpu?: boolean;
  trackEventLoop?: boolean;
}

export class PerformanceTrackerImpl implements PerformanceTracker {
  private metricsCollector: MetricsCollector;
  private activeSessions: Map<string, TrackingSessionData>;
  private config: PerformanceTrackingConfig;
  private profiler: NodeProfiler;
  private logger: Logger;
  
  constructor(
    metricsCollector: MetricsCollector, 
    config: PerformanceTrackingConfig
  ) {
    this.metricsCollector = metricsCollector;
    this.config = config;
    this.activeSessions = new Map();
    this.profiler = new NodeProfiler();
    this.logger = new Logger('PerformanceTracker');
  }
  
  trackFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    options: TrackingOptions = {}
  ): T {
    return ((...args: any[]) => {
      if (this.shouldSample(options.sampleRate)) {
        const timer = this.metricsCollector.timer(`function.${name}`);
        const startMemory = options.trackMemory ? process.memoryUsage() : undefined;
        const startCpu = options.trackCpu ? process.cpuUsage() : undefined;
        
        try {
          const result = fn.apply(this, args);
          const duration = timer.stop(options.tags);
          
          this.recordFunctionMetrics(name, duration, startMemory, startCpu, options);
          
          if (options.includeResult && result !== undefined) {
            this.metricsCollector.custom({
              name: `function.${name}.result_size`,
              type: MetricType.HISTOGRAM,
              value: this.calculateResultSize(result),
              tags: options.tags
            });
          }
          
          return result;
          
        } catch (error) {
          timer.stop({ ...options.tags, error: true });
          this.metricsCollector.increment(`function.${name}.errors`, 1, options.tags);
          throw error;
        }
      } else {
        return fn.apply(this, args);
      }
    }) as T;
  }
}
```

### 3. Business Metrics Tracking

```typescript
// src/shared/metrics/BusinessMetricsTracker.ts
export interface BusinessMetricsTracker {
  trackProjectCreation(projectData: ProjectMetadata): void;
  trackAnalysisCompletion(analysisData: AnalysisMetadata): void;
  trackUserInteraction(interactionData: InteractionMetadata): void;
  trackSystemUsage(usageData: UsageMetadata): void;
  trackCostMetrics(costData: CostMetadata): void;
  trackQualityMetrics(qualityData: QualityMetadata): void;
  trackEffectivenessMetrics(effectivenessData: EffectivenessMetadata): void;
  
  generateBusinessReport(period: TimePeriod): Promise<BusinessReport>;
  calculateROI(period: TimePeriod): Promise<ROIReport>;
  getUsageAnalytics(filter?: UsageFilter): Promise<UsageAnalytics>;
}

export class BusinessMetricsTrackerImpl implements BusinessMetricsTracker {
  private metricsCollector: MetricsCollector;
  private config: BusinessMetricsConfig;
  private logger: Logger;
  
  constructor(metricsCollector: MetricsCollector, config: BusinessMetricsConfig) {
    this.metricsCollector = metricsCollector;
    this.config = config;
    this.logger = new Logger('BusinessMetricsTracker');
  }
  
  trackProjectCreation(projectData: ProjectMetadata): void {
    this.metricsCollector.increment('business.projects.created');
    this.metricsCollector.businessMetric(
      'business.projects.complexity_score',
      projectData.complexityScore,
      MetricUnit.POINTS,
      {
        project_type: projectData.type,
        team_size: projectData.teamSize.toString(),
        industry: projectData.industry
      }
    );
    
    this.metricsCollector.businessMetric(
      'business.projects.estimated_value',
      projectData.estimatedValue,
      MetricUnit.DOLLARS,
      {
        project_type: projectData.type,
        currency: projectData.currency
      }
    );
  }
  
  trackAnalysisCompletion(analysisData: AnalysisMetadata): void {
    this.metricsCollector.increment('business.analyses.completed');
    this.metricsCollector.timing(
      'business.analyses.duration',
      analysisData.duration,
      {
        analysis_type: analysisData.type,
        quality_score: analysisData.qualityScore.toString()
      }
    );
    
    this.metricsCollector.businessMetric(
      'business.analyses.quality_score',
      analysisData.qualityScore,
      MetricUnit.PERCENTAGE,
      {
        analysis_type: analysisData.type
      }
    );
  }
}
```

## File Structure

```
src/shared/metrics/
├── index.ts                              # Main exports
├── MetricsCollector.ts                   # Core metrics collector
├── PerformanceTracker.ts                 # Performance tracking
├── BusinessMetricsTracker.ts             # Business metrics
├── MetricsReporter.ts                    # Metrics reporting
├── MetricsStreamer.ts                    # Real-time streaming
├── MetricsAggregator.ts                  # Metrics aggregation
├── MetricsStorage.ts                     # Metrics storage
├── types/
│   ├── index.ts
│   ├── metrics.ts                        # Core metric types
│   ├── performance.ts                    # Performance types
│   ├── business.ts                       # Business metric types
│   └── reporting.ts                      # Reporting types
├── collectors/
│   ├── index.ts
│   ├── SystemMetricsCollector.ts         # System metrics
│   ├── ApplicationMetricsCollector.ts    # Application metrics
│   ├── ExternalServiceCollector.ts       # External service metrics
│   └── CustomMetricsCollector.ts         # Custom metrics
├── aggregators/
│   ├── index.ts
│   ├── TimeSeriesAggregator.ts          # Time-series aggregation
│   ├── StatisticalAggregator.ts         # Statistical functions
│   └── BusinessAggregator.ts            # Business metric aggregation
├── reporters/
│   ├── index.ts
│   ├── PrometheusReporter.ts            # Prometheus format
│   ├── StatsDReporter.ts                # StatsD format
│   ├── JSONReporter.ts                  # JSON format
│   └── ConsoleReporter.ts               # Console output
├── storage/
│   ├── index.ts
│   ├── MemoryStorage.ts                 # In-memory storage
│   ├── RedisStorage.ts                  # Redis storage
│   └── FileStorage.ts                   # File-based storage
└── __tests__/
    ├── unit/
    │   ├── MetricsCollector.test.ts
    │   ├── PerformanceTracker.test.ts
    │   └── BusinessMetricsTracker.test.ts
    ├── integration/
    │   ├── metrics-integration.test.ts
    │   └── performance-integration.test.ts
    └── fixtures/
        ├── sample-metrics.json
        └── performance-data.json
```

## Success Criteria

### Functional Requirements
1. **Comprehensive Metrics Collection**: Support all metric types with high performance
2. **Performance Tracking**: Detailed function and system performance monitoring
3. **Business Metrics**: Track ROI, effectiveness, and business value metrics
4. **Real-time Streaming**: Live metrics streaming for monitoring dashboards
5. **Flexible Storage**: Multiple storage backends with efficient aggregation
6. **Rich Reporting**: Multiple output formats and reporting destinations

### Technical Requirements
1. **High Performance**: Minimal overhead on core system operations (<1ms per metric)
2. **Scalability**: Handle 10,000+ metrics per second efficiently
3. **Reliability**: 99.9% metric collection success rate
4. **Flexibility**: Configurable collectors, aggregators, and reporters
5. **Integration**: Seamless integration with all BDUF orchestrator components

### Quality Standards
1. **Testing**: 90%+ code coverage with comprehensive test scenarios
2. **Documentation**: Complete API documentation and usage examples
3. **Performance**: Optimized algorithms with minimal memory footprint
4. **Error Handling**: Graceful degradation and comprehensive error recovery
5. **Monitoring**: Self-monitoring with health checks and diagnostics

## Output Format

### Implementation Deliverables
1. **MetricsCollector**: Core metrics collection with all metric types
2. **PerformanceTracker**: Function and system performance monitoring
3. **BusinessMetricsTracker**: Business value and ROI tracking
4. **MetricsReporter**: Multiple output formats and destinations
5. **Real-time Streaming**: Live metrics streaming capabilities
6. **Storage System**: Efficient storage with multiple backend options
7. **Aggregation Engine**: Statistical and time-series aggregation

### Testing Requirements
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Cross-component integration testing
3. **Performance Tests**: Load and scalability testing
4. **Business Logic Tests**: Business metrics calculation validation
5. **Stress Tests**: High-volume metrics processing testing

Remember that this metrics collection framework is foundational for all system observability and must maintain high performance while providing comprehensive insights into system behavior and business value.