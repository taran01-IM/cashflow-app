import { sql, mapOutflow } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

function newId() {
  return 'out-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

async function list(req, res, user) {
  const unit = req.query.unit;
  let rows;
  if (!unit || unit === 'all') {
    if (user.role !== 'Admin') {
      rows = await sql`SELECT * FROM outflows WHERE unit_id = ANY(${user.units}) ORDER BY date DESC, id`;
    } else {
      rows = await sql`SELECT * FROM outflows ORDER BY date DESC, id`;
    }
  } else {
    if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });
    rows = await sql`SELECT * FROM outflows WHERE unit_id = ${unit} ORDER BY date DESC, id`;
  }
  res.json(rows.map(mapOutflow));
}

async function create(req, res, user) {
  const { date, name, category, categoryGroup, amount, status = 'Pending', remarks = '', unit } = req.body || {};
  if (!date || !name || !category || !categoryGroup || !amount || !unit) {
    return res.status(400).json({ error: 'date, name, category, categoryGroup, amount, unit required' });
  }
  if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });
  if (status !== 'Paid' && status !== 'Pending') return res.status(400).json({ error: 'invalid status' });

  const id = newId();
  await sql`INSERT INTO outflows (id, unit_id, date, name, category, category_group, amount, status, remarks)
            VALUES (${id}, ${unit}, ${date}, ${name}, ${category}, ${categoryGroup}, ${amount}, ${status}, ${remarks})`;
  const inserted = await sql`SELECT * FROM outflows WHERE id = ${id}`;
  res.status(201).json(mapOutflow(inserted[0]));
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'GET') return list(req, res, user);
  if (req.method === 'POST') return create(req, res, user);
  return methodNotAllowed(res, ['GET', 'POST']);
}));
