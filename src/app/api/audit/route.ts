import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * Persistent Audit Log API — stores tool execution records server-side.
 *
 * POST /api/audit — Append audit entries (from the client-side agent controller)
 * GET  /api/audit — Retrieve recent audit entries (admin only)
 *
 * Storage: Append-only JSONL file at `data/audit.log`.
 * In production, replace with a database table or external logging service.
 */

const AUDIT_DIR = path.join(process.cwd(), 'data');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit.log');

/** Max entries returned by GET. */
const MAX_GET_ENTRIES = 200;

/** Fields that must never be persisted to the audit log. */
const PERSIST_REDACT_FIELDS = new Set([
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
]);

function redactDeep(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactDeep);
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PERSIST_REDACT_FIELDS.has(key)) {
      safe[key] = '[redacted]';
    } else if (typeof value === 'object' && value !== null) {
      safe[key] = redactDeep(value);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

function ensureAuditDir(): void {
  try {
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
  } catch {
    // Directory may already exist in concurrent scenarios
  }
}

/**
 * POST /api/audit — Persist one or more audit entries.
 *
 * Body: { entries: AuditEntry[] }
 * Each entry: { timestamp, toolName, inputSummary, resultSuccess, errorCode?, durationMs }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = Array.isArray(body.entries) ? body.entries : body.entry ? [body.entry] : [];

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NO_ENTRIES', message: 'No audit entries provided.' },
        { status: 400 },
      );
    }

    // Get authenticated user (optional — guest tool calls are also logged)
    let userId: string | null = null;
    try {
      const user = await getAuthenticatedUser(req);
      userId = user?.id || null;
    } catch {
      // Auth check failure is non-fatal for audit logging
    }

    ensureAuditDir();

    const lines: string[] = [];
    for (const entry of entries.slice(0, 50)) {
      const record = {
        timestamp: entry.timestamp || new Date().toISOString(),
        userId,
        toolName: String(entry.toolName || 'unknown'),
        inputSummary: redactDeep(entry.inputSummary || {}),
        resultSuccess: !!entry.resultSuccess,
        errorCode: entry.errorCode || null,
        durationMs: typeof entry.durationMs === 'number' ? Math.round(entry.durationMs) : null,
        injectionDetected: entry.injectionDetected || false,
        detectedPatterns: Array.isArray(entry.detectedPatterns) ? entry.detectedPatterns : [],
        serverTimestamp: new Date().toISOString(),
      };
      lines.push(JSON.stringify(record));
    }

    // Append to JSONL file (atomic write per batch)
    fs.appendFileSync(AUDIT_FILE, lines.join('\n') + '\n', 'utf-8');

    return NextResponse.json({
      success: true,
      persisted: lines.length,
      message: `${lines.length} audit entries persisted.`,
    });
  } catch (error: any) {
    console.error('[Audit API] Write error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Audit logging failed.' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/audit — Retrieve recent audit entries (admin access only).
 *
 * Query params:
 *   ?limit=50    — Number of entries to return (max 200)
 *   ?tool=login  — Filter by tool name
 */
export async function GET(req: NextRequest) {
  try {
    // Admin-only access
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Admin access required.' },
        { status: 403 },
      );
    }

    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '50', 10) || 50,
      MAX_GET_ENTRIES,
    );
    const toolFilter = req.nextUrl.searchParams.get('tool') || null;

    if (!fs.existsSync(AUDIT_FILE)) {
      return NextResponse.json({ success: true, entries: [], total: 0 });
    }

    const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
    const allLines = content.trim().split('\n').filter(Boolean);

    let entries: any[] = [];
    // Read from the end for most recent entries
    for (let i = allLines.length - 1; i >= 0 && entries.length < limit; i--) {
      try {
        const parsed = JSON.parse(allLines[i]);
        if (toolFilter && parsed.toolName !== toolFilter) continue;
        entries.push(parsed);
      } catch {
        // Skip malformed lines
      }
    }

    return NextResponse.json({
      success: true,
      entries,
      total: allLines.length,
      returned: entries.length,
    });
  } catch (error: any) {
    console.error('[Audit API] Read error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Audit read failed.' },
      { status: 500 },
    );
  }
}
