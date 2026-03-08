import { json, errorResponse, onRequestOptions as opts, getUser, isAdmin } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet(context) {
    const { request, env } = context;
    try {
        const { results } = await env.DB.prepare('SELECT * FROM pipelines ORDER BY created_at').all();
        const data = results.map(r => ({ ...r, stages: JSON.parse(r.stages || '[]') }));
        return json(data, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    if (!isAdmin(context)) return json({ error: 'Admin access required' }, 403, request);
    try {
        const body = await request.json();
        if (!body.name) return json({ error: 'name is required' }, 400, request);
        await env.DB.prepare(
            'INSERT OR REPLACE INTO pipelines (id, name, color, stages, updated_at) VALUES (?, ?, ?, ?, datetime("now"))'
        ).bind(body.id, body.name, body.color, JSON.stringify(body.stages || [])).run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    if (!isAdmin(context)) return json({ error: 'Admin access required' }, 403, request);
    try {
        const items = await request.json();
        if (!Array.isArray(items)) return json({ error: 'Expected an array' }, 400, request);
        const batch = items.map(p =>
            env.DB.prepare('INSERT OR REPLACE INTO pipelines (id, name, color, stages, updated_at) VALUES (?, ?, ?, ?, datetime("now"))')
                .bind(p.id, p.name, p.color, JSON.stringify(p.stages || []))
        );
        await env.DB.batch(batch);
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
