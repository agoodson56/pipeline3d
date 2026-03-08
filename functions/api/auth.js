/**
 * Pipeline3D — Auth API
 * Handles login, logout, session verification, and user management.
 * 
 * POST /api/auth   — body: { action: 'login' | 'logout' | 'me' | 'register' | 'list' | 'update' | 'deactivate' }
 */
import { json, errorResponse, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

/** Simple SHA-256 hash using Web Crypto API (available in Workers) */
async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
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

    const passwordHash = await sha256(password);
    const user = await env.DB.prepare(
        'SELECT id, email, name, role, status, avatar_color FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email.toLowerCase().trim(), passwordHash).first();

    if (!user) return json({ error: 'Invalid email or password' }, 401, request);
    if (user.status === 'deactivated') return json({ error: 'Account has been deactivated. Contact your admin.' }, 403, request);

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

    return json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarColor: user.avatar_color },
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
        'SELECT s.user_id, s.expires_at, u.id, u.email, u.name, u.role, u.status, u.avatar_color FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?'
    ).bind(token).first();

    if (!session) return json({ error: 'Invalid session' }, 401, request);
    if (new Date(session.expires_at) < new Date()) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        return json({ error: 'Session expired' }, 401, request);
    }
    if (session.status === 'deactivated') return json({ error: 'Account deactivated' }, 403, request);

    return json({
        user: { id: session.id, email: session.email, name: session.name, role: session.role, avatarColor: session.avatar_color },
    }, 200, request);
}

// ─── REGISTER (admin only) ──────────────────────────────────
async function handleRegister({ token, email, name, password, role }, env, request) {
    // Verify admin
    const admin = await getSessionUser(token, env);
    if (!admin || admin.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);

    if (!email || !name || !password) return json({ error: 'Email, name, and password are required' }, 400, request);
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400, request);

    // Check if email already exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
    if (existing) return json({ error: 'A user with this email already exists' }, 409, request);

    const userId = generateUserId();
    const passwordHash = await sha256(password);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    await env.DB.prepare(
        `INSERT INTO users (id, email, name, password_hash, role, status, avatar_color) VALUES (?, ?, ?, ?, ?, 'invited', ?)`
    ).bind(userId, email.toLowerCase().trim(), name.trim(), passwordHash, role || 'rep', color).run();

    return json({ success: true, userId }, 200, request);
}

// ─── LIST USERS (admin only) ───────────────────────────────
async function handleListUsers({ token }, env, request) {
    const user = await getSessionUser(token, env);
    if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403, request);

    const { results } = await env.DB.prepare(
        "SELECT id, email, name, role, status, avatar_color, last_login, created_at FROM users ORDER BY created_at"
    ).all();

    // Map snake_case to camelCase for frontend
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

    // Build dynamic update
    const updates = [];
    const binds = [];
    if (name) { updates.push('name = ?'); binds.push(name.trim()); }
    if (role) { updates.push('role = ?'); binds.push(role); }
    if (email) { updates.push('email = ?'); binds.push(email.toLowerCase().trim()); }
    updates.push("updated_at = datetime('now')");
    binds.push(userId);

    await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
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

    return json({ success: true }, 200, request);
}

// ─── CHANGE PASSWORD ────────────────────────────────────────
async function handleChangePassword({ token, currentPassword, newPassword, userId }, env, request) {
    const sessionUser = await getSessionUser(token, env);
    if (!sessionUser) return json({ error: 'Not authenticated' }, 401, request);

    // Admin can reset any user's password, users can change their own
    const targetId = (sessionUser.role === 'admin' && userId) ? userId : sessionUser.id;

    // If changing own password, verify current password
    if (targetId === sessionUser.id && currentPassword) {
        const currentHash = await sha256(currentPassword);
        const check = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND password_hash = ?').bind(targetId, currentHash).first();
        if (!check) return json({ error: 'Current password is incorrect' }, 400, request);
    }

    if (!newPassword || newPassword.length < 6) return json({ error: 'New password must be at least 6 characters' }, 400, request);

    const newHash = await sha256(newPassword);
    await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(newHash, targetId).run();

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
