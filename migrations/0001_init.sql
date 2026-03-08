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

-- Seed default pipelines
INSERT OR IGNORE INTO pipelines (id, name, color, stages) VALUES
  ('p1', 'Sales Pipeline', '#0D9488', '[{"id":"s1","name":"Lead In","color":"#0D9488"},{"id":"s2","name":"Contacted","color":"#f59e0b"},{"id":"s3","name":"Proposal","color":"#3b82f6"},{"id":"s4","name":"Negotiation","color":"#8b5cf6"},{"id":"s5","name":"Won","color":"#10b981"}]'),
  ('p2', 'Partnerships', '#10b981', '[{"id":"s6","name":"Identified","color":"#10b981"},{"id":"s7","name":"Intro","color":"#3b82f6"},{"id":"s8","name":"MOU","color":"#8b5cf6"},{"id":"s9","name":"Signed","color":"#f59e0b"}]');

-- Seed default companies
INSERT OR IGNORE INTO companies (id, name, industry, website, size, country, notes) VALUES
  ('co1', 'Acme Corp', 'Technology', 'acme.com', '50-200', 'USA', 'Key enterprise account'),
  ('co2', 'TechFlow', 'SaaS', 'techflow.io', '10-50', 'USA', ''),
  ('co3', 'Nexus Systems', 'IT Services', 'nexus.com', '200-1000', 'UK', ''),
  ('co4', 'Quantum Analytics', 'Data & AI', 'quantum.ai', '10-50', 'USA', ''),
  ('co5', 'Harbor Logistics', 'Logistics', 'harbor.com', '1000+', 'USA', ''),
  ('co6', 'Cascade Corp', 'Enterprise', 'cascade.io', '1000+', 'USA', 'Large contract potential');

-- Seed default contacts
INSERT OR IGNORE INTO contacts (id, name, email, phone, company_id, company, role, deals, tags) VALUES
  (1, 'Sarah Chen', 'sarah@acme.com', '+1(555)234-5678', 'co1', 'Acme Corp', 'VP Engineering', 2, '["decision-maker","technical"]'),
  (2, 'James Patel', 'james@techflow.io', '+1(555)345-6789', 'co2', 'TechFlow', 'CTO', 1, '["executive"]'),
  (3, 'Olivia Marsh', 'o.marsh@nexus.com', '+1(555)456-7890', 'co3', 'Nexus Systems', 'Director IT', 3, '["decision-maker"]'),
  (4, 'Liam Torres', 'liam@quantum.ai', '+1(555)567-8901', 'co4', 'Quantum Analytics', 'CEO', 1, '["executive","champion"]'),
  (5, 'Noah Williams', 'noah@harbor.com', '+1(555)789-0123', 'co5', 'Harbor Logistics', 'Ops Lead', 2, '["champion"]'),
  (6, 'Marcus Green', 'mgreen@cascade.io', '+1(555)901-2345', 'co6', 'Cascade Corp', 'IT Manager', 4, '["decision-maker"]');

-- Seed default deals
INSERT OR IGNORE INTO deals (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company, probability, days_open, label, notes, history, expected_close, custom_fields) VALUES
  (1, 'Acme Redesign', 12500, 'Lead In', 'p1', 'Sarah Chen', 'sarah@acme.com', 'co1', 'Acme Corp', 20, 3, 'hot', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Mar 4"}]', 'Apr', '{}'),
  (2, 'TechFlow API Integration', 45000, 'Contacted', 'p1', 'James Patel', 'james@techflow.io', 'co2', 'TechFlow', 40, 7, 'warm', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Feb 28"}]', 'Apr', '{}'),
  (3, 'Nexus Platform License', 89000, 'Proposal', 'p1', 'Olivia Marsh', 'o.marsh@nexus.com', 'co3', 'Nexus Systems', 60, 12, 'hot', '[{"id":1,"text":"They loved the demo.","date":"Mar 5"}]', '[{"id":1,"action":"created","detail":"Deal created","date":"Feb 23"},{"id":2,"action":"stage","detail":"Moved to Proposal","date":"Mar 1"}]', 'Apr', '{}'),
  (4, 'Quantum Analytics Suite', 34000, 'Negotiation', 'p1', 'Liam Torres', 'liam@quantum.ai', 'co4', 'Quantum Analytics', 75, 19, 'warm', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Feb 16"}]', 'Mar', '{}'),
  (5, 'Stellar CRM Upgrade', 22000, 'Won', 'p1', 'Emma Liu', 'emma@stellar.co', NULL, 'Stellar Inc', 100, 28, 'cold', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Feb 7"},{"id":2,"action":"stage","detail":"Moved to Won","date":"Mar 1"}]', 'Mar', '{}'),
  (6, 'Harbor Logistics Suite', 67000, 'Lead In', 'p1', 'Noah Williams', 'noah@harbor.com', 'co5', 'Harbor Logistics', 15, 1, 'warm', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Mar 6"}]', 'May', '{}'),
  (7, 'Cascade ERP Migration', 120000, 'Proposal', 'p1', 'Marcus Green', 'mgreen@cascade.io', 'co6', 'Cascade Corp', 55, 9, 'hot', '[{"id":1,"text":"Board needs to approve budget.","date":"Mar 3"}]', '[{"id":1,"action":"created","detail":"Deal created","date":"Feb 26"}]', 'Apr', '{}'),
  (8, 'Harbor Partnership', 25000, 'Identified', 'p2', 'Noah Williams', 'noah@harbor.com', 'co5', 'Harbor Logistics', 40, 5, 'warm', '[]', '[{"id":1,"action":"created","detail":"Deal created","date":"Mar 2"}]', 'May', '{}');

-- Seed default activities
INSERT OR IGNORE INTO activities (id, type, title, deal, due, due_date, done, priority) VALUES
  (1, 'call', 'Follow-up with Sarah Chen', 'Acme Redesign', 'Today 2pm', '2026-03-07', 0, 'high'),
  (2, 'email', 'Send revised proposal to Marcus', 'Cascade ERP Migration', 'Today 4pm', '2026-03-07', 0, 'high'),
  (3, 'meeting', 'Demo with Liam Torres', 'Quantum Analytics Suite', 'Tomorrow 10am', '2026-03-08', 0, 'medium'),
  (4, 'call', 'Discovery call - Noah Williams', 'Harbor Logistics Suite', 'Wed 11am', '2026-03-11', 0, 'medium'),
  (5, 'email', 'Case studies to Olivia', 'Nexus Platform License', 'Mar 4 10am', '2026-03-04', 0, 'high');
