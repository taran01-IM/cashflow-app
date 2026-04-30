import React from 'react';
import { Icon, Modal, BUBadge } from '../primitives.jsx';
import { api } from '../api.js';

export function UsersPage({ businessUnits, currentUser, t, toast, confirm }) {
  const [users, setUsers] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setUsers(await api.users());
    } catch (e) {
      toast(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const onSave = async (data) => {
    try {
      const saved = data.id
        ? await api.updateUser(data.id, data)
        : await api.createUser(data);
      setUsers(prev => data.id
        ? prev.map(u => u.id === saved.id ? saved : u)
        : [...prev, saved]);
      toast(data.id ? 'User updated' : 'User added');
      setEditing(null);
    } catch (e) {
      toast(e.message || 'Save failed');
    }
  };

  const onDelete = (id) => {
    if (id === currentUser.id) {
      toast("You can't delete your own account");
      return;
    }
    confirm('Delete this user? This cannot be undone.', async () => {
      try {
        await api.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        toast('User deleted');
      } catch (e) {
        toast(e.message || 'Delete failed');
      }
    });
  };

  if (currentUser.role !== 'Admin') {
    return (
      <div className="page">
        <div className="card">
          <div className="empty">
            <div className="ttl">Admins only</div>
            <div>You don't have permission to manage users.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <div className="page-sub">{users.length} accounts · manage who can sign in</div>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" /> Add user
        </button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Units</th>
              <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}><div className="empty"><div className="ttl">Loading…</div></div></td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={6}><div className="empty"><div className="ttl">{t('no_data')}</div></div></td></tr>}
            {!loading && users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar">{u.initials}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      {u.id === currentUser.id && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</div>}
                    </div>
                  </div>
                </td>
                <td className="mono">{u.phone}</td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                <td>
                  <span className="badge" data-tone={u.role === 'Admin' ? 'positive' : 'neutral'}>{u.role}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {u.units.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>none</span>}
                    {u.units.map(unitId => <BUBadge key={unitId} unit={unitId} />)}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn ghost icon sm" onClick={() => setEditing(u)} aria-label="Edit"><Icon name="edit" size={13} /></button>
                  <button
                    className="btn ghost icon sm danger"
                    onClick={() => onDelete(u.id)}
                    disabled={u.id === currentUser.id}
                    aria-label="Delete"
                  ><Icon name="trash" size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <UserForm
          user={editing === 'new' ? null : editing}
          businessUnits={businessUnits}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function UserForm({ user, businessUnits, onSave, onClose }) {
  const [name, setName] = React.useState(user?.name || '');
  const [phone, setPhone] = React.useState(user?.phone || '+91');
  const [email, setEmail] = React.useState(user?.email || '');
  const [role, setRole] = React.useState(user?.role || 'User');
  const [units, setUnits] = React.useState(user?.units || []);
  const [saving, setSaving] = React.useState(false);

  const toggleUnit = (id) => {
    setUnits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 6) return;
    setSaving(true);
    await onSave({
      id: user?.id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      role,
      units: role === 'Admin' ? businessUnits.map(u => u.id) : units,
    });
    setSaving(false);
  };

  return (
    <Modal title={user ? 'Edit user' : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label className="field-label">Phone (with country code)</label>
          <input className="input mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919810058408" required />
        </div>
        <div className="field">
          <label className="field-label">Email (optional)</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div className="field">
          <label className="field-label">Role</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Admin', 'User'].map(r => (
              <button key={r} type="button" className="chip" data-active={role === r ? '1' : '0'} onClick={() => setRole(r)}>{r}</button>
            ))}
          </div>
        </div>
        {role === 'User' && (
          <div className="field">
            <label className="field-label">Assigned business units</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {businessUnits.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="chip"
                  data-active={units.includes(u.id) ? '1' : '0'}
                  onClick={() => toggleUnit(u.id)}
                >
                  {u.code}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {units.length === 0 ? 'No units assigned — user will have no access' : `${units.length} unit${units.length === 1 ? '' : 's'} assigned`}
            </div>
          </div>
        )}
        {role === 'Admin' && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            Admins automatically have access to all business units.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
