import { json, errorResponse, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet(context) {
    const { request, env } = context;
    try {
        const { results } = await env.DB.prepare('SELECT * FROM settings').all();
        const settings = {};
        results.forEach(r => { settings[r.key] = JSON.parse(r.value); });
        return json(settings, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        if (!body || typeof body !== 'object') return json({ error: 'Expected an object' }, 400, request);
        const keys = Object.keys(body);
        if (keys.length > 50) return json({ error: 'Too many settings keys' }, 400, request);
        const batch = Object.entries(body).map(([key, value]) =>
            env.DB.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
                .bind(key, JSON.stringify(value))
        );
        await env.DB.batch(batch);
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
