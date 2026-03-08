-- Pipeline3D Auth Migration
-- Adds user authentication and data ownership (Pipedrive model)

-- ═══════════════════════════════════════════════════════════════
-- USERS TABLE — Every salesperson gets a login
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep' CHECK(role IN ('admin', 'rep')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'invited', 'deactivated')),
  avatar_color TEXT DEFAULT '#0D9488',
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════
-- SESSIONS TABLE — Secure session tokens
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ═══════════════════════════════════════════════════════════════
-- ADD OWNER COLUMNS — Deals, Activities, Emails are per-user
-- Contacts & Companies remain shared (Pipedrive best practice)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE deals ADD COLUMN owner_id TEXT DEFAULT NULL;
ALTER TABLE activities ADD COLUMN owner_id TEXT DEFAULT NULL;
ALTER TABLE email_log ADD COLUMN owner_id TEXT DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════
-- SEED DEFAULT ADMIN USER
-- Password: admin123 (SHA-256 hashed — user should change on first login)
-- ═══════════════════════════════════════════════════════════════
INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, avatar_color)
VALUES (
  'u_admin',
  'admin@pipeline3d.com',
  'Admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'admin',
  'active',
  '#0D9488'
);

