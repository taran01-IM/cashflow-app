// Mock data store for Cash Flow Management app
// All amounts in INR paisa? — no, simple rupees for clarity in display.

const BUSINESS_UNITS = [
  { id: 'mopl', code: 'MOPL', name: 'Moguls Operations Pvt Ltd', color: 'oklch(0.72 0.14 150)' },
  { id: 'taf',  code: 'TAF',  name: 'TAF Ventures',              color: 'oklch(0.7 0.14 250)' },
  { id: 'ims',  code: 'IMS',  name: 'IMS Holdings',              color: 'oklch(0.75 0.14 70)' },
];

const USERS = [
  { id: 'u1', email: 'admin@moguls.in',   name: 'Aarav Mehta',   role: 'Admin', initials: 'AM', units: ['mopl', 'taf', 'ims'] },
  { id: 'u2', email: 'priya@moguls.in',   name: 'Priya Shah',    role: 'User',  initials: 'PS', units: ['mopl', 'taf'] },
  { id: 'u3', email: 'rohan@moguls.in',   name: 'Rohan Kapoor',  role: 'User',  initials: 'RK', units: ['ims'] },
];

const CATEGORIES = [
  { id: 'cat-duties',     group: 'Duties & Taxes',          children: ['GST', 'TDS', 'PF'] },
  { id: 'cat-vendors',    group: 'Sundry Creditors',        children: ['Vendor 1', 'Vendor 2', 'Vendor 3', 'Vendor 4', 'Vendor 5'] },
  { id: 'cat-cc',         group: 'Credit Card',             children: ['Credit Card'] },
  { id: 'cat-incentive',  group: 'Incentive Payable',       children: ['Incentive Payable'] },
  { id: 'cat-director',   group: 'Director Remuneration',   children: ['Director Remuneration'] },
  { id: 'cat-imprest',    group: 'Imprest Account',         children: ['Imprest Account'] },
  { id: 'cat-salary',     group: 'Salary',                  children: ['Salary'] },
  { id: 'cat-fnf',        group: 'FNF',                     children: ['FNF'] },
  { id: 'cat-freelancer', group: 'Freelancer',              children: ['Freelancer'] },
  { id: 'cat-emi',        group: 'EMI',                     children: ['EMI'] },
  { id: 'cat-others',     group: 'Others',                  children: ['Others'] },
];

const FLAT_CATEGORIES = CATEGORIES.flatMap(g => g.children.map(c => ({ group: g.group, name: c })));

// Banks per business unit
const BANKS_SEED = [
  // MOPL
  { id: 'b1', unit: 'mopl', name: 'HDFC Bank', accountMasked: '••••4521', opening: 1850000, notInUse: 250000, branch: 'Bandra Kurla' },
  { id: 'b2', unit: 'mopl', name: 'ICICI Bank', accountMasked: '••••8810', opening: 920000, notInUse: 0, branch: 'Lower Parel' },
  { id: 'b3', unit: 'mopl', name: 'Axis Bank',  accountMasked: '••••2034', opening: 540000, notInUse: 100000, branch: 'Andheri East' },
  // TAF
  { id: 'b4', unit: 'taf',  name: 'Kotak Mahindra', accountMasked: '••••7782', opening: 1200000, notInUse: 0, branch: 'Cyber City' },
  { id: 'b5', unit: 'taf',  name: 'SBI',            accountMasked: '••••1109', opening: 380000, notInUse: 50000, branch: 'Connaught Pl' },
  // IMS
  { id: 'b6', unit: 'ims',  name: 'Yes Bank',       accountMasked: '••••9090', opening: 670000, notInUse: 0, branch: 'Whitefield' },
  { id: 'b7', unit: 'ims',  name: 'IndusInd',       accountMasked: '••••3411', opening: 230000, notInUse: 30000, branch: 'Indiranagar' },
];

const CLIENTS = [
  'Sundara Retail', 'Velocity Logistics', 'NorthStar Media', 'Quantum Fintech', 'Banyan Foods',
  'Helios Energy', 'Crescent Pharma', 'Maple Studios', 'Orbit Robotics', 'Tessera Realty',
  'Lumen Education', 'Pioneer Metals', 'Saffron Hotels', 'Kestrel Aero', 'Indigo Ventures',
];

const VENDORS = [
  'Acme Supplies', 'Bharat Stationers', 'Cloudline Hosting', 'Delphi Print', 'Elixir Catering',
  'Foothill Travel', 'Gemini Furniture', 'Helix Software', 'Iris Telecom', 'Jasper Couriers',
];

// Deterministic pseudo-random so reloads are stable
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
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

function generateOutflows(unit, count, seed) {
  const rand = mulberry32(seed);
  const items = [];
  const today = new Date('2026-04-28');
  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(rand() * 60) - 10; // include some future
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
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

const SEED_INFLOWS = [
  ...generateInflows('mopl', BANKS_SEED.filter(b => b.unit === 'mopl'), 22, 101),
  ...generateInflows('taf',  BANKS_SEED.filter(b => b.unit === 'taf'),  16, 202),
  ...generateInflows('ims',  BANKS_SEED.filter(b => b.unit === 'ims'),  14, 303),
];

const SEED_OUTFLOWS = [
  ...generateOutflows('mopl', 28, 401),
  ...generateOutflows('taf',  20, 502),
  ...generateOutflows('ims',  17, 603),
];

window.CFA_DATA = {
  BUSINESS_UNITS, USERS, CATEGORIES, FLAT_CATEGORIES,
  BANKS_SEED, SEED_INFLOWS, SEED_OUTFLOWS, CLIENTS, VENDORS,
};
