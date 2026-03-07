import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString, validateNumber } from './_helpers.js';
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

export async function onRequestGet({ request, env }) {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM deals ORDER BY created_at DESC').all();
        return json(results.map(serializeDeal), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost({ request, env }) {
    try {
        const d = await request.json();
        // Validate
        const reqErr = validateRequired(d, ['title', 'stage']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(d.title, 'title', 255) || validateString(d.stage, 'stage', 100);
        if (strErr) return json({ error: strErr }, 400, request);
        const numErr = validateNumber(d.value, 'value', 0) || validateNumber(d.probability, 'probability', 0, 100);
        if (numErr) return json({ error: numErr }, 400, request);

        await env.DB.prepare(`INSERT OR REPLACE INTO deals
      (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company,
       probability, days_open, label, expected_close, notes, history, custom_fields, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(d.id, d.title, d.value, d.stage, d.pipelineId, d.contact, d.contactEmail,
                d.companyId, d.company, d.probability, d.daysOpen || 0, d.label,
                d.expectedClose, JSON.stringify(d.notes || []),
                JSON.stringify(d.history || []), JSON.stringify(d.customFields || {}))
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPut({ request, env }) {
    try {
        const items = await request.json();
        if (!Array.isArray(items)) return json({ error: 'Expected an array' }, 400, request);
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
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete({ request, env }) {
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        if (Array.isArray(id)) {
            if (id.length > 100) return json({ error: 'Maximum 100 deletions per request' }, 400, request);
            const batch = id.map(i => env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(i));
            await env.DB.batch(batch);
        } else {
            await env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(id).run();
        }
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
