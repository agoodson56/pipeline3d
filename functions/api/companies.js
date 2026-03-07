import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM companies ORDER BY name').all();
        return json(results);
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const c = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO companies
      (id, name, industry, website, size, country, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(c.id, c.name, c.industry, c.website, c.size, c.country, c.notes)
            .run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        await env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
