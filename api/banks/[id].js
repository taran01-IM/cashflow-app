import { sql, mapBank } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

async function update(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM banks WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });

  const { name, unit, accountMasked, branch, opening, notInUse } = req.body || {};
  if (unit && !canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });

  await sql`UPDATE banks SET
    name = COALESCE(${name ?? null}, name),
    unit_id = COALESCE(${unit ?? null}, unit_id),
    account_masked = COALESCE(${accountMasked ?? null}, account_masked),
    branch = COALESCE(${branch ?? null}, branch),
    opening = COALESCE(${opening ?? null}, opening),
    not_in_use = COALESCE(${notInUse ?? null}, not_in_use)
    WHERE id = ${id}`;
  const after = await sql`SELECT * FROM banks WHERE id = ${id}`;
  res.json(mapBank(after[0]));
}

async function remove(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM banks WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });
  await sql`DELETE FROM banks WHERE id = ${id}`;
  res.json({ ok: true });
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'PUT') return update(req, res, user);
  if (req.method === 'DELETE') return remove(req, res, user);
  return methodNotAllowed(res, ['PUT', 'DELETE']);
}));
