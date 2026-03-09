-- Pipeline3D — Expand User Roles
-- Adds 'senior_sales' and 'customer_care' as valid role values
-- SQLite doesn't support ALTER CONSTRAINT, so we recreate the table

-- Step 1: Create new table without restrictive CHECK constraint
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep' CHECK(role IN ('admin', 'rep', 'senior_sales', 'customer_care')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'invited', 'deactivated')),
  avatar_color TEXT DEFAULT '#0D9488',
  last_login TEXT,
  must_change_pw INTEGER DEFAULT 0,
  totp_secret TEXT,
  totp_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Step 2: Copy all existing data
INSERT OR IGNORE INTO users_new (id, email, name, password_hash, role, status, avatar_color, last_login, must_change_pw, totp_secret, totp_enabled, created_at, updated_at)
  SELECT id, email, name, password_hash, role, status, avatar_color, last_login,
         COALESCE(must_change_pw, 0), totp_secret, COALESCE(totp_enabled, 0), created_at, updated_at
  FROM users;

-- Step 3: Drop old table and rename
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
