import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestGet({ request, env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM companies ORDER BY name').all();
        return json(results, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost({ request, env }) {
    try {
        const c = await request.json();
        const reqErr = validateRequired(c, ['name']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(c.name, 'name', 255) || validateString(c.industry, 'industry', 100) || validateString(c.website, 'website', 500);
        if (strErr) return json({ error: strErr }, 400, request);

        await env.DB.prepare(`INSERT OR REPLACE INTO companies
      (id, name, industry, website, size, country, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(c.id, c.name, c.industry, c.website, c.size, c.country, c.notes)
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        await env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
