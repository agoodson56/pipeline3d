import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM custom_field_defs ORDER BY created_at').all();
        return json(results);
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPut({ request, env }) {
    try {
        const items = await request.json();
        await env.DB.prepare('DELETE FROM custom_field_defs').run();
        if (items.length > 0) {
            const batch = items.map(cf =>
                env.DB.prepare('INSERT INTO custom_field_defs (id, name, type, options) VALUES (?, ?, ?, ?)')
                    .bind(cf.id, cf.name, cf.type, cf.options || '')
            );
            await env.DB.batch(batch);
        }
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
