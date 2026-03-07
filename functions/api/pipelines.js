import { json, onRequestOptions as opts, corsHeaders } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM pipelines ORDER BY created_at').all();
        const data = results.map(r => ({ ...r, stages: JSON.parse(r.stages || '[]') }));
        return json(data);
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        await env.DB.prepare(
            'INSERT OR REPLACE INTO pipelines (id, name, color, stages, updated_at) VALUES (?, ?, ?, ?, datetime("now"))'
        ).bind(body.id, body.name, body.color, JSON.stringify(body.stages || [])).run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPut({ request, env }) {
    try {
        const items = await request.json();
        const batch = items.map(p =>
            env.DB.prepare('INSERT OR REPLACE INTO pipelines (id, name, color, stages, updated_at) VALUES (?, ?, ?, ?, datetime("now"))')
                .bind(p.id, p.name, p.color, JSON.stringify(p.stages || []))
        );
        await env.DB.batch(batch);
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
