import { json, onRequestOptions as opts } from './_helpers.js';
export { opts as onRequestOptions };

function serializeDeal(d) {
    return {
        ...d,
        notes: JSON.parse(d.notes || '[]'),
        history: JSON.parse(d.history || '[]'),
        customFields: JSON.parse(d.custom_fields || '{}'),
        pipelineId: d.pipeline_id,
        contactEmail: d.contact_email,
        companyId: d.company_id,
        daysOpen: d.days_open,
        expectedClose: d.expected_close,
    };
}

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM deals ORDER BY created_at DESC').all();
        return json(results.map(serializeDeal));
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const d = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO deals
      (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company,
       probability, days_open, label, expected_close, notes, history, custom_fields, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(d.id, d.title, d.value, d.stage, d.pipelineId, d.contact, d.contactEmail,
                d.companyId, d.company, d.probability, d.daysOpen || 0, d.label,
                d.expectedClose, JSON.stringify(d.notes || []),
                JSON.stringify(d.history || []), JSON.stringify(d.customFields || {}))
            .run();
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestPut({ request, env }) {
    try {
        const items = await request.json();
        const batch = items.map(d =>
            env.DB.prepare(`INSERT OR REPLACE INTO deals
        (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company,
         probability, days_open, label, expected_close, notes, history, custom_fields, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
                .bind(d.id, d.title, d.value, d.stage, d.pipelineId, d.contact, d.contactEmail,
                    d.companyId, d.company, d.probability, d.daysOpen || 0, d.label,
                    d.expectedClose, JSON.stringify(d.notes || []),
                    JSON.stringify(d.history || []), JSON.stringify(d.customFields || {}))
        );
        await env.DB.batch(batch);
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        if (Array.isArray(id)) {
            const batch = id.map(i => env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(i));
            await env.DB.batch(batch);
        } else {
            await env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(id).run();
        }
        return json({ success: true });
    } catch (e) { return json({ error: e.message }, 500); }
}
