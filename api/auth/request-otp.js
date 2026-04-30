import { requestOtp } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/handler.js';

export default safe(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  await requestOtp(req, res);
});
