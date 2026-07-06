import { logger } from '../server/logger';

/**
 * CAPITAL-AI Performance & Telemetry Engine
 * Version 0.5.5 (Beta-Phase)
 */

interface PerformanceMetric {
  name: string;
  durationMs: number;
  metadata?: Record<string, any>;
  memoryDeltaBytes?: number;
  cpuTimeMicros?: number;
}

export class TelemetryEngine {
  private static instance: TelemetryEngine;

  private constructor() {}

  public static getInstance(): TelemetryEngine {
    if (!TelemetryEngine.instance) {
      TelemetryEngine.instance = new TelemetryEngine();
    }
    return TelemetryEngine.instance;
  }

  /**
   * Helper to capture current system memory usage metrics
   */
  public getMemoryUsage() {
    const memory = process.memoryUsage();
    return {
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      externalMb: Math.round((memory.external / 1024 / 1024) * 100) / 100,
    };
  }

  /**
   * Helper to retrieve CPU times
   */
  public getCpuUsage(): NodeJS.CpuUsage {
    return process.cpuUsage();
  }

  /**
   * Track high-precision code execution performance
   * @param name Name of the operation being measured
   * @param operation Async or synchronous function to measure
   * @param metadata Optional contextual metadata to log
   */
  public async trackExecution<T>(
    name: string,
    operation: () => Promise<T> | T,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const startTime = process.hrtime();
    const startCpu = process.cpuUsage();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await operation();
      
      const diffTime = process.hrtime(startTime);
      const endCpu = process.cpuUsage(startCpu);
      const endMemory = process.memoryUsage().heapUsed;

      const durationMs = Math.round((diffTime[0] * 1e9 + diffTime[1]) / 1e6 * 100) / 100;
      const memoryDeltaBytes = endMemory - startMemory;
      const cpuTimeMicros = endCpu.user + endCpu.system;

      this.logMetric({
        name,
        durationMs,
        memoryDeltaBytes,
        cpuTimeMicros,
        metadata,
      });

      return result;
    } catch (error: any) {
      const diffTime = process.hrtime(startTime);
      const durationMs = Math.round((diffTime[0] * 1e9 + diffTime[1]) / 1e6 * 100) / 100;

      logger.error(`Performance tracking failed for '${name}': ${error.message || error}`, {
        module: 'telemetry',
        function: 'trackExecution',
        operation: name,
        durationMs,
        error: error.message || error,
        stack: error.stack,
        ...metadata,
      });

      throw error;
    }
  }

  /**
   * Internal reporter to pipe clean performance structures to Winston
   */
  private logMetric(metric: PerformanceMetric): void {
    const memoryUsage = this.getMemoryUsage();
    
    logger.info(`Performance Metric [${metric.name}] - Completed in ${metric.durationMs}ms`, {
      module: 'telemetry',
      function: 'logMetric',
      metricName: metric.name,
      durationMs: metric.durationMs,
      memoryDeltaKb: Math.round((metric.memoryDeltaBytes || 0) / 1024 * 100) / 100,
      cpuTimeMs: Math.round((metric.cpuTimeMicros || 0) / 1000 * 100) / 100,
      systemMemory: memoryUsage,
      ...metric.metadata,
    });
  }
}

export const telemetry = TelemetryEngine.getInstance();
