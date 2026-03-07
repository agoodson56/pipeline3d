import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(a) {
    return { ...a, done: !!a.done, dueDate: a.due_date };
}

export async function onRequestGet({ request, env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM activities ORDER BY due_date, priority DESC').all();
        return json(results.map(serialize), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost({ request, env }) {
    try {
        const a = await request.json();
        const reqErr = validateRequired(a, ['title']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(a.title, 'title', 500) || validateString(a.type, 'type', 50);
        if (strErr) return json({ error: strErr }, 400, request);

        await env.DB.prepare(`INSERT OR REPLACE INTO activities
      (id, type, title, deal, due, due_date, done, priority, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(a.id, a.type, a.title, a.deal, a.due, a.dueDate, a.done ? 1 : 0, a.priority)
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        await env.DB.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
