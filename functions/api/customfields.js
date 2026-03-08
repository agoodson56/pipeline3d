import { json, errorResponse, onRequestOptions as opts, isAdmin } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet(context) {
    const { request, env } = context;
    try {
        const { results } = await env.DB.prepare('SELECT * FROM custom_field_defs ORDER BY created_at').all();
        return json(results, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    if (!isAdmin(context)) return json({ error: 'Admin access required' }, 403, request);
    try {
        const items = await request.json();
        if (!Array.isArray(items)) return json({ error: 'Expected an array' }, 400, request);
        if (items.length > 100) return json({ error: 'Maximum 100 custom fields' }, 400, request);
        await env.DB.prepare('DELETE FROM custom_field_defs').run();
        if (items.length > 0) {
            const batch = items.map(cf =>
                env.DB.prepare('INSERT INTO custom_field_defs (id, name, type, options) VALUES (?, ?, ?, ?)')
                    .bind(cf.id, cf.name, cf.type, cf.options || '')
            );
            await env.DB.batch(batch);
        }
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
