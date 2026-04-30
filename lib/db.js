import { neon } from '@neondatabase/serverless';

// Lazy-init: don't fail at import time. Only the first call hits neon(), so
// modules can be imported during build/test even without DATABASE_URL set.
let _sql = null;
function getSql() {
  if (_sql) return _sql;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set — configure it in Vercel env or .env.local');
  }
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Tagged-template proxy: `sql\`SELECT ...\`` works exactly like neon's sql.
export const sql = (strings, ...values) => getSql()(strings, ...values);

export function mapBank(row) {
  if (!row) return null;
  return {
    id: row.id,
    unit: row.unit_id,
    name: row.name,
    accountMasked: row.account_masked,
    branch: row.branch,
    opening: Number(row.opening),
    notInUse: Number(row.not_in_use),
  };
}
export function mapInflow(row) {
  if (!row) return null;
  return {
    id: row.id,
    unit: row.unit_id,
    date: row.date,
    client: row.client,
    bankId: row.bank_id,
    amount: Number(row.amount),
    remarks: row.remarks,
  };
}
export function mapOutflow(row) {
  if (!row) return null;
  return {
    id: row.id,
    unit: row.unit_id,
    date: row.date,
    name: row.name,
    category: row.category,
    categoryGroup: row.category_group,
    amount: Number(row.amount),
    status: row.status,
    remarks: row.remarks,
  };
}
