// Main app shell — sidebar, topbar, BU switcher, page routing

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "language": "en",
  "density": "comfortable",
  "accent": "#16a34a",
  "role": "Admin",
  "sidebarCollapsed": false
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [page, setPage] = React.useState('dashboard');
  const [currentUnit, setCurrentUnit] = React.useState('mopl');
  const [buMenuOpen, setBuMenuOpen] = React.useState(false);

  const [store, setStore] = React.useState(() => ({
    banks: [...window.CFA_DATA.BANKS_SEED],
    inflows: [...window.CFA_DATA.SEED_INFLOWS],
    outflows: [...window.CFA_DATA.SEED_OUTFLOWS],
  }));

  const [pushToast, toastNode] = useToasts();
  const [confirm, confirmNode] = useConfirm();

  // i18n
  const t = React.useCallback((key) => {
    return window.CFA_I18N[tweaks.language]?.[key] || window.CFA_I18N.en[key] || key;
  }, [tweaks.language]);

  // Apply theme + density to document
  React.useEffect(() => {
    document.body.dataset.theme = tweaks.dark ? 'dark' : 'light';
    document.body.dataset.density = tweaks.density;
    document.body.dataset.lang = tweaks.language;
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    document.documentElement.style.setProperty('--accent-soft', tweaks.accent + '22');
  }, [tweaks.dark, tweaks.density, tweaks.language, tweaks.accent]);

  // Effective role from tweaks
  const effectiveUser = React.useMemo(() => {
    if (!currentUser) return null;
    return { ...currentUser, role: tweaks.role || currentUser.role };
  }, [currentUser, tweaks.role]);

  // Filter BUs by role
  const visibleBUs = React.useMemo(() => {
    if (!effectiveUser) return window.CFA_DATA.BUSINESS_UNITS;
    if (effectiveUser.role === 'Admin') return window.CFA_DATA.BUSINESS_UNITS;
    return window.CFA_DATA.BUSINESS_UNITS.filter(u => effectiveUser.units.includes(u.id));
  }, [effectiveUser]);

  // Reset BU if not visible anymore
  React.useEffect(() => {
    if (!visibleBUs.find(u => u.id === currentUnit) && currentUnit !== 'all') {
      setCurrentUnit(visibleBUs[0]?.id || 'mopl');
    }
  }, [visibleBUs, currentUnit]);

  // Close BU menu on outside click
  React.useEffect(() => {
    if (!buMenuOpen) return;
    const onClick = (e) => { if (!e.target.closest('.bu-switcher')) setBuMenuOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [buMenuOpen]);

  if (!currentUser) {
    return (
      <>
        <LoginScreen onLogin={(u) => { setCurrentUser(u); setTweak('role', u.role); }} t={t} />
        {tweakPanel(tweaks, setTweak, t)}
      </>
    );
  }

  const currentBU = window.CFA_DATA.BUSINESS_UNITS.find(u => u.id === currentUnit);
  const showAllOption = effectiveUser.role === 'Admin' && visibleBUs.length > 1;

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: t('nav_dashboard') },
    { id: 'banks',     icon: 'bank',      label: t('nav_banks') },
    { id: 'inflow',    icon: 'inflow',    label: t('nav_inflow') },
    { id: 'outflow',   icon: 'outflow',   label: t('nav_outflow') },
    { id: 'reports',   icon: 'reports',   label: t('nav_reports') },
    { id: 'settings',  icon: 'settings',  label: t('nav_settings') },
  ];

  return (
    <>
      <div className="app" data-sidebar={tweaks.sidebarCollapsed ? 'collapsed' : 'expanded'}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-mark">CF</div>
            <span>Cashflow</span>
          </div>
          <button className="btn ghost icon sm" onClick={() => setTweak('sidebarCollapsed', !tweaks.sidebarCollapsed)} aria-label="Toggle sidebar">
            <Icon name="sidebar" />
          </button>

          <div className="bu-switcher" style={{ marginLeft: 8 }}>
            <button className="bu-trigger" onClick={() => setBuMenuOpen(o => !o)}>
              <span className="bu-dot" style={{ background: currentBU?.color || 'var(--text-muted)' }} />
              <span style={{ fontWeight: 600 }}>{currentUnit === 'all' ? t('all_units') : currentBU?.code}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>· {currentUnit === 'all' ? `${visibleBUs.length} units` : currentBU?.name}</span>
              <Icon name="chevDown" size={12} />
            </button>
            {buMenuOpen && (
              <div className="bu-menu">
                {showAllOption && (
                  <div className="bu-option" data-active={currentUnit === 'all' ? '1' : '0'} onClick={() => { setCurrentUnit('all'); setBuMenuOpen(false); }}>
                    <span className="bu-dot" style={{ background: 'var(--text-muted)' }} />
                    <div className="name">
                      <div>{t('all_units')}</div>
                      <span className="full">Consolidated view</span>
                    </div>
                    <Icon name="check" size={14} className="check" />
                    <span className="check"><Icon name="check" size={14} /></span>
                  </div>
                )}
                {visibleBUs.map(u => (
                  <div key={u.id} className="bu-option" data-active={currentUnit === u.id ? '1' : '0'} onClick={() => { setCurrentUnit(u.id); setBuMenuOpen(false); }}>
                    <span className="bu-dot" style={{ background: u.color }} />
                    <div className="name">
                      <div style={{ fontWeight: 500 }}>{u.code}</div>
                      <span className="full">{u.name}</span>
                    </div>
                    <span className="check"><Icon name="check" size={14} /></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button className="btn ghost icon sm" onClick={() => setPage('reports')} title={t('nav_reports')}><Icon name="reports" /></button>
            <button className="btn ghost icon sm" onClick={() => setTweak('dark', !tweaks.dark)} title="Theme">
              <Icon name={tweaks.dark ? 'sun' : 'moon'} />
            </button>
            <button className="btn ghost icon sm" title="Notifications"><Icon name="bell" /></button>
            <div className="topbar-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
              <div className="avatar">{effectiveUser.initials}</div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{effectiveUser.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{effectiveUser.role}</div>
              </div>
            </div>
            <button className="btn ghost icon sm" onClick={() => setCurrentUser(null)} title={t('nav_logout')}><Icon name="logout" /></button>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="nav-section">Workspace</div>
          {navItems.map(item => (
            <button key={item.id} className="nav-item" data-active={page === item.id ? '1' : '0'} onClick={() => setPage(item.id)} title={item.label}>
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border)', display: tweaks.sidebarCollapsed ? 'none' : 'block' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Active unit</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="bu-dot" style={{ background: currentBU?.color || 'var(--text-muted)' }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>{currentUnit === 'all' ? t('all_units') : currentBU?.name}</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {page === 'dashboard' && <Dashboard store={store} currentUnit={currentUnit} t={t} />}
          {page === 'banks' && <BanksPage store={store} currentUnit={currentUnit} setStore={setStore} t={t} toast={pushToast} confirm={confirm} />}
          {page === 'inflow' && <InflowPage store={store} currentUnit={currentUnit} setStore={setStore} t={t} toast={pushToast} confirm={confirm} />}
          {page === 'outflow' && <OutflowPage store={store} currentUnit={currentUnit} setStore={setStore} t={t} toast={pushToast} confirm={confirm} />}
          {page === 'reports' && <ReportsPage store={store} currentUnit={currentUnit} t={t} />}
          {page === 'settings' && <SettingsPage tweaks={tweaks} setTweak={setTweak} currentUser={effectiveUser} t={t} />}
        </main>
      </div>

      {toastNode}
      {confirmNode}
      {tweakPanel(tweaks, setTweak, t)}
    </>
  );
}

function tweakPanel(tweaks, setTweak, t) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakToggle label="Dark mode" value={tweaks.dark} onChange={(v) => setTweak('dark', v)} />
      <TweakColor label="Accent" value={tweaks.accent} onChange={(v) => setTweak('accent', v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Density" value={tweaks.density} options={['compact', 'comfortable']} onChange={(v) => setTweak('density', v)} />
      <TweakToggle label="Sidebar collapsed" value={tweaks.sidebarCollapsed} onChange={(v) => setTweak('sidebarCollapsed', v)} />
      <TweakSection label="Localisation" />
      <TweakRadio label="Language" value={tweaks.language} options={[{value:'en',label:'EN'},{value:'hi',label:'HI'}]} onChange={(v) => setTweak('language', v)} />
      <TweakSection label="Access" />
      <TweakRadio label="Role" value={tweaks.role} options={['Admin', 'User']} onChange={(v) => setTweak('role', v)} />
    </TweaksPanel>
  );
}

window.App = App;
