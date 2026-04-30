// Vercel auto-parses JSON bodies into req.body and provides req.cookies, but
// when called via vercel dev or some adapters cookies aren't always populated.
// Tiny shims so handlers don't have to think about it.

export function parseCookies(req) {
  if (req.cookies && typeof req.cookies === 'object') return req.cookies;
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach(p => {
    const [k, ...rest] = p.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

export function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.path !== false) parts.push(`Path=${opts.path || '/'}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'method not allowed' });
}

// Wrap a handler with try/catch + JSON 500 response
export function safe(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[api] handler error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'server error' });
    }
  };
}
