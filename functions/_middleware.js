/**
 * Pipeline3D — API Authentication Middleware
 * 
 * 1. Auth endpoints (/api/auth) pass through without session check (login, etc.)
 * 2. All other /api/ routes require a valid session token
 * 3. Token is read from Authorization: Bearer <token> header
 * 4. Authenticated user is attached to context.data.user for downstream handlers
 * 5. OPTIONS (CORS preflight) always passes through
 */
export async function onRequest(context) {
    const { request, env, next, data } = context;

    // Always allow CORS preflight
    if (request.method === 'OPTIONS') {
        return next();
    }

    const url = new URL(request.url);

    // Only enforce auth on /api/ routes
    if (!url.pathname.startsWith('/api/')) {
        return next();
    }

    // Auth endpoints handle their own authentication
    if (url.pathname === '/api/auth') {
        return next();
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Validate session and get user
    try {
        const session = await env.DB.prepare(
            `SELECT u.id, u.email, u.name, u.role, u.status, u.avatar_color
             FROM sessions s JOIN users u ON s.user_id = u.id 
             WHERE s.token = ? AND s.expires_at > datetime("now")`
        ).bind(token).first();

        if (!session) {
            return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (session.status === 'deactivated') {
            return new Response(JSON.stringify({ error: 'Account has been deactivated' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Attach authenticated user to context for all downstream handlers
        data.user = {
            id: session.id,
            email: session.email,
            name: session.name,
            role: session.role,
            avatarColor: session.avatar_color,
        };

    } catch (e) {
        console.error('[Auth Middleware Error]', e?.message || e);
        return new Response(JSON.stringify({ error: 'Authentication service unavailable' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return next();
}
