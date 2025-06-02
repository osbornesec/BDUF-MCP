export interface MetricsCollector {
  increment(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, value: number, tags?: Record<string, string>): void;
  set(metric: string, value: string, tags?: Record<string, string>): void;
  flush(): Promise<void>;
}

export interface MetricData {
  name: string;
  value: number | string;
  type: 'counter' | 'histogram' | 'gauge' | 'timing' | 'set';
  tags: Record<string, string>;
  timestamp: Date;
}

export class InMemoryMetricsCollector implements MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();

  increment(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(metric, value, 'counter', tags);
  }

  histogram(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(metric, value, 'histogram', tags);
  }

  gauge(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(metric, value, 'gauge', tags);
  }

  timing(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(metric, value, 'timing', tags);
  }

  set(metric: string, value: string, tags: Record<string, string> = {}): void {
    this.recordMetric(metric, value, 'set', tags);
  }

  private recordMetric(
    name: string, 
    value: number | string, 
    type: MetricData['type'], 
    tags: Record<string, string>
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricData: MetricData = {
      name,
      value,
      type,
      tags,
      timestamp: new Date()
    };

    this.metrics.get(name)!.push(metricData);
  }

  async flush(): Promise<void> {
    // In a real implementation, this would send metrics to an external system
    // For now, we just clear the in-memory store
    this.metrics.clear();
  }

  // Utility methods for testing and debugging
  getMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  getMetric(name: string): MetricData[] | undefined {
    return this.metrics.get(name);
  }

  getMetricCount(name: string): number {
    return this.metrics.get(name)?.length || 0;
  }

  getLastMetricValue(name: string): number | string | undefined {
    const metrics = this.metrics.get(name);
    return metrics?.[metrics.length - 1]?.value;
  }

  clear(): void {
    this.metrics.clear();
  }

  // Aggregation methods
  sumCounter(name: string, timeRangeMs?: number): number {
    const metrics = this.getMetricsInTimeRange(name, timeRangeMs);
    return metrics
      .filter(m => m.type === 'counter')
      .reduce((sum, m) => sum + (typeof m.value === 'number' ? m.value : 0), 0);
  }

  averageHistogram(name: string, timeRangeMs?: number): number {
    const metrics = this.getMetricsInTimeRange(name, timeRangeMs);
    const histogramMetrics = metrics.filter(m => m.type === 'histogram');
    
    if (histogramMetrics.length === 0) return 0;
    
    const sum = histogramMetrics.reduce((sum, m) => 
      sum + (typeof m.value === 'number' ? m.value : 0), 0);
    
    return sum / histogramMetrics.length;
  }

  lastGaugeValue(name: string): number | undefined {
    const metrics = this.metrics.get(name);
    const gaugeMetrics = metrics?.filter(m => m.type === 'gauge');
    const lastGauge = gaugeMetrics?.[gaugeMetrics.length - 1];
    
    return typeof lastGauge?.value === 'number' ? lastGauge.value : undefined;
  }

  private getMetricsInTimeRange(name: string, timeRangeMs?: number): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    
    if (!timeRangeMs) {
      return metrics;
    }
    
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    return metrics.filter(m => m.timestamp >= cutoffTime);
  }
}

// Console-based metrics collector for development
export class ConsoleMetricsCollector implements MetricsCollector {
  private enabled: boolean;

  constructor(enabled: boolean = process.env.NODE_ENV !== 'production') {
    this.enabled = enabled;
  }

  increment(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.log('INCREMENT', metric, value, tags);
  }

  histogram(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.log('HISTOGRAM', metric, value, tags);
  }

  gauge(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.log('GAUGE', metric, value, tags);
  }

  timing(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.log('TIMING', metric, `${value}ms`, tags);
  }

  set(metric: string, value: string, tags: Record<string, string> = {}): void {
    this.log('SET', metric, value, tags);
  }

  private log(type: string, metric: string, value: number | string, tags: Record<string, string>): void {
    if (!this.enabled) return;

    const tagsStr = Object.keys(tags).length > 0 
      ? ` (${Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(', ')})`
      : '';

    console.log(`[METRICS] ${type}: ${metric} = ${value}${tagsStr}`);
  }

  async flush(): Promise<void> {
    // No-op for console collector
  }
}

// Composite metrics collector that can send to multiple backends
export class CompositeMetricsCollector implements MetricsCollector {
  private collectors: MetricsCollector[];

  constructor(collectors: MetricsCollector[]) {
    this.collectors = collectors;
  }

  increment(metric: string, value: number, tags?: Record<string, string>): void {
    this.collectors.forEach(collector => collector.increment(metric, value, tags));
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    this.collectors.forEach(collector => collector.histogram(metric, value, tags));
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.collectors.forEach(collector => collector.gauge(metric, value, tags));
  }

  timing(metric: string, value: number, tags?: Record<string, string>): void {
    this.collectors.forEach(collector => collector.timing(metric, value, tags));
  }

  set(metric: string, value: string, tags?: Record<string, string>): void {
    this.collectors.forEach(collector => collector.set(metric, value, tags));
  }

  async flush(): Promise<void> {
    await Promise.all(this.collectors.map(collector => collector.flush()));
  }

  addCollector(collector: MetricsCollector): void {
    this.collectors.push(collector);
  }

  removeCollector(collector: MetricsCollector): void {
    const index = this.collectors.indexOf(collector);
    if (index !== -1) {
      this.collectors.splice(index, 1);
    }
  }
}

// Factory function to create appropriate metrics collector based on environment
export function createMetricsCollector(): MetricsCollector {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      // In production, you might want to use a real metrics service
      // For now, we'll use in-memory with console logging
      return new CompositeMetricsCollector([
        new InMemoryMetricsCollector(),
        new ConsoleMetricsCollector(false) // Disabled in production
      ]);
    
    case 'test':
      return new InMemoryMetricsCollector();
    
    default:
      return new CompositeMetricsCollector([
        new InMemoryMetricsCollector(),
        new ConsoleMetricsCollector(true)
      ]);
  }
}