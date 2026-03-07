import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM settings').all();
        const settings = {};
        results.forEach(r => { settings[r.key] = JSON.parse(r.value); });
        return json(settings);
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const batch = Object.entries(body).map(([key, value]) =>
            env.DB.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
                .bind(key, JSON.stringify(value))
        );
        await env.DB.batch(batch);
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
