import { migrateAndSeed } from '../../lib/seed.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

// Seed endpoint — call once after first deploy. Token-protected so it can't
// be hit by random visitors.
//   POST /api/admin/seed?token=$SEED_TOKEN
//   POST /api/admin/seed?token=$SEED_TOKEN&reset=1   (wipes + reseeds)
export default safe(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const expected = process.env.SEED_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'SEED_TOKEN env var not set on server' });
  }
  const token = req.query.token;
  if (token !== expected) {
    return res.status(401).json({ error: 'invalid seed token' });
  }

  const reset = req.query.reset === '1';
  const result = await migrateAndSeed({ reset });
  res.json(result);
});
