/* ═══════════════════════════════════════════════════════════════
   Pipeline3D — API Client (with Auth)
   Talks to Cloudflare Pages Functions → D1
   ═══════════════════════════════════════════════════════════════ */

const BASE = '/api';

/** Get stored auth token */
function getToken() {
    return localStorage.getItem('p3d_auth_token') || '';
}

/** Set auth token */
export function setToken(token) {
    if (token) {
        localStorage.setItem('p3d_auth_token', token);
    } else {
        localStorage.removeItem('p3d_auth_token');
    }
}

/** Core request function — automatically includes auth token */
async function request(path, opts = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE}${path}`, {
        headers,
        ...opts,
    });

    // If 401, clear token and redirect to login
    if (res.status === 401) {
        setToken(null);
        localStorage.removeItem('p3d_user');
        window.dispatchEvent(new Event('p3d-logout'));
        throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// ─── Auth ───────────────────────────────────────────────────
export async function login(email, password) {
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token);
    localStorage.setItem('p3d_user', JSON.stringify(data.user));
    return data;
}

export async function logout() {
    const token = getToken();
    try {
        await fetch(`${BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout', token }),
        });
    } catch { /* ignore logout errors */ }
    setToken(null);
    localStorage.removeItem('p3d_user');
}

export async function verifySession() {
    const token = getToken();
    if (!token) return null;
    try {
        const res = await fetch(`${BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'me', token }),
        });
        const data = await res.json();
        if (!res.ok) {
            setToken(null);
            localStorage.removeItem('p3d_user');
            return null;
        }
        localStorage.setItem('p3d_user', JSON.stringify(data.user));
        return data.user;
    } catch {
        return null;
    }
}

// ─── User Management (admin only) ──────────────────────────
export async function listUsers() {
    const token = getToken();
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list users');
    return data;
}

export async function registerUser(email, name, password, role) {
    const token = getToken();
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', token, email, name, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register user');
    return data;
}

export async function updateUser(userId, updates) {
    const token = getToken();
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', token, userId, ...updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
}

export async function deactivateUser(userId, reactivate = false) {
    const token = getToken();
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', token, userId, reactivate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    return data;
}

export async function changePassword(currentPassword, newPassword, userId = null) {
    const token = getToken();
    const res = await fetch(`${BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', token, currentPassword, newPassword, userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
}

// ─── Pipelines ─────────────────────────────────────────────
export const getPipelines = () => request('/pipelines');
export const savePipeline = (p) => request('/pipelines', { method: 'POST', body: JSON.stringify(p) });
export const savePipelinesBatch = (items) => request('/pipelines', { method: 'PUT', body: JSON.stringify(items) });

// ─── Deals ─────────────────────────────────────────────────
export const getDeals = () => request('/deals');
export const saveDeal = (d) => request('/deals', { method: 'POST', body: JSON.stringify(d) });
export const saveDealsBatch = (items) => request('/deals', { method: 'PUT', body: JSON.stringify(items) });
export const deleteDeal = (id) => request('/deals', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Contacts ──────────────────────────────────────────────
export const getContacts = () => request('/contacts');
export const saveContact = (c) => request('/contacts', { method: 'POST', body: JSON.stringify(c) });
export const deleteContact = (id) => request('/contacts', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Companies ─────────────────────────────────────────────
export const getCompanies = () => request('/companies');
export const saveCompany = (c) => request('/companies', { method: 'POST', body: JSON.stringify(c) });
export const deleteCompany = (id) => request('/companies', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Activities ────────────────────────────────────────────
export const getActivities = () => request('/activities');
export const saveActivity = (a) => request('/activities', { method: 'POST', body: JSON.stringify(a) });
export const deleteActivity = (id) => request('/activities', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Custom Fields ─────────────────────────────────────────
export const getCustomFields = () => request('/customfields');
export const saveCustomFields = (items) => request('/customfields', { method: 'PUT', body: JSON.stringify(items) });

// ─── Emails ────────────────────────────────────────────────
export const getEmails = () => request('/emails');
export const saveEmail = (e) => request('/emails', { method: 'POST', body: JSON.stringify(e) });
export const saveEmailsBatch = (items) => request('/emails', { method: 'PUT', body: JSON.stringify(items) });
export const deleteEmail = (id) => request('/emails', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Settings ──────────────────────────────────────────────
export const getSettings = () => request('/settings');
export const saveSettings = (obj) => request('/settings', { method: 'POST', body: JSON.stringify(obj) });
