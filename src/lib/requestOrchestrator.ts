import { Request, Response, NextFunction } from 'express';

export interface RequestLogEntry {
  id: string;
  ip: string;
  endpoint: string;
  timestamp: string;
  status: 'COMPLETED' | 'QUEUED' | 'REJECTED' | 'TIMED_OUT' | 'RUNNING';
  duration?: number;
}

export interface OrchestratorStats {
  activeRequests: number;
  queueSize: number;
  totalProcessed: number;
  totalRejected: number;
  rateLimitsHit: number;
  concurrencyLimit: number;
  maxQueueSize: number;
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
  requestsLastMinute: number;
  recentLogs: RequestLogEntry[];
}

export interface QueueItem {
  id: string;
  endpoint: string;
  ip: string;
  resolve: () => void;
  reject: (err: Error) => void;
  timestamp: number;
  timeoutId: any;
}

export class RequestOrchestrator {
  private activeCount = 0;
  private queue: QueueItem[] = [];
  private totalProcessed = 0;
  private totalRejected = 0;
  private rateLimitsHit = 0;
  private recentLogs: RequestLogEntry[] = [];
  
  // Default Configurable Limits (safely balanced to prevent server crash and external rate-limiting)
  private concurrencyLimit = 3;         // max 3 concurrent expensive operations (e.g. Gemini AI calls)
  private maxQueueSize = 10;            // queue up to 10 extra requests before rejecting with 429
  private queueTimeoutMs = 15000;       // wait at most 15s in queue
  private rateLimitWindowMs = 60000;    // 1 minute window
  private maxRequestsPerWindow = 30;     // max 30 requests per IP per minute
  
  // Rate limiting tracker: IP -> array of timestamps
  private ipRequestTimestamps: Map<string, number[]> = new Map();

  constructor(config?: {
    concurrencyLimit?: number;
    maxQueueSize?: number;
    queueTimeoutMs?: number;
    rateLimitWindowMs?: number;
    maxRequestsPerWindow?: number;
  }) {
    if (config) {
      if (config.concurrencyLimit !== undefined) this.concurrencyLimit = config.concurrencyLimit;
      if (config.maxQueueSize !== undefined) this.maxQueueSize = config.maxQueueSize;
      if (config.queueTimeoutMs !== undefined) this.queueTimeoutMs = config.queueTimeoutMs;
      if (config.rateLimitWindowMs !== undefined) this.rateLimitWindowMs = config.rateLimitWindowMs;
      if (config.maxRequestsPerWindow !== undefined) this.maxRequestsPerWindow = config.maxRequestsPerWindow;
    }
  }

  // Log events safely with size cap
  private addLog(entry: RequestLogEntry) {
    this.recentLogs.unshift(entry);
    if (this.recentLogs.length > 50) {
      this.recentLogs.pop();
    }
  }

  // Update a log entry (e.g. when completed/failed)
  private updateLog(id: string, updates: Partial<RequestLogEntry>) {
    const log = this.recentLogs.find(l => l.id === id);
    if (log) {
      Object.assign(log, updates);
    }
  }

  // Dynamic config updater
  public updateConfig(config: {
    concurrencyLimit?: number;
    maxQueueSize?: number;
    maxRequestsPerWindow?: number;
  }) {
    if (config.concurrencyLimit !== undefined) this.concurrencyLimit = config.concurrencyLimit;
    if (config.maxQueueSize !== undefined) this.maxQueueSize = config.maxQueueSize;
    if (config.maxRequestsPerWindow !== undefined) this.maxRequestsPerWindow = config.maxRequestsPerWindow;
    
    // Process next in line in case concurrencyLimit was increased
    this.processNext();
  }

  private maskIp(ip: string): string {
    if (!ip) return 'unknown';
    if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') return ip;
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      }
    }
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 2) {
        return `${parts.slice(0, Math.min(3, parts.length - 1)).join(':')}::***`;
      }
    }
    return '***.***.***.***';
  }

  // Live Stats retrieval
  public getStats(): OrchestratorStats {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Count logs in the last minute
    const requestsLastMinute = this.recentLogs.filter(log => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= oneMinuteAgo;
    }).length;

    return {
      activeRequests: this.activeCount,
      queueSize: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
      rateLimitsHit: this.rateLimitsHit,
      concurrencyLimit: this.concurrencyLimit,
      maxQueueSize: this.maxQueueSize,
      rateLimitWindowMs: this.rateLimitWindowMs,
      maxRequestsPerWindow: this.maxRequestsPerWindow,
      requestsLastMinute,
      recentLogs: this.recentLogs.map(log => ({
        ...log,
        ip: this.maskIp(log.ip)
      }))
    };
  }

  // Clean request logs & resets stats
  public resetStats() {
    this.totalProcessed = 0;
    this.totalRejected = 0;
    this.rateLimitsHit = 0;
    this.recentLogs = [];
  }

  // Check IP rate limits
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    let timestamps = this.ipRequestTimestamps.get(ip) || [];
    
    // Filter timestamps older than our window
    timestamps = timestamps.filter(ts => now - ts < this.rateLimitWindowMs);
    
    if (timestamps.length >= this.maxRequestsPerWindow) {
      this.rateLimitsHit++;
      this.ipRequestTimestamps.set(ip, timestamps);
      return false;
    }
    
    timestamps.push(now);
    this.ipRequestTimestamps.set(ip, timestamps);
    return true;
  }

  // Core orchestration middleware
  public handle(endpointKey: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const requestId = Math.random().toString(36).substring(2, 11);
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const startTimestamp = Date.now();

      // 1. IP Rate Limiting Check
      if (!this.checkRateLimit(ip)) {
        this.totalRejected++;
        this.addLog({
          id: requestId,
          ip,
          endpoint: endpointKey,
          timestamp: new Date().toISOString(),
          status: 'REJECTED'
        });
        return res.status(429).json({
          error: 'Rate-Limit überschritten',
          message: `Zu viele Anfragen von diesem Client. Max. ${this.maxRequestsPerWindow} Anfragen pro ${this.rateLimitWindowMs / 1000}s erlaubt.`
        });
      }

      // Helper to execute original route handler
      const executeRequest = async () => {
        const startTime = Date.now();
        this.updateLog(requestId, { status: 'RUNNING' });

        // Intercept response send to capture duration and statistics
        const originalSend = res.send;
        let finished = false;

        res.send = (body) => {
          if (!finished) {
            finished = true;
            this.activeCount = Math.max(0, this.activeCount - 1);
            this.totalProcessed++;
            const duration = Date.now() - startTime;
            this.updateLog(requestId, { status: 'COMPLETED', duration });
            this.processNext();
          }
          return originalSend.call(res, body);
        };

        // Also handle connection closes/aborts to prevent locking slots
        res.on('close', () => {
          if (!finished) {
            finished = true;
            this.activeCount = Math.max(0, this.activeCount - 1);
            this.totalProcessed++;
            const duration = Date.now() - startTime;
            this.updateLog(requestId, { status: 'COMPLETED', duration });
            this.processNext();
          }
        });

        next();
      };

      // 2. Concurrency Check
      if (this.activeCount < this.concurrencyLimit) {
        this.activeCount++;
        this.addLog({
          id: requestId,
          ip,
          endpoint: endpointKey,
          timestamp: new Date().toISOString(),
          status: 'RUNNING'
        });
        await executeRequest();
      } else {
        // 3. Queue Check
        if (this.queue.length >= this.maxQueueSize) {
          this.totalRejected++;
          this.addLog({
            id: requestId,
            ip,
            endpoint: endpointKey,
            timestamp: new Date().toISOString(),
            status: 'REJECTED'
          });
          return res.status(429).json({
            error: 'Server überlastet',
            message: 'Der Anfragen-Speicher ist aktuell voll. Bitte versuchen Sie es in Kürze erneut.'
          });
        }

        // Add to FIFO Queue
        this.addLog({
          id: requestId,
          ip,
          endpoint: endpointKey,
          timestamp: new Date().toISOString(),
          status: 'QUEUED'
        });

        const queuePromise = new Promise<void>((resolve, reject) => {
          // Set a queue timeout to avoid indefinitely hanging requests
          const timeoutId = setTimeout(() => {
            const index = this.queue.findIndex(item => item.id === requestId);
            if (index !== -1) {
              this.queue.splice(index, 1);
              this.totalRejected++;
              this.updateLog(requestId, { status: 'TIMED_OUT' });
              reject(new Error('Queue timeout reached. Request aborted.'));
            }
          }, this.queueTimeoutMs);

          this.queue.push({
            id: requestId,
            endpoint: endpointKey,
            ip,
            resolve: () => {
              clearTimeout(timeoutId);
              resolve();
            },
            reject: (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            timestamp: startTimestamp,
            timeoutId
          });
        });

        try {
          // Wait for our turn in the queue
          await queuePromise;
          this.activeCount++;
          await executeRequest();
        } catch (err: any) {
          return res.status(503).json({
            error: 'Warteschlangen-Timeout',
            message: err.message || 'Die Anfrage wurde aufgrund hoher Serverlast abgebrochen.'
          });
        }
      }
    };
  }

  // Trigger next queued request
  private processNext() {
    if (this.queue.length > 0 && this.activeCount < this.concurrencyLimit) {
      const nextItem = this.queue.shift();
      if (nextItem) {
        nextItem.resolve();
      }
    }
  }
}

// Export a singleton instance with safe defaults
export const orchestrator = new RequestOrchestrator();
