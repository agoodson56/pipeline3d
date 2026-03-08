// Cloudflare Pages Function — CORS + JSON helpers

const ALLOWED_ORIGINS = [
  'https://pipeline3d.pages.dev',
  'https://pipeline3d.com',
];

/**
 * Build CORS headers, restricting to known origins.
 * In development (when ALLOW_DEV_CORS env var is set), allow localhost origins.
 */
export function corsHeaders(request, env) {
  const origin = request?.headers?.get('Origin') || '';
  let allowedOrigin = ALLOWED_ORIGINS[0]; // default

  if (ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  } else if (env?.ALLOW_DEV_CORS && (origin.startsWith('http://localhost:') || origin === 'http://localhost')) {
    allowedOrigin = origin; // allow dev only when explicitly enabled
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
  };
}

export function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(request) });
}

export function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

/** Sanitized error response — never leak internal details to client */
export function errorResponse(e, request) {
  console.error('[Pipeline3D API Error]', e?.message || e);
  return json({ error: 'An internal error occurred. Please try again.' }, 500, request);
}

/** Basic input validation helpers */
export function validateString(val, fieldName, maxLen = 500) {
  if (val !== undefined && val !== null && typeof val !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (typeof val === 'string' && val.length > maxLen) {
    return `${fieldName} exceeds maximum length of ${maxLen} characters`;
  }
  return null;
}

export function validateNumber(val, fieldName, min = -Infinity, max = Infinity) {
  if (val !== undefined && val !== null && (typeof val !== 'number' || isNaN(val))) {
    return `${fieldName} must be a number`;
  }
  if (typeof val === 'number' && (val < min || val > max)) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
}

export function validateRequired(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
      return `${f} is required`;
    }
  }
  return null;
}

/**
 * Get the authenticated user from context.data (set by middleware).
 * Returns { id, email, name, role, avatarColor }
 */
export function getUser(context) {
  return context.data?.user || null;
}

/**
 * Check if the authenticated user is an admin.
 */
export function isAdmin(context) {
  return context.data?.user?.role === 'admin';
}
