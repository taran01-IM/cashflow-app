// Inflow & Outflow tables

function InflowPage({ store, currentUnit, setStore, t, toast, confirm }) {
  const [editing, setEditing] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const banks = store.banks.filter(b => currentUnit === 'all' || b.unit === currentUnit);
  let inflows = store.inflows.filter(i => currentUnit === 'all' || i.unit === currentUnit);
  if (search) {
    const q = search.toLowerCase();
    inflows = inflows.filter(i => i.client.toLowerCase().includes(q) || i.remarks.toLowerCase().includes(q));
  }
  const total = inflows.reduce((s, i) => s + i.amount, 0);

  const onSave = (data) => {
    setStore(s => {
      if (data.id) return { ...s, inflows: s.inflows.map(x => x.id === data.id ? { ...x, ...data } : x) };
      const id = 'in-new-' + Date.now();
      return { ...s, inflows: [{ ...data, id, unit: data.unit || (currentUnit === 'all' ? 'mopl' : currentUnit) }, ...s.inflows] };
    });
    toast(data.id ? 'Inflow updated' : 'Inflow recorded');
    setEditing(null);
  };
  const onDelete = (id) => confirm(t('confirm_delete'), () => {
    setStore(s => ({ ...s, inflows: s.inflows.filter(x => x.id !== id) }));
    toast('Inflow deleted');
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_inflow')}</h1>
          <div className="page-sub">{inflows.length} entries · {formatINR(total)} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="search-input">
            <Icon name="search" size={13} />
            <input className="input" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" /> {t('add_inflow')}</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('client')}</th>
              <th>{t('bank')}</th>
              {currentUnit === 'all' && <th>Unit</th>}
              <th>{t('remarks')}</th>
              <th className="num">{t('amount')}</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {inflows.map(r => {
              const bank = store.banks.find(b => b.id === r.bankId);
              return (
                <tr key={r.id}>
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.date)}</td>
                  <td>{r.client}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{bank?.name || '—'}</td>
                  {currentUnit === 'all' && <td><BUBadge unit={r.unit} /></td>}
                  <td style={{ color: 'var(--text-muted)' }}>{r.remarks}</td>
                  <td className="num" style={{ color: 'var(--positive)', fontWeight: 500 }}>+{formatINR(r.amount)}</td>
                  <td className="actions">
                    <button className="btn ghost icon sm" onClick={() => setEditing(r)}><Icon name="edit" size={13} /></button>
                    <button className="btn ghost icon sm danger" onClick={() => onDelete(r.id)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
              );
            })}
            {inflows.length === 0 && (
              <tr><td colSpan={currentUnit === 'all' ? 7 : 6}><div className="empty"><div className="ttl">{t('no_data')}</div></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <InflowForm row={editing === 'new' ? null : editing} banks={banks} defaultUnit={currentUnit === 'all' ? 'mopl' : currentUnit}
          onSave={onSave} onClose={() => setEditing(null)} t={t} />
      )}
    </div>
  );
}

function InflowForm({ row, banks, defaultUnit, onSave, onClose, t }) {
  const [form, setForm] = React.useState(row || {
    date: todayISO(), client: '', bankId: banks[0]?.id, amount: 0, remarks: '', unit: defaultUnit,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title={row ? `${t('edit')} inflow` : t('add_inflow')} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>{t('cancel')}</button>
        <button className="btn primary" onClick={() => onSave(form)} disabled={!form.client || !form.amount}>{t('save')}</button>
      </>}>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">{t('date')}</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">{t('amount')} (₹)</label>
          <input type="number" className="input mono" value={form.amount} onChange={e => set('amount', Number(e.target.value))} autoFocus />
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('client')}</label>
        <input className="input" value={form.client} list="clients" onChange={e => set('client', e.target.value)} placeholder="Sundara Retail" />
        <datalist id="clients">
          {window.CFA_DATA.CLIENTS.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="field">
        <label className="field-label">{t('bank')}</label>
        <Select value={form.bankId} onChange={v => set('bankId', v)} options={banks.map(b => ({ value: b.id, label: `${b.name} ${b.accountMasked}` }))} />
      </div>
      <div className="field">
        <label className="field-label">{t('remarks')}</label>
        <textarea className="textarea" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────

function OutflowPage({ store, currentUnit, setStore, t, toast, confirm }) {
  const [editing, setEditing] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All'); // All | Pending | Paid

  let outflows = store.outflows.filter(o => currentUnit === 'all' || o.unit === currentUnit);
  if (search) {
    const q = search.toLowerCase();
    outflows = outflows.filter(o => o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q) || o.remarks.toLowerCase().includes(q));
  }
  if (statusFilter !== 'All') outflows = outflows.filter(o => o.status === statusFilter);

  const totalAll = outflows.reduce((s, o) => s + o.amount, 0);
  const totalPaid = outflows.filter(o => o.status === 'Paid').reduce((s, o) => s + o.amount, 0);
  const totalPending = outflows.filter(o => o.status === 'Pending').reduce((s, o) => s + o.amount, 0);

  const onSave = (data) => {
    setStore(s => {
      if (data.id) return { ...s, outflows: s.outflows.map(x => x.id === data.id ? { ...x, ...data } : x) };
      const id = 'out-new-' + Date.now();
      return { ...s, outflows: [{ ...data, id, unit: data.unit || (currentUnit === 'all' ? 'mopl' : currentUnit) }, ...s.outflows] };
    });
    toast(data.id ? 'Outflow updated' : 'Outflow recorded');
    setEditing(null);
  };
  const onDelete = (id) => confirm(t('confirm_delete'), () => {
    setStore(s => ({ ...s, outflows: s.outflows.filter(x => x.id !== id) }));
    toast('Outflow deleted');
  });
  const toggleStatus = (id) => {
    setStore(s => ({
      ...s, outflows: s.outflows.map(x => x.id === id ? { ...x, status: x.status === 'Paid' ? 'Pending' : 'Paid' } : x),
    }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_outflow')}</h1>
          <div className="page-sub">{outflows.length} entries · {formatINR(totalAll)} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="search-input">
            <Icon name="search" size={13} />
            <input className="input" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" /> {t('add_outflow')}</button>
        </div>
      </div>

      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat"><div className="lbl">{t('total')}</div><div className="val">{formatINR(totalAll)}</div></div>
        <div className="stat"><div className="lbl">{t('paid')}</div><div className="val" style={{ color: 'var(--positive)' }}>{formatINR(totalPaid)}</div></div>
        <div className="stat"><div className="lbl">{t('pending')}</div><div className="val" style={{ color: 'var(--warning)' }}>{formatINR(totalPending)}</div></div>
      </div>

      <div className="toolbar" style={{ marginBottom: 10 }}>
        {['All', 'Pending', 'Paid'].map(s => (
          <button key={s} className="chip" data-active={statusFilter === s ? '1' : '0'} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('name')}</th>
              <th>{t('category')}</th>
              {currentUnit === 'all' && <th>Unit</th>}
              <th>{t('remarks')}</th>
              <th>{t('status')}</th>
              <th className="num">{t('amount')}</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {outflows.map(r => (
              <tr key={r.id}>
                <td className="mono" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.date)}</td>
                <td>{r.name}</td>
                <td><span style={{ color: 'var(--text-secondary)', fontSize: 11.5 }}>{r.categoryGroup}</span> <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>· {r.category}</span></td>
                {currentUnit === 'all' && <td><BUBadge unit={r.unit} /></td>}
                <td style={{ color: 'var(--text-muted)' }}>{r.remarks}</td>
                <td>
                  <button className={`badge ${r.status === 'Paid' ? 'paid' : 'pending'} dot`} style={{ border: 0, cursor: 'default' }} onClick={() => toggleStatus(r.id)}>{t(r.status === 'Paid' ? 'paid' : 'pending')}</button>
                </td>
                <td className="num" style={{ color: r.status === 'Paid' ? 'var(--text)' : 'var(--text-muted)', fontWeight: 500 }}>−{formatINR(r.amount)}</td>
                <td className="actions">
                  <button className="btn ghost icon sm" title={r.status === 'Paid' ? t('mark_pending') : t('mark_paid')} onClick={() => toggleStatus(r.id)}><Icon name="check" size={13} /></button>
                  <button className="btn ghost icon sm" onClick={() => setEditing(r)}><Icon name="edit" size={13} /></button>
                  <button className="btn ghost icon sm danger" onClick={() => onDelete(r.id)}><Icon name="trash" size={13} /></button>
                </td>
              </tr>
            ))}
            {outflows.length === 0 && (
              <tr><td colSpan={currentUnit === 'all' ? 8 : 7}><div className="empty"><div className="ttl">{t('no_data')}</div></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <OutflowForm row={editing === 'new' ? null : editing} defaultUnit={currentUnit === 'all' ? 'mopl' : currentUnit}
          onSave={onSave} onClose={() => setEditing(null)} t={t} />
      )}
    </div>
  );
}

function OutflowForm({ row, defaultUnit, onSave, onClose, t }) {
  const [form, setForm] = React.useState(row || {
    date: todayISO(), name: '', categoryGroup: 'Sundry Creditors', category: 'Vendor 1',
    amount: 0, status: 'Pending', remarks: '', unit: defaultUnit,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const groupChildren = window.CFA_DATA.CATEGORIES.find(g => g.group === form.categoryGroup)?.children || [];

  return (
    <Modal title={row ? `${t('edit')} outflow` : t('add_outflow')} onClose={onClose} width={520}
      footer={<>
        <button className="btn" onClick={onClose}>{t('cancel')}</button>
        <button className="btn primary" onClick={() => onSave(form)} disabled={!form.name || !form.amount}>{t('save')}</button>
      </>}>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">{t('date')}</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">{t('amount')} (₹)</label>
          <input type="number" className="input mono" value={form.amount} onChange={e => set('amount', Number(e.target.value))} autoFocus />
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('name')}</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Supplies" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Category group</label>
          <Select value={form.categoryGroup} onChange={v => {
            const c = window.CFA_DATA.CATEGORIES.find(g => g.group === v);
            setForm(f => ({ ...f, categoryGroup: v, category: c?.children[0] || '' }));
          }} options={window.CFA_DATA.CATEGORIES.map(g => g.group)} />
        </div>
        <div className="field">
          <label className="field-label">{t('category')}</label>
          <Select value={form.category} onChange={v => set('category', v)} options={groupChildren} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('status')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Pending', 'Paid'].map(s => (
            <button key={s} className="chip" data-active={form.status === s ? '1' : '0'} onClick={() => set('status', s)} style={{ flex: 1, justifyContent: 'center', height: 30 }}>{t(s.toLowerCase())}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('remarks')}</label>
        <textarea className="textarea" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
      </div>
    </Modal>
  );
}

window.InflowPage = InflowPage;
window.OutflowPage = OutflowPage;
