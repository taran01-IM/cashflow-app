import { sql, mapInflow } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

async function update(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM inflows WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });

  const { date, client, bankId, amount, remarks, unit } = req.body || {};
  if (unit && !canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });

  await sql`UPDATE inflows SET
    date = COALESCE(${date ?? null}, date),
    client = COALESCE(${client ?? null}, client),
    bank_id = COALESCE(${bankId ?? null}, bank_id),
    amount = COALESCE(${amount ?? null}, amount),
    remarks = COALESCE(${remarks ?? null}, remarks),
    unit_id = COALESCE(${unit ?? null}, unit_id)
    WHERE id = ${id}`;
  const after = await sql`SELECT * FROM inflows WHERE id = ${id}`;
  res.json(mapInflow(after[0]));
}

async function remove(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM inflows WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });
  await sql`DELETE FROM inflows WHERE id = ${id}`;
  res.json({ ok: true });
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'PUT') return update(req, res, user);
  if (req.method === 'DELETE') return remove(req, res, user);
  return methodNotAllowed(res, ['PUT', 'DELETE']);
}));
