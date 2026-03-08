import { json, errorResponse, onRequestOptions as opts, validateRequired, validateString, validateNumber, getUser, isAdmin } from './_helpers.js';
export { opts as onRequestOptions };

function serializeDeal(d) {
    return {
        ...d,
        notes: JSON.parse(d.notes || '[]'),
        history: JSON.parse(d.history || '[]'),
        products: JSON.parse(d.products || '[]'),
        customFields: JSON.parse(d.custom_fields || '{}'),
        pipelineId: d.pipeline_id,
        contactEmail: d.contact_email,
        companyId: d.company_id,
        daysOpen: d.days_open,
        expectedClose: d.expected_close,
        ownerId: d.owner_id,
    };
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        let query, params;
        if (isAdmin(context)) {
            // Admin sees ALL deals
            query = 'SELECT d.*, u.name as owner_name FROM deals d LEFT JOIN users u ON d.owner_id = u.id ORDER BY d.created_at DESC';
            params = [];
        } else {
            // Rep sees only their own deals
            query = 'SELECT d.*, u.name as owner_name FROM deals d LEFT JOIN users u ON d.owner_id = u.id WHERE d.owner_id = ? ORDER BY d.created_at DESC';
            params = [user.id];
        }
        const { results } = params.length
            ? await env.DB.prepare(query).bind(...params).all()
            : await env.DB.prepare(query).all();
        return json(results.map(d => ({ ...serializeDeal(d), ownerName: d.owner_name })), 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        const d = await request.json();
        // Validate
        const reqErr = validateRequired(d, ['title', 'stage']);
        if (reqErr) return json({ error: reqErr }, 400, request);
        const strErr = validateString(d.title, 'title', 255) || validateString(d.stage, 'stage', 100);
        if (strErr) return json({ error: strErr }, 400, request);
        const numErr = validateNumber(d.value, 'value', 0) || validateNumber(d.probability, 'probability', 0, 100);
        if (numErr) return json({ error: numErr }, 400, request);

        // Owner is the current user unless admin is reassigning
        const ownerId = (isAdmin(context) && d.ownerId) ? d.ownerId : user.id;

        await env.DB.prepare(`INSERT OR REPLACE INTO deals
      (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company,
       probability, days_open, label, expected_close, notes, history, products, custom_fields, owner_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
            .bind(d.id, d.title, d.value, d.stage, d.pipelineId, d.contact, d.contactEmail,
                d.companyId, d.company, d.probability, d.daysOpen || 0, d.label,
                d.expectedClose, JSON.stringify(d.notes || []),
                JSON.stringify(d.history || []), JSON.stringify(d.products || []), JSON.stringify(d.customFields || {}), ownerId)
            .run();
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        const items = await request.json();
        if (!Array.isArray(items)) return json({ error: 'Expected an array' }, 400, request);
        const batch = items.map(d => {
            const ownerId = (isAdmin(context) && d.ownerId) ? d.ownerId : (d.ownerId || user.id);
            return env.DB.prepare(`INSERT OR REPLACE INTO deals
        (id, title, value, stage, pipeline_id, contact, contact_email, company_id, company,
         probability, days_open, label, expected_close, notes, history, products, custom_fields, owner_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`)
                .bind(d.id, d.title, d.value, d.stage, d.pipelineId, d.contact, d.contactEmail,
                    d.companyId, d.company, d.probability, d.daysOpen || 0, d.label,
                    d.expectedClose, JSON.stringify(d.notes || []),
                    JSON.stringify(d.history || []), JSON.stringify(d.products || []), JSON.stringify(d.customFields || {}), ownerId);
        });
        await env.DB.batch(batch);
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    const user = getUser(context);
    try {
        const { id } = await request.json();
        if (id === undefined || id === null) return json({ error: 'id is required' }, 400, request);
        if (Array.isArray(id)) {
            if (id.length > 100) return json({ error: 'Maximum 100 deletions per request' }, 400, request);
            const batch = id.map(i => {
                // Reps can only delete their own deals
                if (isAdmin(context)) {
                    return env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(i);
                }
                return env.DB.prepare('DELETE FROM deals WHERE id = ? AND owner_id = ?').bind(i, user.id);
            });
            await env.DB.batch(batch);
        } else {
            if (isAdmin(context)) {
                await env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(id).run();
            } else {
                await env.DB.prepare('DELETE FROM deals WHERE id = ? AND owner_id = ?').bind(id, user.id).run();
            }
        }
        return json({ success: true }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
