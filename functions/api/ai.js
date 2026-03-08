/**
 * Pipeline3D — AI Proxy (Server-Side Gemini API)
 * 
 * Proxies AI requests to Google Gemini so the API key never reaches the client.
 * The GEMINI_API_KEY is stored as a Cloudflare environment variable.
 */
import { json, errorResponse, onRequestOptions as opts, getUser } from './_helpers.js';
export { opts as onRequestOptions };

export async function onRequestPost(context) {
    const { request, env } = context;
    const user = getUser(context);
    if (!user) return json({ error: 'Authentication required' }, 401, request);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'AI service not configured' }, 503, request);

    try {
        const body = await request.json();
        const { prompt, systemPrompt, model } = body;

        if (!prompt) return json({ error: 'prompt is required' }, 400, request);
        if (typeof prompt !== 'string' || prompt.length > 10000) {
            return json({ error: 'prompt must be a string under 10,000 characters' }, 400, request);
        }

        const geminiModel = model || 'gemini-2.0-flash';
        const allowedModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
        if (!allowedModels.includes(geminiModel)) {
            return json({ error: 'Invalid model' }, 400, request);
        }

        const contents = [{ parts: [{ text: (systemPrompt || '') + '\n\n' + prompt }] }];

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: body.temperature ?? 0.7,
                        maxOutputTokens: Math.min(body.maxTokens || 8192, 8192),
                    },
                }),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error('[Gemini API Error]', res.status, err);
            return json({ error: 'AI service temporarily unavailable' }, 502, request);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return json({ text }, 200, request);
    } catch (e) { return errorResponse(e, request); }
}
