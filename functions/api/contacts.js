import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(c) {
    return { ...c, tags: JSON.parse(c.tags || '[]'), companyId: c.company_id };
}

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM contacts ORDER BY name').all();
        return json(results.map(serialize));
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const c = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO contacts
      (id, name, email, phone, company_id, company, role, deals, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(c.id, c.name, c.email, c.phone, c.companyId, c.company, c.role,
                c.deals || 0, JSON.stringify(c.tags || []))
            .run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
