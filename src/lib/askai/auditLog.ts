/**
 * Audit Logger — records all tool executions for security monitoring.
 *
 * Dual-layer approach:
 *   1. In-memory buffer for immediate access (WebMCPIndicator, debugging)
 *   2. Async flush to /api/audit for persistent server-side JSONL storage
 *
 * All sensitive fields are redacted before both in-memory storage and
 * server persistence.
 */

export interface AuditEntry {
  timestamp: string;
  toolName: string;
  /** Input with sensitive fields stripped (never log raw credentials). */
  inputSummary: Record<string, unknown>;
  resultSuccess: boolean;
  errorCode?: string;
  /** Duration of tool execution in milliseconds. */
  durationMs: number;
  /** Whether a prompt injection was detected in this turn. */
  injectionDetected?: boolean;
  /** Labels of detected injection patterns. */
  detectedPatterns?: string[];
}

/** In-memory audit buffer (capped to prevent memory leaks). */
const MAX_ENTRIES = 500;
const auditBuffer: AuditEntry[] = [];

/** Pending entries waiting to be flushed to the server. */
const pendingFlush: AuditEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_BATCH_SIZE = 20;

/** Fields that must never appear in audit logs. */
const AUDIT_REDACT_FIELDS = new Set([
  'password',
  'passwordHash',
  'token',
  'sessionToken',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'apiKey',
  'email',
  'phone',
  'street',
  'zipCode',
]);

/**
 * Redact sensitive fields from tool input before logging.
 */
function redactInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (AUDIT_REDACT_FIELDS.has(key)) {
      safe[key] = '[redacted]';
    } else if (typeof value === 'object' && value !== null) {
      // Redact nested objects too
      safe[key] = redactInput(value);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Log a tool execution event.
 */
export function logToolExecution(
  toolName: string,
  input: unknown,
  result: unknown,
  durationMs: number,
  injectionInfo?: { injectionDetected: boolean; detectedPatterns: string[] },
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    toolName,
    inputSummary: redactInput(input),
    resultSuccess: !!(result && typeof result === 'object' && (result as any).success),
    errorCode: result && typeof result === 'object' && !(result as any).success
      ? (result as any).error || undefined
      : undefined,
    durationMs: Math.round(durationMs),
    ...(injectionInfo?.injectionDetected ? {
      injectionDetected: true,
      detectedPatterns: injectionInfo.detectedPatterns,
    } : {}),
  };

  // Add to in-memory buffer (capped)
  if (auditBuffer.length >= MAX_ENTRIES) {
    auditBuffer.shift();
  }
  auditBuffer.push(entry);

  // Queue for server persistence
  pendingFlush.push(entry);
  scheduleFlush();

  // Console output for development
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(
      `[AUDIT] ${entry.timestamp} | ${entry.toolName} | success=${entry.resultSuccess} | ${entry.durationMs}ms` +
      (entry.injectionDetected ? ` | ⚠️ INJECTION: ${entry.detectedPatterns?.join(', ')}` : ''),
    );
  }
}

/**
 * Log a prompt injection detection event (even when no tool was executed).
 */
export function logInjectionAttempt(
  userMessage: string,
  detectedPatterns: string[],
  blocked: boolean,
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    toolName: '_prompt_injection_detected',
    inputSummary: {
      messageLength: userMessage.length,
      messagePreview: userMessage.slice(0, 100) + (userMessage.length > 100 ? '...' : ''),
      blocked,
    },
    resultSuccess: false,
    errorCode: 'PROMPT_INJECTION_DETECTED',
    durationMs: 0,
    injectionDetected: true,
    detectedPatterns,
  };

  if (auditBuffer.length >= MAX_ENTRIES) {
    auditBuffer.shift();
  }
  auditBuffer.push(entry);
  pendingFlush.push(entry);
  scheduleFlush();

  console.warn(
    `[AUDIT] ⚠️ Prompt injection ${blocked ? 'BLOCKED' : 'WARNED'}: [${detectedPatterns.join(', ')}]`,
  );
}

/**
 * Schedule a debounced flush to the server.
 */
function scheduleFlush(): void {
  if (flushTimer) return; // Already scheduled
  if (typeof window === 'undefined') return; // Server-side — skip

  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushToServer();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Flush pending entries to the persistent server-side audit log.
/**
 * Flush pending entries to the persistent server-side audit log.
 * Exported for testing and explicit flush on session end.
 */
export async function flushAuditLog(): Promise<void> {
  if (pendingFlush.length === 0) return;
  if (typeof fetch === 'undefined') return;

  // Take a batch
  const batch = pendingFlush.splice(0, FLUSH_BATCH_SIZE);

  try {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
    });

    if (!res.ok) {
      // Re-queue failed entries (at the front)
      pendingFlush.unshift(...batch);
      console.warn('[AUDIT] Server flush failed, entries re-queued:', res.status);
    }
  } catch {
    // Network failure — re-queue
    pendingFlush.unshift(...batch);
    console.warn('[AUDIT] Server flush network error, entries re-queued.');
  }

  // If there are more pending, schedule another flush
  if (pendingFlush.length > 0) {
    scheduleFlush();
  }
}

/**
 * Flush pending entries to the persistent server-side audit log.
 */
async function flushToServer(): Promise<void> {
  return flushAuditLog();
}

/**
 * Retrieve the current in-memory audit log (most recent entries).
 */
export function getAuditLog(): readonly AuditEntry[] {
  return [...auditBuffer];
}
export const getRecentAuditEntries = getAuditLog;

/**
 * Clear the in-memory audit buffer (for testing).
 */
export function clearAuditLog(): void {
  auditBuffer.length = 0;
  pendingFlush.length = 0;
}
export const clearAuditEntries = clearAuditLog;
