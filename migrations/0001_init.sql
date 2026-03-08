-- Pipeline3D D1 Schema
-- All CRM data stored server-side for cross-device access

CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0D9488',
  stages TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  stage TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  contact TEXT,
  contact_email TEXT,
  company_id TEXT,
  company TEXT,
  probability INTEGER DEFAULT 20,
  days_open INTEGER DEFAULT 0,
  label TEXT DEFAULT 'warm',
  expected_close TEXT,
  notes TEXT NOT NULL DEFAULT '[]',
  history TEXT NOT NULL DEFAULT '[]',
  custom_fields TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_id TEXT,
  company TEXT,
  role TEXT,
  deals INTEGER DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  size TEXT DEFAULT '10-50',
  country TEXT DEFAULT 'USA',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'call',
  title TEXT NOT NULL,
  deal TEXT,
  due TEXT,
  due_date TEXT,
  done INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_field_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY,
  deal_id INTEGER,
  deal_title TEXT,
  deal_stage TEXT,
  contact TEXT,
  email TEXT,
  subject TEXT,
  type TEXT,
  sent_at TEXT,
  opened INTEGER DEFAULT 0,
  opened_at TEXT,
  clicked INTEGER DEFAULT 0,
  clicked_at TEXT,
  eng_score TEXT,
  open_prob INTEGER,
  click_prob INTEGER,
  tip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed default pipelines (stage structure only — no demo data)
INSERT OR IGNORE INTO pipelines (id, name, color, stages) VALUES
  ('p1', 'Sales Pipeline', '#0D9488', '[{"id":"s1","name":"Lead In","color":"#0D9488"},{"id":"s2","name":"Contacted","color":"#f59e0b"},{"id":"s3","name":"Proposal","color":"#3b82f6"},{"id":"s4","name":"Negotiation","color":"#8b5cf6"},{"id":"s5","name":"Won","color":"#10b981"}]'),
  ('p2', 'Partnerships', '#10b981', '[{"id":"s6","name":"Identified","color":"#10b981"},{"id":"s7","name":"Intro","color":"#3b82f6"},{"id":"s8","name":"MOU","color":"#8b5cf6"},{"id":"s9","name":"Signed","color":"#f59e0b"}]');

