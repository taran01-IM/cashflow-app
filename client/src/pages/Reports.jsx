import React from 'react';
import { Icon, BUBadge, formatINR, formatDate } from '../primitives.jsx';
import { exportRows } from '../exporters.js';

// Format helpers for export rows. Spreadsheets work better with raw numbers,
// so we strip the currency symbol and signs.
const num = (n) => Math.round(n);

function ExportButtons({ filename, title, subtitle, headers, rows }) {
  const go = (format) => exportRows({ filename, title, subtitle, headers, rows, format });
  return (
    <div style={{ display: 'inline-flex', gap: 6 }}>
      <button className="btn sm" onClick={() => go('pdf')} title="Export as PDF"><Icon name="download" size={12} /> PDF</button>
      <button className="btn sm" onClick={() => go('xlsx')} title="Export as Excel"><Icon name="download" size={12} /> Excel</button>
      <button className="btn sm" onClick={() => go('csv')} title="Export as CSV"><Icon name="download" size={12} /> CSV</button>
    </div>
  );
}

// Toolbar wrapper used above each report's table — left side: filters, right side: export buttons.
function ReportToolbar({ children, exportProps }) {
  return (
    <div className="toolbar" style={{ marginBottom: 10 }}>
      {children}
      <div className="spacer" />
      <ExportButtons {...exportProps} />
    </div>
  );
}

export function ReportsPage({ store, currentUnit, t }) {
  const [tab, setTab] = React.useState('cashflow');
  const [from, setFrom] = React.useState('2026-03-01');
  const [to, setTo] = React.useState('2026-04-28');

  const inRange = (iso) => iso >= from && iso <= to;
  const inflows = store.inflows.filter(i => (currentUnit === 'all' || i.unit === currentUnit) && inRange(i.date));
  const outflows = store.outflows.filter(o => (currentUnit === 'all' || o.unit === currentUnit) && inRange(o.date));
  const banks = store.banks.filter(b => currentUnit === 'all' || b.unit === currentUnit);

  const unitLabel = currentUnit === 'all' ? t('all_units') : currentUnit.toUpperCase();
  const periodLabel = `${formatDate(from)} – ${formatDate(to)}`;
  const subtitle = `${unitLabel} · ${periodLabel}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_reports')}</h1>
          <div className="page-sub">{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('from_date')}</span>
          <input type="date" className="input" style={{ width: 140 }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('to_date')}</span>
          <input type="date" className="input" style={{ width: 140 }} value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        {[
          { id: 'cashflow', label: t('cashflow_report') },
          { id: 'banks', label: t('bank_status_report') },
          { id: 'vendors', label: t('vendor_payment_report') },
          { id: 'collection', label: t('collection_report') },
        ].map(x => (
          <button key={x.id} className="tab" data-active={tab === x.id ? '1' : '0'} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </div>

      {tab === 'cashflow' && <CashFlowReport inflows={inflows} outflows={outflows} subtitle={subtitle} t={t} />}
      {tab === 'banks' && <BankReport banks={banks} inflows={store.inflows} outflows={store.outflows} subtitle={subtitle} t={t} />}
      {tab === 'vendors' && <VendorReport outflows={outflows} subtitle={subtitle} t={t} />}
      {tab === 'collection' && <CollectionReport inflows={inflows} subtitle={subtitle} t={t} />}
    </div>
  );
}

function CashFlowReport({ inflows, outflows, subtitle, t }) {
  const totalIn = inflows.reduce((s, x) => s + x.amount, 0);
  const paidOut = outflows.filter(o => o.status === 'Paid').reduce((s, x) => s + x.amount, 0);
  const pendingOut = outflows.filter(o => o.status === 'Pending').reduce((s, x) => s + x.amount, 0);

  const weeks = {};
  [...inflows, ...outflows].forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-${d.getMonth()}`;
    weeks[key] = weeks[key] || { label: `${formatDate(r.date, { short: true })}`, in: 0, out: 0 };
  });
  inflows.forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-${d.getMonth()}`;
    weeks[key].in += r.amount;
  });
  outflows.forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-${d.getMonth()}`;
    if (r.status === 'Paid') weeks[key].out += r.amount;
  });
  const weekRows = Object.values(weeks).slice(-8);

  const exportHeaders = ['Period', 'Inflow', 'Outflow (paid)', 'Net'];
  const exportData = weekRows.map(w => [w.label, num(w.in), num(w.out), num(w.in - w.out)]);

  return (
    <>
      <div className="stat-row">
        <div className="stat"><div className="lbl">{t('inflow')}</div><div className="val" style={{ color: 'var(--positive)' }}>{formatINR(totalIn)}</div></div>
        <div className="stat"><div className="lbl">{t('paid')} {t('outflow').toLowerCase()}</div><div className="val">{formatINR(paidOut)}</div></div>
        <div className="stat"><div className="lbl">{t('pending')}</div><div className="val" style={{ color: 'var(--warning)' }}>{formatINR(pendingOut)}</div></div>
        <div className="stat"><div className="lbl">Net</div><div className="val" style={{ color: totalIn - paidOut >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{formatINR(totalIn - paidOut)}</div></div>
      </div>
      <ReportToolbar exportProps={{
        filename: 'cashflow-report', title: 'Cash flow report', subtitle,
        headers: exportHeaders, rows: exportData,
      }} />
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Period</th><th className="num">Inflow</th><th className="num">Outflow (paid)</th><th className="num">Net</th></tr></thead>
          <tbody>
            {weekRows.map((w, i) => (
              <tr key={i}>
                <td>{w.label}</td>
                <td className="num" style={{ color: 'var(--positive)' }}>+{formatINR(w.in)}</td>
                <td className="num" style={{ color: 'var(--negative)' }}>−{formatINR(w.out)}</td>
                <td className="num mono" style={{ fontWeight: 600, color: w.in - w.out >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{formatINR(w.in - w.out, { sign: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BankReport({ banks, inflows, outflows, subtitle, t }) {
  const computed = banks.map(b => {
    const inB = inflows.filter(x => x.bankId === b.id).reduce((s, x) => s + x.amount, 0);
    const buBanks = banks.filter(x => x.unit === b.unit);
    const buOut = outflows.filter(x => x.unit === b.unit && x.status === 'Paid').reduce((s, x) => s + x.amount, 0);
    const share = buBanks.length ? buOut / buBanks.length : 0;
    const balance = b.opening + inB - share;
    const usable = balance - b.notInUse;
    return { ...b, inB, share, balance, usable };
  });

  const exportHeaders = ['Bank', 'Account', 'Unit', 'Opening', 'Inflow', 'Paid out', 'Balance', 'Not in use', 'Usable'];
  const exportData = computed.map(b => [
    b.name, b.accountMasked, b.unit.toUpperCase(),
    num(b.opening), num(b.inB), num(b.share), num(b.balance), num(b.notInUse), num(b.usable),
  ]);

  return (
    <>
      <ReportToolbar exportProps={{
        filename: 'bank-status-report', title: 'Bank status', subtitle,
        headers: exportHeaders, rows: exportData,
      }} />
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Bank</th><th>Unit</th><th className="num">Opening</th><th className="num">Inflow</th><th className="num">Paid out</th><th className="num">Balance</th><th className="num">{t('not_in_use')}</th><th className="num">{t('usable')}</th>
          </tr></thead>
          <tbody>
            {computed.map(b => (
              <tr key={b.id}>
                <td><div style={{ fontWeight: 500 }}>{b.name}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.accountMasked}</div></td>
                <td><BUBadge unit={b.unit} /></td>
                <td className="num">{formatINR(b.opening)}</td>
                <td className="num" style={{ color: 'var(--positive)' }}>+{formatINR(b.inB)}</td>
                <td className="num" style={{ color: 'var(--negative)' }}>−{formatINR(b.share)}</td>
                <td className="num" style={{ fontWeight: 600 }}>{formatINR(b.balance)}</td>
                <td className="num" style={{ color: 'var(--text-muted)' }}>{formatINR(b.notInUse)}</td>
                <td className="num" style={{ color: 'var(--positive)', fontWeight: 600 }}>{formatINR(b.usable)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VendorReport({ outflows, subtitle, t }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [sortBy, setSortBy] = React.useState('total');

  const vendor = outflows.filter(o => o.categoryGroup === 'Sundry Creditors');
  const totals = {};
  vendor.forEach(o => {
    if (!totals[o.name]) totals[o.name] = { name: o.name, paid: 0, pending: 0, count: 0 };
    if (o.status === 'Paid') totals[o.name].paid += o.amount;
    else totals[o.name].pending += o.amount;
    totals[o.name].count += 1;
  });

  const allRows = Object.values(totals);
  const filtered = allRows
    .filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'Paid') return r.paid > 0 && r.pending === 0;
      if (statusFilter === 'Pending') return r.pending > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'total') return (b.paid + b.pending) - (a.paid + a.pending);
      if (sortBy === 'paid') return b.paid - a.paid;
      if (sortBy === 'pending') return b.pending - a.pending;
      return a.name.localeCompare(b.name);
    });

  const exportHeaders = ['Vendor', 'Invoices', 'Paid', 'Pending', 'Total'];
  const exportData = filtered.map(r => [r.name, r.count, num(r.paid), num(r.pending), num(r.paid + r.pending)]);

  return (
    <>
      <ReportToolbar exportProps={{
        filename: 'vendor-payment-report', title: 'Vendor payment report', subtitle,
        headers: exportHeaders, rows: exportData,
      }}>
        <input
          className="input"
          style={{ width: 200 }}
          placeholder="Search vendor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'inline-flex', gap: 4, marginLeft: 6 }}>
          {['All', 'Paid', 'Pending'].map(s => (
            <button key={s} className="chip" data-active={statusFilter === s ? '1' : '0'} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
        <select className="input" style={{ width: 140, marginLeft: 6 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="total">Sort: Total</option>
          <option value="paid">Sort: Paid</option>
          <option value="pending">Sort: Pending</option>
          <option value="name">Sort: Name</option>
        </select>
      </ReportToolbar>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Vendor</th><th className="num">Invoices</th><th className="num">{t('paid')}</th><th className="num">{t('pending')}</th><th className="num">{t('total')}</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="num">{r.count}</td>
                <td className="num" style={{ color: 'var(--positive)' }}>{formatINR(r.paid)}</td>
                <td className="num" style={{ color: 'var(--warning)' }}>{formatINR(r.pending)}</td>
                <td className="num" style={{ fontWeight: 600 }}>{formatINR(r.paid + r.pending)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5}><div className="empty"><div className="ttl">{t('no_data')}</div></div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CollectionReport({ inflows, subtitle, t }) {
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState('total');

  const totals = {};
  inflows.forEach(i => {
    if (!totals[i.client]) totals[i.client] = { name: i.client, count: 0, total: 0, last: i.date };
    totals[i.client].count += 1;
    totals[i.client].total += i.amount;
    if (i.date > totals[i.client].last) totals[i.client].last = i.date;
  });

  const filtered = Object.values(totals)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'total') return b.total - a.total;
      if (sortBy === 'receipts') return b.count - a.count;
      if (sortBy === 'recent') return b.last.localeCompare(a.last);
      return a.name.localeCompare(b.name);
    });

  const exportHeaders = ['Client', 'Receipts', 'Last received', 'Total'];
  const exportData = filtered.map(r => [r.name, r.count, r.last, num(r.total)]);

  return (
    <>
      <ReportToolbar exportProps={{
        filename: 'collection-report', title: 'Collection report', subtitle,
        headers: exportHeaders, rows: exportData,
      }}>
        <input
          className="input"
          style={{ width: 200 }}
          placeholder="Search client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ width: 160, marginLeft: 6 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="total">Sort: Total</option>
          <option value="receipts">Sort: Receipts</option>
          <option value="recent">Sort: Most recent</option>
          <option value="name">Sort: Name</option>
        </select>
      </ReportToolbar>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>{t('client')}</th><th className="num">Receipts</th><th>Last received</th><th className="num">{t('total')}</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="num">{r.count}</td>
                <td className="mono" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.last)}</td>
                <td className="num" style={{ fontWeight: 600, color: 'var(--positive)' }}>{formatINR(r.total)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4}><div className="empty"><div className="ttl">{t('no_data')}</div></div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SettingsPage({ tweaks, setTweak, currentUser, t }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_settings')}</h1>
          <div className="page-sub">Workspace and personal preferences</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div className="card-hd"><h3>{t('profile')}</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{currentUser.initials}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{currentUser.phone} · {currentUser.role}</div>
              </div>
            </div>
            <SettingRow label="Phone" value={currentUser.phone} />
            <SettingRow label="Email" value={currentUser.email || '—'} />
            <SettingRow label={t('role')} value={currentUser.role} />
            <SettingRow label="Assigned units" value={currentUser.units.map(u => u.toUpperCase()).join(', ')} />
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><h3>{t('appearance')}</h3></div>
          <div className="card-body">
            <ToggleRow label="Dark mode" value={tweaks.dark} onChange={v => setTweak('dark', v)} />
            <SegRow label={t('language')} value={tweaks.language} options={[{value:'en',label:'English'},{value:'hi',label:'हिन्दी'}]} onChange={v => setTweak('language', v)} />
            <SegRow label={t('density')} value={tweaks.density} options={['compact','comfortable']} onChange={v => setTweak('density', v)} />
            <ColorRow label={t('accent')} value={tweaks.accent} onChange={v => setTweak('accent', v)} />
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-hd"><h3>Notifications</h3><span className="sub">When to alert you</span></div>
          <div className="card-body">
            <ToggleRow label="Pending payments older than 7 days" value={true} onChange={() => {}} />
            <ToggleRow label="Bank balance falls below ₹5 L" value={true} onChange={() => {}} />
            <ToggleRow label="New inflow received" value={false} onChange={() => {}} />
            <ToggleRow label="Weekly cash flow digest (Mondays)" value={true} onChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 12.5 }}>{value}</span>
    </div>
  );
}
function ToggleRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <button className="twk-toggle" data-on={value ? '1' : '0'} onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}
function SegRow({ label, value, options, onChange }) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {opts.map(o => (
          <button key={o.value} className="chip" data-active={value === o.value ? '1' : '0'} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <input type="color" className="twk-swatch" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
