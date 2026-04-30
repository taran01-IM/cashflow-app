import jwt from 'jsonwebtoken';
import { sql } from './db.js';
import { parseCookies, setCookie, clearCookie } from './handler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'cf_session';
const TOKEN_TTL = '7d';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

async function userUnits(userId) {
  const rows = await sql`SELECT unit_id FROM user_units WHERE user_id = ${userId}`;
  return rows.map(r => r.unit_id);
}

async function publicUser(row) {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    name: row.name,
    role: row.role,
    initials: row.initials,
    units: await userUnits(row.id),
  };
}

function normalisePhone(input) {
  if (!input) return '';
  const cleaned = String(input).trim().replace(/[\s\-()]/g, '');
  return cleaned.replace(/^00/, '+').replace(/[^+\d]/g, '');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Stub — wire up Twilio/MSG91/etc. for production.
function sendOtpSms(phone, code) {
  console.log(`[otp] ${phone} → ${code}  (dev — wire up an SMS provider for production)`);
}

// Resolve the current user from the session cookie. Returns null when
// unauthenticated. Handlers that need the user should call this and bail with
// 401 if it returns null.
export async function getUser(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await sql`SELECT * FROM users WHERE id = ${payload.sub}`;
    if (!rows[0]) return null;
    return await publicUser(rows[0]);
  } catch {
    return null;
  }
}

// Convenience wrapper: enforce auth, pass user into the handler.
export function withAuth(handler) {
  return async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    return handler(req, res, user);
  };
}

export function canAccessUnit(user, unitId) {
  if (unitId === 'all') return user.role === 'Admin';
  if (user.role === 'Admin') return true;
  return user.units.includes(unitId);
}

export async function requestOtp(req, res) {
  const phone = normalisePhone(req.body?.phone);
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const userRows = await sql`SELECT id FROM users WHERE phone = ${phone}`;
  if (!userRows[0]) return res.status(404).json({ error: 'phone not registered' });

  const now = new Date();
  const existing = await sql`SELECT * FROM otp_codes WHERE phone = ${phone}`;
  if (existing[0]) {
    const lastSent = new Date(existing[0].last_sent_at).getTime();
    if (now.getTime() - lastSent < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now.getTime() - lastSent)) / 1000);
      return res.status(429).json({ error: `please wait ${wait}s before requesting another OTP` });
    }
  }

  const code = generateOtp();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await sql`
    INSERT INTO otp_codes (phone, code, expires_at, attempts, last_sent_at)
    VALUES (${phone}, ${code}, ${expiresAt.toISOString()}, 0, ${now.toISOString()})
    ON CONFLICT (phone) DO UPDATE SET
      code = EXCLUDED.code,
      expires_at = EXCLUDED.expires_at,
      attempts = 0,
      last_sent_at = EXCLUDED.last_sent_at
  `;
  sendOtpSms(phone, code);

  res.json({
    ok: true,
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(DEV_MODE ? { devOtp: code } : {}),
  });
}

export async function verifyOtp(req, res) {
  const phone = normalisePhone(req.body?.phone);
  const code = String(req.body?.otp || '').trim();
  if (!phone || !code) return res.status(400).json({ error: 'phone and otp required' });

  const rows = await sql`SELECT * FROM otp_codes WHERE phone = ${phone}`;
  const entry = rows[0];
  if (!entry) return res.status(400).json({ error: 'no OTP requested for this phone' });

  if (Date.now() > new Date(entry.expires_at).getTime()) {
    await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
    return res.status(400).json({ error: 'OTP expired — request a new one' });
  }
  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
    return res.status(429).json({ error: 'too many attempts — request a new OTP' });
  }

  const newAttempts = entry.attempts + 1;
  if (entry.code !== code) {
    await sql`UPDATE otp_codes SET attempts = ${newAttempts} WHERE phone = ${phone}`;
    return res.status(401).json({
      error: 'invalid OTP',
      attemptsLeft: OTP_MAX_ATTEMPTS - newAttempts,
    });
  }

  await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;

  const userRows = await sql`SELECT * FROM users WHERE phone = ${phone}`;
  if (!userRows[0]) return res.status(404).json({ error: 'phone not registered' });

  const token = jwt.sign({ sub: userRows[0].id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  setCookie(res, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: await publicUser(userRows[0]) });
}

export function logout(_req, res) {
  clearCookie(res, COOKIE_NAME);
  res.json({ ok: true });
}
