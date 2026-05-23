import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Account({ user, onLogin, onLogout }) {
  const [tab, setTab]           = useState('login');
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [status, setStatus]     = useState('');
  const [isError, setIsError]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const notify = (msg, err = false) => {
    setStatus(msg); setIsError(err);
    if (!err) setTimeout(() => setStatus(''), 3000);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res  = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ name: data.name, email: data.email });
        notify('¡Cuenta creada! Bienvenido/a.');
        setTimeout(() => navigate('/'), 1200);
      } else { notify(data.error || 'Error al registrarse.', true); }
    } catch { notify('Error de conexión.', true); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res  = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ name: data.name, email: data.email });
        notify('¡Bienvenido/a de nuevo!');
        setTimeout(() => navigate('/'), 1200);
      } else { notify(data.error || 'Credenciales incorrectas.', true); }
    } catch { notify('Error de conexión.', true); }
    setLoading(false);
  };

  if (user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <img src="/Logo.png" alt="Arenas Sport" className="login-logo-img" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              HOLA, {user.name.toUpperCase()}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</div>
          </div>
          <button className="login-btn" onClick={() => { onLogout(); navigate('/'); }}>
            CERRAR SESIÓN
          </button>
          <Link to="/" className="login-back"><ArrowLeft size={16} /> Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 420 }}>
        <div className="login-brand">
          <img src="/Logo.png" alt="Arenas Sport" className="login-logo-img" />
          <div className="login-badge">MI CUENTA</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setStatus(''); }}
              style={{
                flex: 1, padding: '0.7rem', background: 'transparent', border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent-red)' : '2px solid transparent',
                color: tab === t ? 'var(--white)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {t === 'login' ? 'INGRESAR' : 'REGISTRARSE'}
            </button>
          ))}
        </div>

        {status && (
          <div className="login-error" style={{ borderColor: isError ? '' : 'var(--accent-blue)', color: isError ? '' : '#6ec6f5', marginBottom: '1rem' }}>
            {status}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">CORREO ELECTRÓNICO</label>
              <input type="email" className="form-input" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@correo.com" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">CONTRASEÑA</label>
              <input type="password" className="form-input" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label className="form-label">NOMBRE COMPLETO</label>
              <input type="text" className="form-input" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">CORREO ELECTRÓNICO</label>
              <input type="email" className="form-input" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@correo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">CONTRASEÑA</label>
              <input type="password" className="form-input" required minLength={6} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mín. 6 caracteres" />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
            </button>
          </form>
        )}

        <Link to="/" className="login-back"><ArrowLeft size={16} /> Volver a la tienda</Link>
      </div>
    </div>
  );
}
