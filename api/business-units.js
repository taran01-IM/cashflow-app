import { sql } from '../lib/db.js';
import { withAuth } from '../lib/auth.js';
import { methodNotAllowed, safe } from '../lib/handler.js';

export default safe(withAuth(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const rows = await sql`SELECT id, code, name, color FROM business_units ORDER BY code`;
  res.json(rows);
}));
