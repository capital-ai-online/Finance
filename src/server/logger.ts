import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * CAPITAL-AI Logger Architecture
 * Version 0.6.0-Beta
 */

// Custom AsyncLocalStorage for managing Request ID within asynchronous contexts
export const requestIdStore = new AsyncLocalStorage<string>();

// Define custom log levels per specifications
const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const colors = {
  fatal: 'bold red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'cyan',
  trace: 'magenta',
};

winston.addColors(colors);

// Retrieve active log level from env, defaulting to 'info'
const getLogLevel = (): string => {
  const envLevel = process.env.LOG_LEVEL || 'info';
  return levels.hasOwnProperty(envLevel.toLowerCase()) ? envLevel.toLowerCase() : 'info';
};

// Retrieve environment
const isDev = (process.env.NODE_ENV || 'development') === 'development';

// Deep masking utility to recursively redact sensitive credentials
const SENSITIVE_KEYS = new Set([
  'password', 'passwort', 'cookie', 'authorization', 'token', 'jwt', 
  'apikey', 'api_key', 'secret', 'supabase', 'openai', 'google', 
  'microsoft', 'kraken', 'session', 'sessionid', 'stripe_secret', 'gemini_api_key'
]);

// JWT and general Auth / Secret regex for string matching
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const AUTH_HEADER_REGEX = /Bearer\s+[a-zA-Z0-9_\-\.]+/gi;

export function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact Bearer tokens and general JWT patterns found in strings
    let cleaned = data.replace(JWT_REGEX, '[JWT_REDACTED]');
    cleaned = cleaned.replace(AUTH_HEADER_REGEX, 'Bearer [REDACTED]');
    return cleaned;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  if (typeof data === 'object') {
    const maskedObj: any = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      // Check if key is sensitive
      const isSensitive = [...SENSITIVE_KEYS].some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive) {
        maskedObj[key] = '[REDACTED]';
      } else {
        maskedObj[key] = maskSensitiveData(data[key]);
      }
    }
    return maskedObj;
  }

  return data;
}

// Custom Winston Format to sanitize and inject contextual requestIds
const customFormat = winston.format((info) => {
  // Inject requestId from AsyncLocalStorage if available
  const storedRequestId = requestIdStore.getStore();
  if (storedRequestId) {
    info.requestId = storedRequestId;
  } else if (!info.requestId) {
    info.requestId = '';
  }

  // Ensure mandatory fields
  info.timestamp = info.timestamp || new Date().toISOString();
  info.module = info.module || 'system';
  info.function = info.function || 'global';

  // Apply sensitive data masking
  info.message = maskSensitiveData(info.message);
  
  // Recursively sanitize all metadata elements
  const { timestamp, level, message, requestId, module, function: fnName, ...meta } = info;
  const cleanedMeta = maskSensitiveData(meta);
  
  // Re-assemble the log object in order
  const sanitizedInfo: any = {
    timestamp,
    level: info.level,
    requestId,
    module,
    function: fnName,
    message,
    ...cleanedMeta
  };

  return sanitizedInfo;
});

// Create console transport
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev 
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize({ all: true }),
          winston.format.printf((info) => {
            const reqIdStr = info.requestId ? ` [ReqID: ${info.requestId}]` : '';
            const modFuncStr = ` [${info.module}::${info.function || 'global'}]`;
            const metaStr = Object.keys(info).filter(k => !['timestamp', 'level', 'message', 'requestId', 'module', 'function'].includes(k)).length > 0 
              ? `\nMetadata: ${JSON.stringify(Object.fromEntries(Object.entries(info).filter(([k]) => !['timestamp', 'level', 'message', 'requestId', 'module', 'function'].includes(k))), null, 2)}`
              : '';
            return `${info.timestamp} [${info.level}]${reqIdStr}${modFuncStr}: ${info.message}${metaStr}`;
          })
        )
      : winston.format.combine(
          winston.format.timestamp(),
          customFormat(),
          winston.format.json()
        )
  })
];

// Initialize winston logger
const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    customFormat()
  ),
  transports,
  exitOnError: false
});

// Type-safe Singleton Logger wrapper to guarantee standard APIs without global conflicts
class SingletonLogger {
  private static instance: SingletonLogger;

  private constructor() {}

  public static getInstance(): SingletonLogger {
    if (!SingletonLogger.instance) {
      SingletonLogger.instance = new SingletonLogger();
    }
    return SingletonLogger.instance;
  }

  public fatal(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('fatal', message, meta);
  }

  public error(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('error', message, meta);
  }

  public warn(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('warn', message, meta);
  }

  public info(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('info', message, meta);
  }

  public debug(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('debug', message, meta);
  }

  public trace(message: string, meta: Record<string, any> = {}): void {
    winstonLogger.log('trace', message, meta);
  }
}

export const logger = SingletonLogger.getInstance();
