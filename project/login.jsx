// Login screen
function LoginScreen({ onLogin, t }) {
  const [email, setEmail] = React.useState('admin@moguls.in');
  const [password, setPassword] = React.useState('••••••••');
  const [pending, setPending] = React.useState(false);

  const submit = (e) => {
    e?.preventDefault?.();
    setPending(true);
    setTimeout(() => {
      const user = window.CFA_DATA.USERS.find(u => u.email === email) || window.CFA_DATA.USERS[0];
      onLogin(user);
      setPending(false);
    }, 380);
  };

  const quickLogin = (user) => {
    setEmail(user.email);
    setTimeout(() => onLogin(user), 200);
  };

  return (
    <div className="login-shell">
      <div className="login-side">
        <div className="bg-grid" />
        <div className="brand">
          <div className="brand-mark">CF</div>
          <span>Cashflow</span>
        </div>
        <div className="pitch" style={{ position: 'relative' }}>
          <h1>Real-time visibility into every rupee, across every business unit.</h1>
          <p>{t('sign_in_subtitle')}. Track inflow, outflow and pending obligations at the moment money moves.</p>
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 420 }}>
            {[
              { l: 'Tracked balance', v: '₹78.4 L' },
              { l: 'Pending out', v: '₹12.6 L' },
              { l: 'Net position', v: '+₹65.8 L', positive: true },
            ].map(s => (
              <div key={s.l} style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: s.positive ? 'var(--positive)' : 'var(--text)' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <h2>{t('welcome_back')}</h2>
          <div className="lf-sub">{t('sign_in_subtitle')}</div>
          <div className="field">
            <label className="field-label">{t('email')}</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="field-label">{t('password')}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? '...' : t('sign_in')}
          </button>
          <div className="login-quick">
            <div className="lbl">{t('sign_in_as')}</div>
            {window.CFA_DATA.USERS.map(u => (
              <div key={u.id} className="opt" onClick={() => quickLogin(u)}>
                <div className="avatar">{u.initials}</div>
                <div className="meta">
                  <div className="nm">{u.name}</div>
                  <div className="rl">{u.role} · {u.units.length} {u.units.length === 1 ? 'unit' : 'units'}</div>
                </div>
                <Icon name="arrowUpRight" size={14} />
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
