import React from 'react';
import { Icon, Modal, Select, BUBadge, formatINR } from '../primitives.jsx';
import { api } from '../api.js';

export function BanksPage({ store, currentUnit, setStore, businessUnits, t, toast, confirm }) {
  const [editing, setEditing] = React.useState(null);
  const banks = store.banks.filter(b => currentUnit === 'all' || b.unit === currentUnit);

  const computeBalance = (b) => {
    const inflowB = store.inflows.filter(x => x.bankId === b.id).reduce((s, x) => s + x.amount, 0);
    return b.opening + inflowB;
  };

  const onSave = async (data) => {
    try {
      const saved = data.id
        ? await api.updateBank(data.id, data)
        : await api.createBank(data);
      setStore(s => data.id
        ? { ...s, banks: s.banks.map(b => b.id === saved.id ? saved : b) }
        : { ...s, banks: [...s.banks, saved] });
      toast(data.id ? 'Bank updated' : 'Bank added');
      setEditing(null);
    } catch (e) {
      toast(e.message || 'Save failed');
    }
  };

  const onDelete = (id) => {
    confirm(t('confirm_delete'), async () => {
      try {
        await api.deleteBank(id);
        setStore(s => ({ ...s, banks: s.banks.filter(b => b.id !== id) }));
        toast('Bank deleted');
      } catch (e) {
        toast(e.message || 'Delete failed');
      }
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav_banks')}</h1>
          <div className="page-sub">{banks.length} accounts · {currentUnit === 'all' ? t('all_units') : currentUnit.toUpperCase()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={() => setEditing('new')}>
            <Icon name="plus" /> {t('add_bank')}
          </button>
        </div>
      </div>

      {banks.length === 0 ? (
        <div className="card"><div className="empty"><div className="ttl">{t('no_data')}</div><div>Add your first bank to start tracking.</div></div></div>
      ) : (
        <div className="bank-grid">
          {banks.map(b => {
            const balance = computeBalance(b);
            const usable = balance - b.notInUse;
            const bu = businessUnits.find(u => u.id === b.unit);
            return (
              <div key={b.id} className="bank-card">
                <div className="actions">
                  <button className="btn ghost icon sm" onClick={() => setEditing(b)} aria-label="Edit"><Icon name="edit" size={13} /></button>
                  <button className="btn ghost icon sm danger" onClick={() => onDelete(b.id)} aria-label="Delete"><Icon name="trash" size={13} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bu?.color, opacity: 0.18 }} />
                  <div>
                    <div className="name">{b.name}</div>
                    <div className="acct">{b.accountMasked} · {b.branch}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BUBadge unit={b.unit} />
                  <span className="badge dot" style={{ color: 'var(--text-muted)' }}>active</span>
                </div>
                <div className="amounts">
                  <div className="amount-block">
                    <div className="lbl">{t('balance')}</div>
                    <div className="val mono">{formatINR(balance, { compact: true })}</div>
                  </div>
                  <div className="amount-block">
                    <div className="lbl">{t('not_in_use')}</div>
                    <div className="val mono" style={{ color: 'var(--text-muted)' }}>{formatINR(b.notInUse, { compact: true })}</div>
                  </div>
                  <div className="amount-block usable" style={{ gridColumn: '1 / -1' }}>
                    <div className="lbl">{t('usable')}</div>
                    <div className="val mono">{formatINR(usable, { compact: true })}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <BankForm
          bank={editing === 'new' ? null : editing}
          defaultUnit={currentUnit === 'all' ? (businessUnits[0]?.id || 'mopl') : currentUnit}
          businessUnits={businessUnits}
          onSave={onSave}
          onClose={() => setEditing(null)}
          t={t}
        />
      )}
    </div>
  );
}

function BankForm({ bank, defaultUnit, businessUnits, onSave, onClose, t }) {
  const [form, setForm] = React.useState(bank || {
    name: '', accountMasked: '••••', branch: '', unit: defaultUnit, opening: 0, notInUse: 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.name) return;
    onSave(form);
  };
  return (
    <Modal title={bank ? `${t('edit')} bank` : t('add_bank')} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>{t('cancel')}</button>
        <button className="btn primary" onClick={submit}>{t('save')}</button>
      </>}>
      <div className="field">
        <label className="field-label">{t('name')}</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="HDFC Bank" autoFocus />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">{t('account')}</label>
          <input className="input mono" value={form.accountMasked} onChange={e => set('accountMasked', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">{t('branch')}</label>
          <input className="input" value={form.branch} onChange={e => set('branch', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('business_unit')}</label>
        <Select value={form.unit} onChange={v => set('unit', v)}
          options={businessUnits.map(u => ({ value: u.id, label: `${u.code} — ${u.name}` }))} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">{t('opening_balance')} (₹)</label>
          <input className="input mono" type="number" value={form.opening} onChange={e => set('opening', Number(e.target.value))} />
        </div>
        <div className="field">
          <label className="field-label">{t('not_in_use')} (₹)</label>
          <input className="input mono" type="number" value={form.notInUse} onChange={e => set('notInUse', Number(e.target.value))} />
        </div>
      </div>
    </Modal>
  );
}
