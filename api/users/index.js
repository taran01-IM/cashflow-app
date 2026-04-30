import { sql } from '../../lib/db.js';
import { withAuth } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

async function listUsers() {
  const rows = await sql`SELECT u.id, u.phone, u.email, u.name, u.role, u.initials,
    COALESCE(ARRAY_AGG(uu.unit_id) FILTER (WHERE uu.unit_id IS NOT NULL), '{}') AS units
    FROM users u
    LEFT JOIN user_units uu ON uu.user_id = u.id
    GROUP BY u.id, u.phone, u.email, u.name, u.role, u.initials
    ORDER BY u.name`;
  return rows.map(r => ({ ...r, units: r.units || [] }));
}

function normalisePhone(input) {
  if (!input) return '';
  return String(input).trim().replace(/[\s\-()]/g, '').replace(/^00/, '+').replace(/[^+\d]/g, '');
}

function initialsFrom(name) {
  return String(name || '').trim().split(/\s+/).map(p => p[0] || '').join('').slice(0, 3).toUpperCase() || '?';
}

async function list(req, res, user) {
  if (user.role !== 'Admin') return res.status(403).json({ error: 'forbidden' });
  res.json(await listUsers());
}

async function create(req, res, user) {
  if (user.role !== 'Admin') return res.status(403).json({ error: 'forbidden' });
  const { phone, name, email = null, role = 'User', units = [] } = req.body || {};
  const cleanPhone = normalisePhone(phone);
  if (!cleanPhone || !name) return res.status(400).json({ error: 'phone and name required' });
  if (role !== 'Admin' && role !== 'User') return res.status(400).json({ error: 'invalid role' });

  const dup = await sql`SELECT id FROM users WHERE phone = ${cleanPhone}`;
  if (dup[0]) return res.status(409).json({ error: 'phone already in use' });

  const id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  await sql`INSERT INTO users (id, phone, email, name, role, initials)
            VALUES (${id}, ${cleanPhone}, ${email}, ${name}, ${role}, ${initialsFrom(name)})`;
  for (const u of units) {
    await sql`INSERT INTO user_units (user_id, unit_id) VALUES (${id}, ${u})`;
  }
  const fresh = await listUsers();
  res.status(201).json(fresh.find(x => x.id === id));
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'GET') return list(req, res, user);
  if (req.method === 'POST') return create(req, res, user);
  return methodNotAllowed(res, ['GET', 'POST']);
}));
