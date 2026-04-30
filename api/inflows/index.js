import { sql, mapInflow } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

function newId() {
  return 'in-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

async function list(req, res, user) {
  const unit = req.query.unit;
  let rows;
  if (!unit || unit === 'all') {
    if (user.role !== 'Admin') {
      rows = await sql`SELECT * FROM inflows WHERE unit_id = ANY(${user.units}) ORDER BY date DESC, id`;
    } else {
      rows = await sql`SELECT * FROM inflows ORDER BY date DESC, id`;
    }
  } else {
    if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });
    rows = await sql`SELECT * FROM inflows WHERE unit_id = ${unit} ORDER BY date DESC, id`;
  }
  res.json(rows.map(mapInflow));
}

async function create(req, res, user) {
  const { date, client, bankId, amount, remarks = '', unit } = req.body || {};
  if (!date || !client || !amount || !unit) return res.status(400).json({ error: 'date, client, amount, unit required' });
  if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });

  const id = newId();
  await sql`INSERT INTO inflows (id, unit_id, date, client, bank_id, amount, remarks)
            VALUES (${id}, ${unit}, ${date}, ${client}, ${bankId || null}, ${amount}, ${remarks})`;
  const inserted = await sql`SELECT * FROM inflows WHERE id = ${id}`;
  res.status(201).json(mapInflow(inserted[0]));
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'GET') return list(req, res, user);
  if (req.method === 'POST') return create(req, res, user);
  return methodNotAllowed(res, ['GET', 'POST']);
}));
