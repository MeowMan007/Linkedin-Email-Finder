// ============================================================
// Structured Logger
// Never logs: API keys, passwords, auth tokens, personal data
// ============================================================

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  request_id?: string;
  linkedin_url_hash?: string;
  provider?: string;
  operation: string;
  duration_ms?: number;
  status?: 'success' | 'error' | 'skipped' | 'cached';
  error_type?: string;
  message?: string;
  [key: string]: unknown;
}

// Sensitive keys that must NEVER appear in logs
const SENSITIVE_KEYS = new Set([
  'api_key',
  'apiKey',
  'APOLLO_API_KEY',
  'HUNTER_API_KEY',
  'SNOV_CLIENT_ID',
  'SNOV_CLIENT_SECRET',
  'FINDYMAIL_API_KEY',
  'PROSPEO_API_KEY',
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'password',
  'token',
  'secret',
  'authorization',
  'x-api-key',
]);

/**
 * Recursively strip sensitive keys from an object.
 */
function sanitize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = sanitize(value);
    }
  }
  return clean;
}

export type LogInput = {
  level: LogLevel;
  operation: string;
  request_id?: string;
  linkedin_url_hash?: string;
  provider?: string;
  duration_ms?: number;
  status?: 'success' | 'error' | 'skipped' | 'cached';
  error_type?: string;
  message?: string;
  [key: string]: unknown;
};

/**
 * Emit a structured log entry to stdout/stderr.
 * In production, this would integrate with a log aggregator.
 */
export function log(entry: LogInput): void {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Sanitize the entire entry before logging
  const safe = sanitize(fullEntry) as Record<string, unknown>;

  const output = JSON.stringify(safe);

  if (entry.level === 'error') {
    console.error(output);
  } else if (entry.level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

/**
 * Convenience wrappers
 */
export const logger = {
  info: (operation: string, extra?: Partial<LogEntry>) =>
    log({ level: 'info', operation, ...extra }),
  warn: (operation: string, extra?: Partial<LogEntry>) =>
    log({ level: 'warn', operation, ...extra }),
  error: (operation: string, extra?: Partial<LogEntry>) =>
    log({ level: 'error', operation, ...extra }),
  debug: (operation: string, extra?: Partial<LogEntry>) => {
    if (process.env.NODE_ENV === 'development') {
      log({ level: 'debug', operation, ...extra });
    }
  },
};
