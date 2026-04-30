import React from 'react';
import { Icon, Sparkline, formatINR, formatDate } from '../primitives.jsx';

export function Dashboard({ store, currentUnit, t }) {
  const banks = store.banks.filter(b => currentUnit === 'all' || b.unit === currentUnit);
  const inflows = store.inflows.filter(i => currentUnit === 'all' || i.unit === currentUnit);
  const outflows = store.outflows.filter(o => currentUnit === 'all' || o.unit === currentUnit);

  const totalInflow = inflows.reduce((s, i) => s + i.amount, 0);
  const paidOutflow = outflows.filter(o => o.status === 'Paid').reduce((s, o) => s + o.amount, 0);
  const pendingOutflow = outflows.filter(o => o.status === 'Pending').reduce((s, o) => s + o.amount, 0);
  const opening = banks.reduce((s, b) => s + b.opening, 0);
  const bankBalance = opening + totalInflow - paidOutflow;
  const netPosition = bankBalance - pendingOutflow;

  const days = [];
  const today = new Date('2026-04-28');
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const inflowDay = inflows.filter(x => x.date === iso).reduce((s, x) => s + x.amount, 0);
    const outflowDay = outflows.filter(x => x.date === iso && x.status === 'Paid').reduce((s, x) => s + x.amount, 0);
    days.push({ date: iso, inflow: inflowDay, outflow: outflowDay });
  }

  const catTotals = {};
  outflows.forEach(o => {
    catTotals[o.categoryGroup] = (catTotals[o.categoryGroup] || 0) + o.amount;
  });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCat = Math.max(...catEntries.map(e => e[1]), 1);

  const recent = [
    ...inflows.slice(0, 6).map(x => ({ ...x, kind: 'in' })),
    ...outflows.slice(0, 6).map(x => ({ ...x, kind: 'out' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const sparkValues = days.map(d => d.inflow - d.outflow);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_dashboard')}</h1>
          <div className="page-sub">{t('last_30')} · {currentUnit === 'all' ? t('all_units') : currentUnit.toUpperCase()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Icon name="calendar" /> Apr 2026</button>
          <button className="btn"><Icon name="download" /> Export</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label={t('kpi_inflow')} value={formatINR(totalInflow)} delta="+12.4%" deltaUp spark={days.map(d => d.inflow)} sparkColor="var(--positive)" />
        <KpiCard label={t('kpi_outflow')} value={formatINR(paidOutflow)} delta="+6.1%" deltaDown spark={days.map(d => d.outflow)} sparkColor="var(--negative)" />
        <KpiCard label={t('kpi_balance')} value={formatINR(bankBalance)} delta={`${banks.length} accounts`} spark={days.map((_,i)=> opening + days.slice(0,i+1).reduce((a,d)=>a+d.inflow-d.outflow,0))} sparkColor="var(--info)" />
        <KpiCard label={t('kpi_pending')} value={formatINR(pendingOutflow)} delta={`${outflows.filter(o=>o.status==='Pending').length} items`} sparkColor="var(--warning)" />
        <KpiCard label={t('kpi_diff')} value={formatINR(netPosition)} positive={netPosition >= 0} delta={netPosition >= 0 ? t('healthy') : t('shortfall')} spark={sparkValues} sparkColor={netPosition >= 0 ? 'var(--positive)' : 'var(--negative)'} />
      </div>

      <div className="cols-2-1">
        <div className="card">
          <div className="card-hd">
            <div>
              <h3>{t('cash_trend')}</h3>
              <div className="sub">Daily inflow vs paid outflow · {t('last_30')}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 8, height: 8, background: 'var(--positive)', borderRadius: 2 }} /> {t('inflow')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 8, height: 8, background: 'var(--negative)', borderRadius: 2 }} /> {t('outflow')}</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '14px 14px 18px' }}>
            <TrendChart days={days} />
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>{t('by_category')}</h3>
            <span className="sub">{outflows.length} items</span>
          </div>
          <div className="card-body">
            {catEntries.map(([name, val], i) => {
              const hue = (i * 47) % 360;
              const color = `oklch(0.65 0.13 ${hue})`;
              return (
                <div key={name} className="cat-row">
                  <span className="swatch" style={{ background: color }} />
                  <span className="name">{name}</span>
                  <span className="bar"><div style={{ width: `${(val / maxCat) * 100}%`, background: color }} /></span>
                  <span className="val mono">{formatINR(val, { compact: true })}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cols-2-1" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-hd">
            <h3>{t('recent_activity')}</h3>
          </div>
          <div className="tbl-wrap" style={{ border: 0, borderRadius: 0, boxShadow: 'none' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>{t('date')}</th>
                  <th>{t('name')}</th>
                  <th>Type</th>
                  <th className="num">{t('amount')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span style={{
                        display: 'grid', placeItems: 'center',
                        width: 22, height: 22, borderRadius: 6,
                        background: r.kind === 'in' ? 'var(--positive-soft)' : 'var(--negative-soft)',
                        color: r.kind === 'in' ? 'var(--positive)' : 'var(--negative)',
                      }}>
                        <Icon name={r.kind === 'in' ? 'inflow' : 'outflow'} size={12} />
                      </span>
                    </td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.date)}</td>
                    <td>{r.kind === 'in' ? r.client : r.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.kind === 'in' ? t('inflow') : (r.categoryGroup || t('outflow'))}</td>
                    <td className="num" style={{ color: r.kind === 'in' ? 'var(--positive)' : 'var(--text)' }}>
                      {r.kind === 'in' ? '+' : '−'}{formatINR(r.amount).replace('₹', '₹')}
                    </td>
                    <td>
                      {r.kind === 'in'
                        ? <span className="badge paid dot">Received</span>
                        : <span className={`badge ${r.status === 'Paid' ? 'paid' : 'pending'} dot`}>{t(r.status === 'Paid' ? 'paid' : 'pending')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>Bank balances</h3>
            <span className="sub">{banks.length} accounts</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {banks.map(b => {
              const inflowB = inflows.filter(x => x.bankId === b.id).reduce((s, x) => s + x.amount, 0);
              const balance = b.opening + inflowB;
              const usable = balance - b.notInUse;
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-sunken)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="bank" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{b.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.accountMasked}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{formatINR(balance, { compact: true })}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>usable {formatINR(usable, { compact: true })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, deltaUp, deltaDown, positive, spark, sparkColor }) {
  let cls = 'flat';
  if (deltaUp) cls = 'up';
  if (deltaDown) cls = 'down';
  return (
    <div className="kpi" style={positive === false ? { borderColor: 'var(--negative-soft)' } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={positive === false ? { color: 'var(--negative)' } : positive === true ? { color: 'var(--positive)' } : undefined}>{value}</div>
      <div className="kpi-foot">
        {delta && <span className={`delta ${cls}`}>{delta}</span>}
      </div>
      {spark && <div className="kpi-spark"><Sparkline values={spark} color={sparkColor} width={70} height={24} /></div>}
    </div>
  );
}

function TrendChart({ days }) {
  const W = 720, H = 220, pad = { l: 44, r: 12, t: 12, b: 26 };
  const inflows = days.map(d => d.inflow);
  const outflows = days.map(d => d.outflow);
  const maxV = Math.max(...inflows, ...outflows, 1);
  const yMax = Math.ceil(maxV / 100000) * 100000;
  const xStep = (W - pad.l - pad.r) / (days.length - 1);
  const yScale = (v) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const inPath = days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${pad.l + i * xStep} ${yScale(d.inflow)}`).join(' ');
  const outPath = days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${pad.l + i * xStep} ${yScale(d.outflow)}`).join(' ');
  const inArea = inPath + ` L ${pad.l + (days.length - 1) * xStep} ${H - pad.b} L ${pad.l} ${H - pad.b} Z`;
  const outArea = outPath + ` L ${pad.l + (days.length - 1) * xStep} ${H - pad.b} L ${pad.l} ${H - pad.b} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ v: yMax * p, y: yScale(yMax * p) }));
  const xLabels = [0, 7, 14, 21, 29].map(i => ({ d: days[i], x: pad.l + i * xStep }));

  const [hover, setHover] = React.useState(null);
  const wrapRef = React.useRef(null);

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const ratio = W / rect.width;
    const x = (e.clientX - rect.left) * ratio;
    const i = Math.round((x - pad.l) / xStep);
    if (i >= 0 && i < days.length) setHover({ i, day: days[i] });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ height: 220 }}>
        <g className="chart-grid">
          {yTicks.map((tick, i) => (
            <line key={i} x1={pad.l} x2={W - pad.r} y1={tick.y} y2={tick.y} />
          ))}
        </g>
        <path d={inArea} className="chart-area inflow" />
        <path d={outArea} className="chart-area outflow" />
        <path d={inPath} className="chart-line inflow" />
        <path d={outPath} className="chart-line outflow" />
        <g className="chart-axis">
          {yTicks.map((tick, i) => (
            <text key={i} x={pad.l - 6} y={tick.y + 3} textAnchor="end">
              {tick.v >= 100000 ? (tick.v / 100000).toFixed(0) + 'L' : (tick.v / 1000).toFixed(0) + 'K'}
            </text>
          ))}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={H - 8} textAnchor="middle">{formatDate(l.d.date, { short: true })}</text>
          ))}
        </g>
        {hover && (
          <g>
            <line x1={pad.l + hover.i * xStep} x2={pad.l + hover.i * xStep} y1={pad.t} y2={H - pad.b}
              stroke="var(--text-muted)" strokeDasharray="2 3" strokeWidth="1" />
            <circle cx={pad.l + hover.i * xStep} cy={yScale(hover.day.inflow)} r="3" fill="var(--positive)" />
            <circle cx={pad.l + hover.i * xStep} cy={yScale(hover.day.outflow)} r="3" fill="var(--negative)" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="chart-tip" style={{
          left: `${((pad.l + hover.i * xStep) / W) * 100}%`,
          top: 0, transform: 'translate(-50%, -100%)',
        }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>{formatDate(hover.day.date)}</div>
          <div>↑ {formatINR(hover.day.inflow, { compact: true })}</div>
          <div>↓ {formatINR(hover.day.outflow, { compact: true })}</div>
        </div>
      )}
    </div>
  );
}
