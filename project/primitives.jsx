// Shared helpers + small UI primitives used across the app.

// ─── Money formatting (INR, lakh/crore) ──────────────────────────────────
function formatINR(n, opts = {}) {
  const { compact = false, sign = false } = opts;
  if (n == null || isNaN(n)) return '—';
  const neg = n < 0;
  const abs = Math.abs(n);
  let str;
  if (compact) {
    if (abs >= 1e7) str = '₹' + (abs / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    else if (abs >= 1e5) str = '₹' + (abs / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
    else if (abs >= 1e3) str = '₹' + (abs / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
    else str = '₹' + abs.toFixed(0);
  } else {
    // Indian numbering grouping: 1,23,45,678
    const intPart = Math.round(abs).toString();
    const lastThree = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
    str = '₹' + grouped;
  }
  return (neg ? '−' : (sign ? '+' : '')) + str;
}

function formatDate(iso, opts = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (opts.short) return `${d.getDate()} ${months[d.getMonth()]}`;
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function todayISO() { return '2026-04-28'; }

// ─── Icons (Lucide-ish, hand-rolled) ─────────────────────────────────────
function Icon({ name, size = 14 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    bank: <><path d="M3 10h18"/><path d="M5 10v8"/><path d="M9 10v8"/><path d="M15 10v8"/><path d="M19 10v8"/><path d="M3 18h18"/><path d="M3 10l9-6 9 6"/></>,
    inflow: <><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></>,
    outflow: <><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></>,
    reports: <><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6"/><path d="M9 17h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    edit: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></>,
    trash: <><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    chevDown: <><path d="m6 9 6 6 6-6"/></>,
    chevRight: <><path d="m9 6 6 6-6 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>,
    arrowUpRight: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
    sidebar: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>,
    filter: <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    trend: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
}

// ─── Modal shell ────────────────────────────────────────────────────────
function Modal({ title, children, onClose, footer, width }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={width ? { width } : undefined}>
        <div className="modal-hd">
          <h2>{title}</h2>
          <button className="btn ghost icon sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Confirm dialog (inline) ────────────────────────────────────────────
function useConfirm() {
  const [conf, setConf] = React.useState(null);
  const ask = (message, onConfirm) => setConf({ message, onConfirm });
  const node = conf ? (
    <Modal title="Confirm" onClose={() => setConf(null)}
      footer={<>
        <button className="btn" onClick={() => setConf(null)}>Cancel</button>
        <button className="btn primary" onClick={() => { conf.onConfirm(); setConf(null); }}>Delete</button>
      </>}>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{conf.message}</p>
    </Modal>
  ) : null;
  return [ask, node];
}

// ─── Toasts ─────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = React.useState([]);
  const push = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 2200);
  };
  const node = (
    <div className="toast-stack">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
  return [push, node];
}

// ─── Searchable client/vendor select ────────────────────────────────────
function Select({ value, options, onChange, placeholder }) {
  return (
    <select className="select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

// ─── Spark line (tiny svg) ──────────────────────────────────────────────
function Sparkline({ values, color = 'currentColor', width = 60, height = 22 }) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── BU pill ────────────────────────────────────────────────────────────
function BUBadge({ unit }) {
  const code = unit?.toUpperCase() || '';
  return <span className={`badge unit-${unit}`}>{code}</span>;
}

Object.assign(window, {
  formatINR, formatDate, todayISO, Icon, Modal, Select, Sparkline, BUBadge,
  useConfirm, useToasts,
});
