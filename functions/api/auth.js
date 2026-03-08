/**
 * Pipeline3D — Auth API (Security Hardened)
 * PBKDF2 password hashing, login rate limiting, audit logging,
 * forced password change, session invalidation on pw change.
 *
 * POST /api/auth — body: { action: 'login' | 'logout' | 'me' | 'register' | 'list' | 'update' | 'deactivate' | 'change-password' }
 */
import { json, errorResponse, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

// ═══════════════════════════════════════════════════════════════
// CRYPTO HELPERS
// ═══════════════════════════════════════════════════════════════

/** Legacy SHA-256 (kept for backward-compat migration only) */
async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** PBKDF2 hash — returns "pbkdf2:<salt>:<hash>" */
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const hashHex = [...new Uint8Array(derived)].map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:${saltHex}:${hashHex}`;
}

/** Verify password against stored hash (supports both PBKDF2 and legacy SHA-256) */
async function verifyPassword(password, storedHash) {
    if (storedHash.startsWith('pbkdf2:')) {
        const parts = storedHash.split(':');
        const saltHex = parts[1];
        const expectedHash = parts[2];
        const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
        const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
        const computedHash = [...new Uint8Array(derived)].map(b => b.toString(16).padStart(2, '0')).join('');
        return computedHash === expectedHash;
    }
    // Legacy SHA-256 (64 hex chars, no colons)
    const legacyHash = await sha256(password);
    return legacyHash === storedHash;
}

/** Is this a legacy SHA-256 hash? (needs upgrade to PBKDF2) */
function isLegacyHash(storedHash) {
    return !storedHash.startsWith('pbkdf2:');
}

/** Generate a secure random session token */
function generateToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate user ID */
function generateUserId() {
    return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const AVATAR_COLORS = ['#0D9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function checkRateLimit(email, env) {
    try {
        const result = await env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM login_attempts
             WHERE email = ? AND success = 0 AND attempted_at > datetime('now', '-${LOCKOUT_MINUTES} minutes')`
        ).bind(email.toLowerCase().trim()).first();
        return (result?.cnt || 0) >= MAX_LOGIN_ATTEMPTS;
    } catch { return false; /* table may not exist yet — fail open */ }
}

async function recordLoginAttempt(email, success, env, request) {
    try {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        await env.DB.prepare(
            'INSERT INTO login_attempts (email, ip, success) VALUES (?, ?, ?)'
        ).bind(email.toLowerCase().trim(), ip, success ? 1 : 0).run();
    } catch { /* table may not exist yet */ }
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════
async function audit(env, request, action, userId, userEmail, details) {
    try {
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        await env.DB.prepare(
            'INSERT INTO audit_log (action, user_id, user_email, details, ip) VALUES (?, ?, ?, ?, ?)'
        ).bind(action, userId, userEmail, details, ip).run();
    } catch { /* table may not exist yet — don't break auth flow */ }
}

// ═══════════════════════════════════════════════════════════════
// SESSION CLEANUP (runs on login — removes expired sessions)
// ═══════════════════════════════════════════════════════════════
async function cleanExpiredSessions(env) {
    try {
        await env.DB.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
        // Also clean old login attempts (older than 24h)
        await env.DB.prepare("DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-1 day')").run();
    } catch { /* non-critical */ }
}


// ═══════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'login':
                return handleLogin(body, env, request);
            case 'logout':
                return handleLogout(body, env, request);
            case 'me':
                return handleMe(body, env, request);
            case 'register':
                return handleRegister(body, env, request);
            case 'list':
                return handleListUsers(body, env, request);
            case 'update':
                return handleUpdateUser(body, env, request);
            case 'deactivate':
                return handleDeactivate(body, env, request);
            case 'change-password':
                return handleChangePassword(body, env, request);
            default:
                return json({ error: 'Unknown action' }, 400, request);
        }
    } catch (e) { return errorResponse(e, request); }
}

// ─── LOGIN ──────────────────────────────────────────────────
async function handleLogin({ email, password }, env, request) {
    if (!email || !password) return json({ error: 'Email and password are required' }, 400, request);

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const isLocked = await checkRateLimit(normalizedEmail, env);
    if (isLocked) {
        await audit(env, request, 'login_blocked', null, normalizedEmail, 'Rate limit exceeded');
        return json({ error: `Too many failed attempts. Please try again in ${LOCKOUT_MINUTES} minutes.` }, 429, request);
    }

    // Look up user by email only (not by hash — needed for PBKDF2)
    const user = await env.DB.prepare(
        'SELECT id, email, name, role, status, avatar_color, password_hash, must_change_pw FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (!user) {
        await recordLoginAttempt(normalizedEmail, false, env, request);
        await audit(env, request, 'login_failed', null, normalizedEmail, 'User not found');
        return json({ error: 'Invalid email or password' }, 401, request);
    }

    if (user.status === 'deactivated') {
        await audit(env, request, 'login_failed', user.id, normalizedEmail, 'Account deactivated');
        return json({ error: 'Account has been deactivated. Contact your admin.' }, 403, request);
    }

    // Verify password (supports both PBKDF2 and legacy SHA-256)
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
        await recordLoginAttempt(normalizedEmail, false, env, request);
        await audit(env, request, 'login_failed', user.id, normalizedEmail, 'Wrong password');
        return json({ error: 'Invalid email or password' }, 401, request);
    }

    // Success — record it
    await recordLoginAttempt(normalizedEmail, true, env, request);

    // Upgrade legacy SHA-256 hash to PBKDF2 (silent migration)
    if (isLegacyHash(user.password_hash)) {
        const upgradedHash = await hashPassword(password);
        await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(upgradedHash, user.id).run();
    }

    // Create session (30 day expiry)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, user.id, expiresAt).run();

    // Update last login & status (invited → active on first login)
    await env.DB.prepare(
        "UPDATE users SET last_login = datetime('now'), status = 'active', updated_at = datetime('now') WHERE id = ?"
    ).bind(user.id).run();

    // Clean up expired sessions periodically
    await cleanExpiredSessions(env);

    await audit(env, request, 'login_success', user.id, normalizedEmail, null);

    return json({
        success: true,
        token,
        user: {
            id: user.id, email: user.email, name: user.name, role: user.role,
            avatarColor: user.avatar_color, mustChangePw: !!user.must_change_pw,
        },
    }, 200, request);
}

// ─── LOGOUT ─────────────────────────────────────────────────
async function handleLogout({ token }, env, request) {
    if (token) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    return json({ success: true }, 200, request);
}

// ─── ME (verify session) ────────────────────────────────────
async function handleMe({ token }, env, request) {
    if (!token) return json({ error: 'No token provided' }, 401, request);

    const session = await env.DB.prepare(
        `SELECT s.user_id, s.expires_at, u.id, u.email, u.name, u.role, u.status, u.avatar_color, u.must_change_pw
         FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`
    ).bind(token).first();

    if (!session) return json({ error: 'Invalid session' }, 401, request);
    if (new Date(session.expires_at) < new Date()) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        return json({ error: 'Session expired' }, 401, request);
    }
    if (session.status === 'deactivated') return json({ error: 'Account deactivated' }, 403, request);

    return json({
        user: {
            id: session.id, email: session.email, name: session.name, role: session.role,
            avatarColor: session.avatar_color, mustChangePw: !!session.must_change_pw,
        },
    }, 200, request);
}

// ─── REGISTER (admin only) ──────────────────────────────────
async function handleRegister({ token, email, name, password, role }, env, request) {
    const admin = await getSessionUser(token, env);
    if (!admin || admin.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);

    if (!email || !name || !password) return json({ error: 'Email, name, and password are required' }, 400, request);
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400, request);

    // Check if email already exists (generic error to prevent enumeration)
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
    if (existing) return json({ error: 'Unable to create account. Please check the details and try again.' }, 409, request);

    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    await env.DB.prepare(
        `INSERT INTO users (id, email, name, password_hash, role, status, avatar_color) VALUES (?, ?, ?, ?, ?, 'invited', ?)`
    ).bind(userId, email.toLowerCase().trim(), name.trim(), passwordHash, role || 'rep', color).run();

    await audit(env, request, 'user_registered', admin.id, admin.email, `Created user ${email} (${role || 'rep'})`);

    return json({ success: true, userId }, 200, request);
}

// ─── LIST USERS (admin only) ───────────────────────────────
async function handleListUsers({ token }, env, request) {
    const user = await getSessionUser(token, env);
    if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);

    const { results } = await env.DB.prepare(
        "SELECT id, email, name, role, status, avatar_color, last_login, created_at FROM users ORDER BY created_at"
    ).all();

    const users = results.map(u => ({
        id: u.id, email: u.email, name: u.name, role: u.role, status: u.status,
        avatarColor: u.avatar_color, lastLogin: u.last_login, createdAt: u.created_at,
    }));

    return json(users, 200, request);
}

// ─── UPDATE USER (admin only) ───────────────────────────────
async function handleUpdateUser({ token, userId, name, role, email }, env, request) {
    const admin = await getSessionUser(token, env);
    if (!admin || admin.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);
    if (!userId) return json({ error: 'userId is required' }, 400, request);

    const updates = [];
    const binds = [];
    if (name) { updates.push('name = ?'); binds.push(name.trim()); }
    if (role) { updates.push('role = ?'); binds.push(role); }
    if (email) { updates.push('email = ?'); binds.push(email.toLowerCase().trim()); }
    updates.push("updated_at = datetime('now')");
    binds.push(userId);

    await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
    await audit(env, request, 'user_updated', admin.id, admin.email, `Updated user ${userId}`);

    return json({ success: true }, 200, request);
}

// ─── DEACTIVATE USER (admin only) ──────────────────────────
async function handleDeactivate({ token, userId, reactivate }, env, request) {
    const admin = await getSessionUser(token, env);
    if (!admin || admin.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);
    if (!userId) return json({ error: 'userId is required' }, 400, request);
    if (userId === admin.id) return json({ error: 'Cannot deactivate yourself' }, 400, request);

    const newStatus = reactivate ? 'active' : 'deactivated';
    await env.DB.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(newStatus, userId).run();

    // Invalidate all sessions for deactivated user
    if (!reactivate) {
        await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
    }

    await audit(env, request, reactivate ? 'user_reactivated' : 'user_deactivated', admin.id, admin.email, `User ${userId}`);

    return json({ success: true }, 200, request);
}

// ─── CHANGE PASSWORD ────────────────────────────────────────
async function handleChangePassword({ token, currentPassword, newPassword, userId }, env, request) {
    const sessionUser = await getSessionUser(token, env);
    if (!sessionUser) return json({ error: 'Not authenticated' }, 401, request);

    // Admin can reset any user's password, users can change their own
    const targetId = (sessionUser.role === 'admin' && userId) ? userId : sessionUser.id;

    // If changing own password, ALWAYS require current password
    if (targetId === sessionUser.id) {
        if (!currentPassword) return json({ error: 'Current password is required' }, 400, request);
        // Look up current hash
        const userRecord = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(targetId).first();
        if (!userRecord) return json({ error: 'User not found' }, 404, request);
        const valid = await verifyPassword(currentPassword, userRecord.password_hash);
        if (!valid) return json({ error: 'Current password is incorrect' }, 400, request);
    }

    if (!newPassword || newPassword.length < 8) return json({ error: 'New password must be at least 8 characters' }, 400, request);

    const newHash = await hashPassword(newPassword);
    await env.DB.prepare("UPDATE users SET password_hash = ?, must_change_pw = 0, updated_at = datetime('now') WHERE id = ?").bind(newHash, targetId).run();

    // Invalidate all OTHER sessions for this user (security: old sessions can't be reused)
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').bind(targetId, token).run();

    await audit(env, request, 'password_changed', sessionUser.id, sessionUser.email,
        targetId === sessionUser.id ? 'Changed own password' : `Admin reset password for ${targetId}`);

    return json({ success: true }, 200, request);
}

// ─── HELPER: Get user from session token ────────────────────
async function getSessionUser(token, env) {
    if (!token) return null;
    const result = await env.DB.prepare(
        'SELECT u.id, u.email, u.name, u.role, u.status FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now") AND u.status != "deactivated"'
    ).bind(token).first();
    return result || null;
}
