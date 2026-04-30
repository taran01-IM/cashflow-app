import { sql, mapBank } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

async function list(req, res, user) {
  const unit = req.query.unit;
  let rows;
  if (!unit || unit === 'all') {
    if (user.role !== 'Admin') {
      rows = await sql`SELECT * FROM banks WHERE unit_id = ANY(${user.units}) ORDER BY name`;
    } else {
      rows = await sql`SELECT * FROM banks ORDER BY name`;
    }
  } else {
    if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });
    rows = await sql`SELECT * FROM banks WHERE unit_id = ${unit} ORDER BY name`;
  }
  res.json(rows.map(mapBank));
}

async function create(req, res, user) {
  const { name, unit, accountMasked = '••••', branch = '', opening = 0, notInUse = 0 } = req.body || {};
  if (!name || !unit) return res.status(400).json({ error: 'name and unit required' });
  if (!canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });

  const maxRow = await sql`SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0) AS n FROM banks WHERE id LIKE 'b%'`;
  const id = 'b' + (Number(maxRow[0].n) + 1);

  await sql`INSERT INTO banks (id, unit_id, name, account_masked, branch, opening, not_in_use)
            VALUES (${id}, ${unit}, ${name}, ${accountMasked}, ${branch}, ${opening}, ${notInUse})`;
  const inserted = await sql`SELECT * FROM banks WHERE id = ${id}`;
  res.status(201).json(mapBank(inserted[0]));
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'GET') return list(req, res, user);
  if (req.method === 'POST') return create(req, res, user);
  return methodNotAllowed(res, ['GET', 'POST']);
}));
