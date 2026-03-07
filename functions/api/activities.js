import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(a) {
    return { ...a, done: !!a.done, dueDate: a.due_date };
}

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM activities ORDER BY due_date, priority DESC').all();
        return json(results.map(serialize));
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const a = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO activities
      (id, type, title, deal, due, due_date, done, priority, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(a.id, a.type, a.title, a.deal, a.due, a.dueDate, a.done ? 1 : 0, a.priority)
            .run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        await env.DB.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
