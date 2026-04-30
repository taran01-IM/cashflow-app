// Static reference data shared across the UI. Mutable resources (banks,
// inflows, outflows, users, business units) come from the API.

export const BUSINESS_UNITS_FALLBACK = [
  { id: 'mopl', code: 'MOPL', name: 'Moguls Operations Pvt Ltd', color: 'oklch(0.72 0.14 150)' },
  { id: 'taf',  code: 'TAF',  name: 'TAF Ventures',              color: 'oklch(0.7 0.14 250)' },
  { id: 'ims',  code: 'IMS',  name: 'IMS Holdings',              color: 'oklch(0.75 0.14 70)' },
];

export const CATEGORIES = [
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

export const CLIENTS = [
  'Sundara Retail', 'Velocity Logistics', 'NorthStar Media', 'Quantum Fintech', 'Banyan Foods',
  'Helios Energy', 'Crescent Pharma', 'Maple Studios', 'Orbit Robotics', 'Tessera Realty',
  'Lumen Education', 'Pioneer Metals', 'Saffron Hotels', 'Kestrel Aero', 'Indigo Ventures',
];

export const VENDORS = [
  'Acme Supplies', 'Bharat Stationers', 'Cloudline Hosting', 'Delphi Print', 'Elixir Catering',
  'Foothill Travel', 'Gemini Furniture', 'Helix Software', 'Iris Telecom', 'Jasper Couriers',
];
