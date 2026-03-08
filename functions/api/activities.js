import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString, getUser, isAdmin } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(a) {
    return { ...a, done: !!a.done, dueDate: a.due_date, ownerId: a.owner_id };
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        let results;
        if (isAdmin(context)) {
            ({ results } = await env.DB.prepare('SELECT * FROM activities ORDER BY due_date, priority DESC').all());
        } else {
            ({ results } = await env.DB.prepare('SELECT * FROM activities WHERE owner_id = ? ORDER BY due_date, priority DESC').bind(user.id).all());
        }
        return json(results.map(serialize), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        const a = await request.json();
        const reqErr = validateRequired(a, ['title']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(a.title, 'title', 500) || validateString(a.type, 'type', 50);
        if (strErr) return json({ error: strErr }, 400, request);

        const ownerId = (isAdmin(context) && a.ownerId) ? a.ownerId : user.id;

        await env.DB.prepare(`INSERT OR REPLACE INTO activities
      (id, type, title, deal, due, due_date, done, priority, owner_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(a.id, a.type, a.title, a.deal, a.due, a.dueDate, a.done ? 1 : 0, a.priority, ownerId)
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        if (isAdmin(context)) {
            await env.DB.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
        } else {
            await env.DB.prepare('DELETE FROM activities WHERE id = ? AND owner_id = ?').bind(id, user.id).run();
        }
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
