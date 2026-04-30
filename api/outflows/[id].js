import { sql, mapOutflow } from '../../lib/db.js';
import { withAuth, canAccessUnit } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

async function update(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM outflows WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });

  const { date, name, category, categoryGroup, amount, status, remarks, unit } = req.body || {};
  if (unit && !canAccessUnit(user, unit)) return res.status(403).json({ error: 'forbidden' });
  if (status && status !== 'Paid' && status !== 'Pending') return res.status(400).json({ error: 'invalid status' });

  await sql`UPDATE outflows SET
    date = COALESCE(${date ?? null}, date),
    name = COALESCE(${name ?? null}, name),
    category = COALESCE(${category ?? null}, category),
    category_group = COALESCE(${categoryGroup ?? null}, category_group),
    amount = COALESCE(${amount ?? null}, amount),
    status = COALESCE(${status ?? null}, status),
    remarks = COALESCE(${remarks ?? null}, remarks),
    unit_id = COALESCE(${unit ?? null}, unit_id)
    WHERE id = ${id}`;
  const after = await sql`SELECT * FROM outflows WHERE id = ${id}`;
  res.json(mapOutflow(after[0]));
}

async function remove(req, res, user) {
  const id = req.query.id;
  const existing = await sql`SELECT * FROM outflows WHERE id = ${id}`;
  if (!existing[0]) return res.status(404).json({ error: 'not found' });
  if (!canAccessUnit(user, existing[0].unit_id)) return res.status(403).json({ error: 'forbidden' });
  await sql`DELETE FROM outflows WHERE id = ${id}`;
  res.json({ ok: true });
}

export default safe(withAuth(async (req, res, user) => {
  if (req.method === 'PUT') return update(req, res, user);
  if (req.method === 'DELETE') return remove(req, res, user);
  return methodNotAllowed(res, ['PUT', 'DELETE']);
}));
