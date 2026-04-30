// Reference data shared across seed + any read-only API endpoints.
export const CATEGORIES = [
  { group: 'Duties & Taxes',         children: ['GST', 'TDS', 'PF'] },
  { group: 'Sundry Creditors',       children: ['Vendor 1', 'Vendor 2', 'Vendor 3', 'Vendor 4', 'Vendor 5'] },
  { group: 'Credit Card',            children: ['Credit Card'] },
  { group: 'Incentive Payable',      children: ['Incentive Payable'] },
  { group: 'Director Remuneration',  children: ['Director Remuneration'] },
  { group: 'Imprest Account',        children: ['Imprest Account'] },
  { group: 'Salary',                 children: ['Salary'] },
  { group: 'FNF',                    children: ['FNF'] },
  { group: 'Freelancer',             children: ['Freelancer'] },
  { group: 'EMI',                    children: ['EMI'] },
  { group: 'Others',                 children: ['Others'] },
];

export const FLAT_CATEGORIES = CATEGORIES.flatMap(g => g.children.map(c => ({ group: g.group, name: c })));

export const CLIENTS = [
  'Sundara Retail', 'Velocity Logistics', 'NorthStar Media', 'Quantum Fintech', 'Banyan Foods',
  'Helios Energy', 'Crescent Pharma', 'Maple Studios', 'Orbit Robotics', 'Tessera Realty',
  'Lumen Education', 'Pioneer Metals', 'Saffron Hotels', 'Kestrel Aero', 'Indigo Ventures',
];

export const VENDORS = [
  'Acme Supplies', 'Bharat Stationers', 'Cloudline Hosting', 'Delphi Print', 'Elixir Catering',
  'Foothill Travel', 'Gemini Furniture', 'Helix Software', 'Iris Telecom', 'Jasper Couriers',
];
