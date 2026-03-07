/* ═══════════════════════════════════════════════════════════════
   Pipeline3D — API Client
   Talks to Cloudflare Pages Functions → D1
   ═══════════════════════════════════════════════════════════════ */

const BASE = '/api';

async function request(path, opts = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
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
