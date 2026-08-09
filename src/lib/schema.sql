-- ============================================================
-- Resolve — Database Schema
-- Run this once against your Neon PostgreSQL database
-- or let the app apply it automatically on first request.
-- ============================================================

CREATE TABLE IF NOT EXISTS search_records (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  linkedin_url TEXT NOT NULL,
  linkedin_url_hash TEXT NOT NULL,
  person_name  TEXT,
  person_title TEXT,
  company_name TEXT,
  company_domain TEXT,
  email        TEXT,
  email_status TEXT,
  confidence   INTEGER,
  sources      TEXT[],
  result_data  JSONB,
  user_id      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_records_hash      ON search_records(linkedin_url_hash);
CREATE INDEX IF NOT EXISTS idx_search_records_created   ON search_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_records_user      ON search_records(user_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip    TEXT NOT NULL,
  date  DATE NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (ip, date)
);
