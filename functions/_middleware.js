/**
 * Pipeline3D — API Authentication Middleware
 * 
 * If env.API_KEY is set in Cloudflare secrets, all API requests must include:
 *   Authorization: Bearer <key>   OR   X-API-Key: <key>
 * 
 * If env.API_KEY is NOT set, all requests pass through (backward compatible).
 * OPTIONS (CORS preflight) always passes through.
 */
export async function onRequest(context) {
    const { request, env, next } = context;

    // Always allow CORS preflight
    if (request.method === 'OPTIONS') {
        return next();
    }

    // Only enforce auth on /api/ routes
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
        return next();
    }

    // If no API_KEY is configured, pass through (dev / unconfigured)
    const apiKey = env.API_KEY;
    if (!apiKey) {
        return next();
    }

    // Check for valid key in Authorization header or X-API-Key header
    const authHeader = request.headers.get('Authorization') || '';
    const xApiKey = request.headers.get('X-API-Key') || '';

    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (bearerToken === apiKey || xApiKey === apiKey) {
        return next();
    }

    // Unauthorized
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
