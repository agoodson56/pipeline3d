import { json, errorResponse, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

function serialize(e) {
    return {
        ...e,
        opened: !!e.opened, clicked: !!e.clicked,
        dealId: e.deal_id, dealTitle: e.deal_title, dealStage: e.deal_stage,
        sentAt: e.sent_at, openedAt: e.opened_at, clickedAt: e.clicked_at,
        engScore: e.eng_score, openProb: e.open_prob, clickProb: e.click_prob,
    };
}

export async function onRequestGet({ request, env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM email_log ORDER BY created_at DESC').all();
        return json(results.map(serialize), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost({ request, env }) {
    try {
        const e = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO email_log
      (id, deal_id, deal_title, deal_stage, contact, email, subject, type,
       sent_at, opened, opened_at, clicked, clicked_at, eng_score, open_prob, click_prob, tip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(e.id, e.dealId, e.dealTitle, e.dealStage, e.contact, e.email, e.subject, e.type,
                e.sentAt, e.opened ? 1 : 0, e.openedAt, e.clicked ? 1 : 0, e.clickedAt,
                e.engScore, e.openProb, e.clickProb, e.tip)
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPut({ request, env }) {
    try {
        const items = await request.json();
        if (!Array.isArray(items)) return json({ error: 'Expected an array' }, 400, request);
        const batch = items.map(e =>
            env.DB.prepare(`INSERT OR REPLACE INTO email_log
        (id, deal_id, deal_title, deal_stage, contact, email, subject, type,
         sent_at, opened, opened_at, clicked, clicked_at, eng_score, open_prob, click_prob, tip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(e.id, e.dealId, e.dealTitle, e.dealStage, e.contact, e.email, e.subject, e.type,
                    e.sentAt, e.opened ? 1 : 0, e.openedAt, e.clicked ? 1 : 0, e.clickedAt,
                    e.engScore, e.openProb, e.clickProb, e.tip)
        );
        await env.DB.batch(batch);
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const body = await request.json();
        const { id } = body;
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        // Bulk delete requires explicit confirmation flag
        if (id === 'all') {
            if (!body.confirm) {
                return json({ error: 'Bulk delete requires { confirm: true }' }, 400, request);
            }
            await env.DB.prepare('DELETE FROM email_log').run();
        } else {
            await env.DB.prepare('DELETE FROM email_log WHERE id = ?').bind(id).run();
        }
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
