// ============================================================
// Neon PostgreSQL Database Client
// ============================================================

import { neon } from '@neondatabase/serverless';
import { SearchRecord, EnrichmentResult, EmailStatus, StatsResponse } from '@/types';
import { logger } from './logger';

// Only initialize DB if DATABASE_URL is configured
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return neon(url);
  } catch {
    return null;
  }
}

/**
 * Initialize the database schema if tables don't exist.
 * Safe to call multiple times (uses CREATE IF NOT EXISTS).
 */
export async function initializeSchema(): Promise<void> {
  const sql = getDb();
  if (!sql) {
    logger.warn('database_init_skipped', { message: 'DATABASE_URL not configured' });
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS search_records (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        linkedin_url TEXT NOT NULL,
        linkedin_url_hash TEXT NOT NULL,
        person_name TEXT,
        person_title TEXT,
        company_name TEXT,
        company_domain TEXT,
        email TEXT,
        email_status TEXT,
        confidence INTEGER,
        sources TEXT[],
        result_data JSONB,
        user_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_search_records_hash 
      ON search_records(linkedin_url_hash)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_search_records_created_at 
      ON search_records(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_search_records_user_id 
      ON search_records(user_id)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip TEXT NOT NULL,
        date DATE NOT NULL,
        count INTEGER DEFAULT 0,
        PRIMARY KEY (ip, date)
      )
    `;

    logger.info('database_schema_initialized');
  } catch (err) {
    logger.error('database_schema_init_failed', {
      error_type: err instanceof Error ? err.constructor.name : 'unknown',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Save an enrichment result to the database.
 */
export async function saveSearchRecord(params: {
  linkedinUrl: string;
  linkedinUrlHash: string;
  result: EnrichmentResult;
  userId?: string | null;
}): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;

  const { linkedinUrl, linkedinUrlHash, result, userId } = params;

  try {
    const rows = await sql`
      INSERT INTO search_records (
        linkedin_url,
        linkedin_url_hash,
        person_name,
        person_title,
        company_name,
        company_domain,
        email,
        email_status,
        confidence,
        sources,
        result_data,
        user_id
      ) VALUES (
        ${linkedinUrl},
        ${linkedinUrlHash},
        ${result.person.name ?? null},
        ${result.person.title ?? null},
        ${result.company?.name ?? null},
        ${result.company?.domain ?? null},
        ${result.email?.address ?? null},
        ${result.email?.status ?? null},
        ${result.confidence.total ?? null},
        ${result.sources as string[]},
        ${JSON.stringify(result)},
        ${userId ?? null}
      )
      RETURNING id
    `;

    return rows[0]?.id ?? null;
  } catch (err) {
    logger.error('save_search_record_failed', {
      error_type: err instanceof Error ? err.constructor.name : 'unknown',
    });
    return null;
  }
}

/**
 * Get paginated search history.
 */
export async function getSearchHistory(params: {
  userId?: string | null;
  page?: number;
  limit?: number;
}): Promise<{ records: SearchRecord[]; total: number }> {
  const sql = getDb();
  if (!sql) return { records: [], total: 0 };

  const { userId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  try {
    let rows;
    let countRows;

    if (userId) {
      rows = await sql`
        SELECT * FROM search_records
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*) as count FROM search_records WHERE user_id = ${userId}
      `;
    } else {
      rows = await sql`
        SELECT * FROM search_records
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*) as count FROM search_records
      `;
    }

    const records: SearchRecord[] = rows.map((row) => ({
      id: row.id,
      linkedinUrl: row.linkedin_url,
      linkedinUrlHash: row.linkedin_url_hash,
      personName: row.person_name,
      personTitle: row.person_title,
      companyName: row.company_name,
      companyDomain: row.company_domain,
      email: row.email,
      emailStatus: row.email_status as EmailStatus | null,
      confidence: row.confidence,
      sources: row.sources ?? [],
      resultData: row.result_data,
      userId: row.user_id,
      createdAt: row.created_at,
    }));

    return {
      records,
      total: parseInt(countRows[0]?.count ?? '0', 10),
    };
  } catch (err) {
    logger.error('get_search_history_failed', {
      error_type: err instanceof Error ? err.constructor.name : 'unknown',
    });
    return { records: [], total: 0 };
  }
}

/**
 * Get a single search record by ID.
 */
export async function getSearchRecordById(
  id: string,
  userId?: string | null
): Promise<SearchRecord | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    let rows;
    if (userId) {
      rows = await sql`
        SELECT * FROM search_records WHERE id = ${id} AND user_id = ${userId}
      `;
    } else {
      rows = await sql`SELECT * FROM search_records WHERE id = ${id}`;
    }

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      linkedinUrl: row.linkedin_url,
      linkedinUrlHash: row.linkedin_url_hash,
      personName: row.person_name,
      personTitle: row.person_title,
      companyName: row.company_name,
      companyDomain: row.company_domain,
      email: row.email,
      emailStatus: row.email_status as EmailStatus | null,
      confidence: row.confidence,
      sources: row.sources ?? [],
      resultData: row.result_data,
      userId: row.user_id,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Delete a search record by ID.
 */
export async function deleteSearchRecord(
  id: string,
  userId?: string | null
): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (userId) {
      await sql`DELETE FROM search_records WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      await sql`DELETE FROM search_records WHERE id = ${id}`;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all search history for a user (or all records if no user).
 */
export async function clearSearchHistory(userId?: string | null): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    if (userId) {
      await sql`DELETE FROM search_records WHERE user_id = ${userId}`;
    } else {
      await sql`DELETE FROM search_records`;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get dashboard statistics.
 */
export async function getSearchStats(userId?: string | null): Promise<StatsResponse> {
  const sql = getDb();
  if (!sql) {
    return { total: 0, verified: 0, probable: 0, catchAll: 0, notFound: 0, avgConfidence: 0 };
  }

  try {
    let rows;
    if (userId) {
      rows = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN email_status = 'verified' THEN 1 END) as verified,
          COUNT(CASE WHEN email_status = 'probable' THEN 1 END) as probable,
          COUNT(CASE WHEN email_status = 'catch_all' THEN 1 END) as catch_all,
          COUNT(CASE WHEN email_status = 'not_found' OR email IS NULL THEN 1 END) as not_found,
          ROUND(AVG(confidence)) as avg_confidence
        FROM search_records WHERE user_id = ${userId}
      `;
    } else {
      rows = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN email_status = 'verified' THEN 1 END) as verified,
          COUNT(CASE WHEN email_status = 'probable' THEN 1 END) as probable,
          COUNT(CASE WHEN email_status = 'catch_all' THEN 1 END) as catch_all,
          COUNT(CASE WHEN email_status = 'not_found' OR email IS NULL THEN 1 END) as not_found,
          ROUND(AVG(confidence)) as avg_confidence
        FROM search_records
      `;
    }

    const row = rows[0] ?? {};
    return {
      total: parseInt(row.total ?? '0', 10),
      verified: parseInt(row.verified ?? '0', 10),
      probable: parseInt(row.probable ?? '0', 10),
      catchAll: parseInt(row.catch_all ?? '0', 10),
      notFound: parseInt(row.not_found ?? '0', 10),
      avgConfidence: parseInt(row.avg_confidence ?? '0', 10),
    };
  } catch {
    return { total: 0, verified: 0, probable: 0, catchAll: 0, notFound: 0, avgConfidence: 0 };
  }
}

/**
 * Look up a cached result by LinkedIn URL hash.
 */
export async function getCachedResult(
  urlHash: string,
  ttlHours: number = 24
): Promise<EnrichmentResult | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT result_data FROM search_records
      WHERE linkedin_url_hash = ${urlHash}
        AND created_at > NOW() - INTERVAL '1 hour' * ${ttlHours}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!rows[0]?.result_data) return null;
    return rows[0].result_data as EnrichmentResult;
  } catch {
    return null;
  }
}

/**
 * Increment the rate limit counter for an IP address.
 * Returns the new count.
 */
export async function incrementRateLimit(
  ip: string,
  date: string
): Promise<number> {
  const sql = getDb();
  if (!sql) return 0;

  try {
    const rows = await sql`
      INSERT INTO rate_limits (ip, date, count) VALUES (${ip}, ${date}::date, 1)
      ON CONFLICT (ip, date) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count
    `;
    return rows[0]?.count ?? 1;
  } catch {
    return 0;
  }
}

/**
 * Get current rate limit count for an IP.
 */
export async function getRateLimitCount(ip: string, date: string): Promise<number> {
  const sql = getDb();
  if (!sql) return 0;

  try {
    const rows = await sql`
      SELECT count FROM rate_limits WHERE ip = ${ip} AND date = ${date}::date
    `;
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}
