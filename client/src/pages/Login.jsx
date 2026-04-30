import React from 'react';
import { Icon } from '../primitives.jsx';

// Seed phones — used for the quick-login chips. Server returns the OTP in
// dev mode so we display it here.
const QUICK_USERS = [
  { phone: '+919810011111', name: 'Aarav Mehta',  role: 'Admin', initials: 'AM', units: 3 },
  { phone: '+919810022222', name: 'Priya Shah',   role: 'User',  initials: 'PS', units: 2 },
  { phone: '+919810033333', name: 'Rohan Kapoor', role: 'User',  initials: 'RK', units: 1 },
];

function formatPhoneInput(s) {
  // Keep only + and digits; UI is intentionally permissive — server normalises again.
  return s.replace(/[^+\d\s]/g, '').slice(0, 18);
}

export function LoginScreen({ onRequestOtp, onVerifyOtp, t }) {
  const [step, setStep] = React.useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = React.useState('+91');
  const [otp, setOtp] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [devOtp, setDevOtp] = React.useState(null);
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  // Countdown for resend
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const requestOtp = async (overridePhone) => {
    const number = (overridePhone ?? phone).trim();
    if (!number || number.length < 6) {
      setError('Enter a valid phone number');
      return;
    }
    setPending(true);
    setError(null);
    setOtp('');
    try {
      const resp = await onRequestOtp(number);
      setPhone(number);
      setStep('otp');
      setSecondsLeft(30);
      // Dev mode: server returns the OTP so we can autofill / show it.
      if (resp?.devOtp) {
        setDevOtp(resp.devOtp);
        setOtp(resp.devOtp);
      } else {
        setDevOtp(null);
      }
    } catch (err) {
      if (err.status === 404) setError('That number is not registered');
      else if (err.status === 429) setError(err.message);
      else setError(err.message || 'Could not send OTP');
    } finally {
      setPending(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.trim();
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onVerifyOtp(phone, code);
    } catch (err) {
      if (err.status === 401) {
        const left = err.attemptsLeft != null ? ` (${err.attemptsLeft} attempts left)` : '';
        setError(`Invalid OTP${left}`);
      } else {
        setError(err.message || 'Verification failed');
      }
    } finally {
      setPending(false);
    }
  };

  const submit = (e) => {
    e?.preventDefault?.();
    if (step === 'phone') requestOtp();
    else verifyOtp();
  };

  const goBack = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    setDevOtp(null);
  };

  const quickLogin = (u) => requestOtp(u.phone);

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
          <div className="lf-sub">
            {step === 'phone' ? 'Sign in with your phone — we\'ll send you a 6-digit OTP.' : `Enter the OTP sent to ${phone}`}
          </div>

          {step === 'phone' && (
            <div className="field">
              <label className="field-label">Phone number</label>
              <input
                className="input mono"
                value={phone}
                onChange={e => setPhone(formatPhoneInput(e.target.value))}
                placeholder="+91 98100 11111"
                autoFocus
                inputMode="tel"
              />
            </div>
          )}

          {step === 'otp' && (
            <>
              <div className="field">
                <label className="field-label">OTP</label>
                <input
                  className="input mono"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  inputMode="numeric"
                  style={{ letterSpacing: '0.3em', fontSize: 16, textAlign: 'center' }}
                />
              </div>
              {devOtp && (
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: -6 }}>
                  Dev mode — OTP <strong className="mono" style={{ color: 'var(--text)' }}>{devOtp}</strong> auto-filled. (Plug in an SMS provider for production.)
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginTop: 4 }}>
                <button type="button" className="btn ghost sm" onClick={goBack}>← Change number</button>
                <button
                  type="button"
                  className="btn ghost sm"
                  disabled={secondsLeft > 0 || pending}
                  onClick={() => requestOtp()}
                >
                  {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          {error && (
            <div style={{ color: 'var(--negative)', fontSize: 12, marginTop: 4 }}>{error}</div>
          )}

          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? '...' : (step === 'phone' ? 'Send OTP' : 'Verify & sign in')}
          </button>

          {step === 'phone' && (
            <div className="login-quick">
              <div className="lbl">{t('sign_in_as')}</div>
              {QUICK_USERS.map(u => (
                <div key={u.phone} className="opt" onClick={() => !pending && quickLogin(u)}>
                  <div className="avatar">{u.initials}</div>
                  <div className="meta">
                    <div className="nm">{u.name}</div>
                    <div className="rl mono">{u.phone} · {u.role}</div>
                  </div>
                  <Icon name="arrowUpRight" size={14} />
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
