-- Pipeline3D — Security Hardening Migration
-- Addresses: rate limiting, audit logging, forced password change, session indexes

-- ═══════════════════════════════════════════════════════════════
-- LOGIN RATE LIMITING — Tracks failed/successful login attempts
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip TEXT,
    attempted_at TEXT DEFAULT (datetime('now')),
    success INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup
    ON login_attempts(email, attempted_at);

-- ═══════════════════════════════════════════════════════════════
-- AUDIT LOG — Records security-relevant actions
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    details TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════
-- FORCE PASSWORD CHANGE FLAG
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE users ADD COLUMN must_change_pw INTEGER DEFAULT 0;

-- Mark the seeded admin for forced password change
UPDATE users SET must_change_pw = 1 WHERE id = 'u_admin' AND password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

-- ═══════════════════════════════════════════════════════════════
-- SESSION PERFORMANCE INDEX
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
