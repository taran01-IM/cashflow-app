import { sql } from './db.js';
import { FLAT_CATEGORIES, CLIENTS, VENDORS } from './reference.js';

const BUSINESS_UNITS = [
  { id: 'mopl', code: 'MOPL', name: 'Moguls Operations Pvt Ltd', color: 'oklch(0.72 0.14 150)' },
  { id: 'taf',  code: 'TAF',  name: 'TAF Ventures',              color: 'oklch(0.7 0.14 250)' },
  { id: 'ims',  code: 'IMS',  name: 'IMS Holdings',              color: 'oklch(0.75 0.14 70)' },
];

const USERS = [
  { id: 'u1', phone: '+919810058408', email: 'taran@moguls.in', name: 'Taran',        role: 'Admin', initials: 'T',  units: ['mopl', 'taf', 'ims'] },
  { id: 'u2', phone: '+919810022222', email: 'priya@moguls.in', name: 'Priya Shah',   role: 'User',  initials: 'PS', units: ['mopl', 'taf'] },
  { id: 'u3', phone: '+919810033333', email: 'rohan@moguls.in', name: 'Rohan Kapoor', role: 'User',  initials: 'RK', units: ['ims'] },
];

const BANKS = [
  { id: 'b1', unit: 'mopl', name: 'HDFC Bank',      accountMasked: '••••4521', opening: 1850000, notInUse: 250000, branch: 'Bandra Kurla' },
  { id: 'b2', unit: 'mopl', name: 'ICICI Bank',     accountMasked: '••••8810', opening: 920000,  notInUse: 0,      branch: 'Lower Parel' },
  { id: 'b3', unit: 'mopl', name: 'Axis Bank',      accountMasked: '••••2034', opening: 540000,  notInUse: 100000, branch: 'Andheri East' },
  { id: 'b4', unit: 'taf',  name: 'Kotak Mahindra', accountMasked: '••••7782', opening: 1200000, notInUse: 0,      branch: 'Cyber City' },
  { id: 'b5', unit: 'taf',  name: 'SBI',            accountMasked: '••••1109', opening: 380000,  notInUse: 50000,  branch: 'Connaught Pl' },
  { id: 'b6', unit: 'ims',  name: 'Yes Bank',       accountMasked: '••••9090', opening: 670000,  notInUse: 0,      branch: 'Whitefield' },
  { id: 'b7', unit: 'ims',  name: 'IndusInd',       accountMasked: '••••3411', opening: 230000,  notInUse: 30000,  branch: 'Indiranagar' },
];

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateInflows(unit, banks, count, seed) {
  const rand = mulberry32(seed);
  const items = [];
  const today = new Date('2026-04-28');
  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(rand() * 60);
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const amount = Math.round((rand() * 800000 + 25000) / 100) * 100;
    items.push({
      id: `in-${unit}-${i}`,
      unit,
      date: d.toISOString().slice(0, 10),
      client: CLIENTS[Math.floor(rand() * CLIENTS.length)],
      bankId: banks[Math.floor(rand() * banks.length)].id,
      amount,
      remarks: ['Invoice settlement', 'Retainer Q2', 'Milestone 2 payout', 'Subscription renewal', 'Service fee', 'Annual contract'][Math.floor(rand() * 6)],
    });
  }
  return items;
}

function generateOutflows(unit, count, seed) {
  const rand = mulberry32(seed);
  const items = [];
  const today = new Date('2026-04-28');
  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(rand() * 60) - 10;
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const cat = FLAT_CATEGORIES[Math.floor(rand() * FLAT_CATEGORIES.length)];
    const amount = Math.round((rand() * 350000 + 5000) / 100) * 100;
    const isPaid = rand() > 0.42;
    let name;
    if (cat.group === 'Sundry Creditors') name = VENDORS[Math.floor(rand() * VENDORS.length)];
    else if (cat.group === 'Salary') name = ['Payroll April', 'Payroll May', 'Bonus pool'][Math.floor(rand() * 3)];
    else if (cat.group === 'Duties & Taxes') name = `${cat.name} filing`;
    else if (cat.group === 'EMI') name = ['Office EMI', 'Vehicle EMI', 'Equipment EMI'][Math.floor(rand() * 3)];
    else if (cat.group === 'Director Remuneration') name = ['A. Mehta', 'S. Khanna'][Math.floor(rand() * 2)];
    else if (cat.group === 'Freelancer') name = ['Designer', 'Copywriter', 'Developer'][Math.floor(rand() * 3)] + ' Contract';
    else name = cat.group;
    items.push({
      id: `out-${unit}-${i}`,
      unit,
      date: d.toISOString().slice(0, 10),
      name,
      category: cat.name,
      categoryGroup: cat.group,
      amount,
      status: isPaid ? 'Paid' : 'Pending',
      remarks: isPaid ? 'Cleared via NEFT' : 'Awaiting approval',
    });
  }
  return items;
}

const INFLOWS = [
  ...generateInflows('mopl', BANKS.filter(b => b.unit === 'mopl'), 22, 101),
  ...generateInflows('taf',  BANKS.filter(b => b.unit === 'taf'),  16, 202),
  ...generateInflows('ims',  BANKS.filter(b => b.unit === 'ims'),  14, 303),
];

const OUTFLOWS = [
  ...generateOutflows('mopl', 28, 401),
  ...generateOutflows('taf',  20, 502),
  ...generateOutflows('ims',  17, 603),
];

// Idempotent: creates the schema, then inserts rows only into tables that are
// currently empty. Pass { reset: true } to wipe everything first.
export async function migrateAndSeed({ reset = false } = {}) {
  await sql`
    CREATE TABLE IF NOT EXISTS business_units (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
      initials TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_units (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, unit_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL REFERENCES business_units(id),
      name TEXT NOT NULL,
      account_masked TEXT NOT NULL,
      branch TEXT,
      opening BIGINT NOT NULL DEFAULT 0,
      not_in_use BIGINT NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_banks_unit ON banks(unit_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS inflows (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL REFERENCES business_units(id),
      date TEXT NOT NULL,
      client TEXT NOT NULL,
      bank_id TEXT REFERENCES banks(id) ON DELETE SET NULL,
      amount BIGINT NOT NULL,
      remarks TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_inflows_unit ON inflows(unit_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inflows_date ON inflows(date)`;
  await sql`
    CREATE TABLE IF NOT EXISTS outflows (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL REFERENCES business_units(id),
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      category_group TEXT NOT NULL,
      amount BIGINT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending')),
      remarks TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_outflows_unit ON outflows(unit_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_outflows_date ON outflows(date)`;
  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_sent_at TIMESTAMPTZ NOT NULL
    )
  `;

  if (reset) {
    await sql`DELETE FROM outflows`;
    await sql`DELETE FROM inflows`;
    await sql`DELETE FROM banks`;
    await sql`DELETE FROM user_units`;
    await sql`DELETE FROM users`;
    await sql`DELETE FROM business_units`;
    await sql`DELETE FROM otp_codes`;
  }

  const counts = {
    bu:       Number((await sql`SELECT COUNT(*)::int AS n FROM business_units`)[0].n),
    users:    Number((await sql`SELECT COUNT(*)::int AS n FROM users`)[0].n),
    banks:    Number((await sql`SELECT COUNT(*)::int AS n FROM banks`)[0].n),
    inflows:  Number((await sql`SELECT COUNT(*)::int AS n FROM inflows`)[0].n),
    outflows: Number((await sql`SELECT COUNT(*)::int AS n FROM outflows`)[0].n),
  };

  const seeded = [];

  if (counts.bu === 0) {
    for (const u of BUSINESS_UNITS) {
      await sql`INSERT INTO business_units (id, code, name, color) VALUES (${u.id}, ${u.code}, ${u.name}, ${u.color})`;
    }
    seeded.push(`${BUSINESS_UNITS.length} business units`);
  }

  if (counts.users === 0) {
    for (const u of USERS) {
      await sql`INSERT INTO users (id, phone, email, name, role, initials) VALUES (${u.id}, ${u.phone}, ${u.email}, ${u.name}, ${u.role}, ${u.initials})`;
      for (const unit of u.units) {
        await sql`INSERT INTO user_units (user_id, unit_id) VALUES (${u.id}, ${unit})`;
      }
    }
    seeded.push(`${USERS.length} users (${USERS.map(u => u.phone).join(', ')})`);
  }

  if (counts.banks === 0) {
    for (const b of BANKS) {
      await sql`INSERT INTO banks (id, unit_id, name, account_masked, branch, opening, not_in_use)
                VALUES (${b.id}, ${b.unit}, ${b.name}, ${b.accountMasked}, ${b.branch}, ${b.opening}, ${b.notInUse})`;
    }
    seeded.push(`${BANKS.length} banks`);
  }

  if (counts.inflows === 0) {
    for (const i of INFLOWS) {
      await sql`INSERT INTO inflows (id, unit_id, date, client, bank_id, amount, remarks)
                VALUES (${i.id}, ${i.unit}, ${i.date}, ${i.client}, ${i.bankId}, ${i.amount}, ${i.remarks})`;
    }
    seeded.push(`${INFLOWS.length} inflows`);
  }

  if (counts.outflows === 0) {
    for (const o of OUTFLOWS) {
      await sql`INSERT INTO outflows (id, unit_id, date, name, category, category_group, amount, status, remarks)
                VALUES (${o.id}, ${o.unit}, ${o.date}, ${o.name}, ${o.category}, ${o.categoryGroup}, ${o.amount}, ${o.status}, ${o.remarks})`;
    }
    seeded.push(`${OUTFLOWS.length} outflows`);
  }

  return {
    ok: true,
    seeded: seeded.length ? seeded : ['nothing — tables already populated'],
  };
}
