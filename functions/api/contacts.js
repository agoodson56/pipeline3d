import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(c) {
    return { ...c, tags: JSON.parse(c.tags || '[]'), companyId: c.company_id };
}

export async function onRequestGet(context) {
    const { request, env } = context;
    try {
        // Contacts are shared across the team (Pipedrive best practice — prevents duplicates)
        const { results } = await env.DB.prepare('SELECT * FROM contacts ORDER BY name').all();
        return json(results.map(serialize), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const c = await request.json();
        const reqErr = validateRequired(c, ['name']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(c.name, 'name', 255) || validateString(c.email, 'email', 320) || validateString(c.phone, 'phone', 50) || validateString(c.mobile, 'mobile', 50);
        if (strErr) return json({ error: strErr }, 400, request);

        await env.DB.prepare(`INSERT OR REPLACE INTO contacts
      (id, name, email, phone, mobile, company_id, company, role, deals, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(c.id, c.name, c.email, c.phone, c.mobile || null, c.companyId, c.company, c.role,
                c.deals || 0, JSON.stringify(c.tags || []))
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
