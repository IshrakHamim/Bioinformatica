import { useState } from 'react';
import { useAuth } from '../auth/auth';
import { Logo } from '../components/Layout';

export default function Login() {
  const { login } = useAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="login-wrap">
      <form
        className="card login-card col"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const ok = await login(user, pass);
          setBusy(false);
          if (!ok) setErr('Wrong username or password.');
        }}
      >
        <div className="row" style={{ justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem' }}>
          <Logo size={38} /> Bioinformatica
        </div>
        <p className="center muted small" style={{ marginTop: 0 }}>Learn bioinformatics by playing with it. Sign in to track your progress across devices.</p>
        <label className="field"><span>Username</span><input autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} autoFocus /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        {err && <div className="small" style={{ color: 'var(--danger)' }}>{err}</div>}
        <button className="btn primary" disabled={busy || !user || !pass}>{busy ? 'Checking…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
