import { withAuth } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

export default safe(withAuth(async (req, res, user) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  res.json({ user });
}));
