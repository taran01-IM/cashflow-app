import { sql } from '../../lib/db.js';
import { withAuth } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

function normalisePhone(input) {
  if (!input) return '';
  return String(input).trim().replace(/[\s\-()]/g, '').replace(/^00/, '+').replace(/[^+\d]/g, '');
}

function initialsFrom(name) {
  return String(name || '').trim().split(/\s+/).map(p => p[0] || '').join('').slice(0, 3).toUpperCase() || '?';
}

async function fetchUser(id) {
  const rows = await sql`SELECT u.id, u.phone, u.email, u.name, u.role, u.initials,
    COALESCE(ARRAY_AGG(uu.unit_id) FILTER (WHERE uu.unit_id IS NOT NULL), '{}') AS units
    FROM users u
    LEFT JOIN user_units uu ON uu.user_id = u.id
    WHERE u.id = ${id}
    GROUP BY u.id, u.phone, u.email, u.name, u.role, u.initials`;
  return rows[0] ? { ...rows[0], units: rows[0].units || [] } : null;
}

async function update(req, res, user) {
  if (user.role !== 'Admin') return res.status(403).json({ error: 'forbidden' });
  const id = req.query.id;
  const existing = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });

  const body = req.body || {};
  const phone = body.phone != null ? normalisePhone(body.phone) : null;
  const name = body.name ?? null;
  const email = body.email !== undefined ? body.email : null;
  const role = body.role ?? null;
  if (role && role !== 'Admin' && role !== 'User') return res.status(400).json({ error: 'invalid role' });

  if (phone && phone !== existing[0].phone) {
    const dup = await sql`SELECT id FROM users WHERE phone = ${phone} AND id != ${id}`;
    if (dup[0]) return res.status(409).json({ error: 'phone already in use' });
  }

  const initials = name ? initialsFrom(name) : null;
  await sql`UPDATE users SET
    phone = COALESCE(${phone}, phone),
    name = COALESCE(${name}, name),
    email = COALESCE(${body.email === undefined ? null : email}, email),
    role = COALESCE(${role}, role),
    initials = COALESCE(${initials}, initials)
    WHERE id = ${id}`;

  if (Array.isArray(body.units)) {
    await sql`DELETE FROM user_units WHERE user_id = ${id}`;
    for (const u of body.units) {
      await sql`INSERT INTO user_units (user_id, unit_id) VALUES (${id}, ${u})`;
    }
  }

  res.json(await fetchUser(id));
}

async function remove(req, res, user) {
  if (user.role !== 'Admin') return res.status(403).json({ error: 'forbidden' });
  const id = req.query.id;
  if (id === user.id) return res.status(400).json({ error: 'cannot delete yourself' });
  const existing = await sql`SELECT id FROM users WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  await sql`DELETE FROM users WHERE id = ${id}`;
  res.json({ ok: true });
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'PUT') return update(req, res, user);
  if (req.method === 'DELETE') return remove(req, res, user);
  return methodNotAllowed(res, ['PUT', 'DELETE']);
}));
