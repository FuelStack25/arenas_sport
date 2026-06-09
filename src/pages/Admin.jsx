import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ArrowLeft, TrendingUp,
  Package, DollarSign, LogOut, Trash2, Edit2, Eye, X,
  Users, ShieldPlus, Mail, User
} from 'lucide-react';

const TOKEN_KEY = 'arenas_admin_token';
const NAME_KEY  = 'arenas_admin_name';
const getToken  = () => localStorage.getItem(TOKEN_KEY);
const getName   = () => localStorage.getItem(NAME_KEY);

/* ─── LOGIN ─────────────────────────────────────────────── */
function LoginForm({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(NAME_KEY, data.name);
        onLogin(data.token);
      } else {
        setError(data.error || 'Credenciales incorrectas.');
      }
    } catch {
      setError('Error de conexión. Verificá que el servidor esté activo.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/Logo.png" alt="Arenas Sport" className="login-logo-img" />
          <div className="login-badge">PANEL ADMINISTRADOR</div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error"><span>{error}</span></div>}
          <div className="form-group">
            <label className="form-label">CORREO ELECTRÓNICO</label>
            <input type="email" className="form-input" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">CONTRASEÑA</label>
            <input type="password" className="form-input" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'VERIFICANDO...' : 'INGRESAR AL PANEL'}
          </button>
        </form>
        <Link to="/" className="login-back"><ArrowLeft size={16} /> Volver a la tienda</Link>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, totalProducts: 0, totalUsers: 0 });

  useEffect(() => {
    fetch('/api/stats', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">PANEL GENERAL</h2>
        <p className="admin-subtitle">Bienvenido, {getName()}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <DollarSign size={28} className="stat-icon" />
          <div className="stat-label">Ingresos Totales</div>
          <div className="stat-value">${Number(stats.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <TrendingUp size={28} className="stat-icon" />
          <div className="stat-label">Ventas Registradas</div>
          <div className="stat-value">{stats.totalSales}</div>
        </div>
        <div className="stat-card">
          <Package size={28} className="stat-icon" />
          <div className="stat-label">Zapatos en Catálogo</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <Users size={28} className="stat-icon" />
          <div className="stat-label">Cuentas Registradas</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title">ÚLTIMOS MOVIMIENTOS</h3>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
          El registro de ventas por WhatsApp se mostrará aquí cuando esté disponible.
        </p>
      </div>
    </div>
  );
}

/* ─── PRODUCT LIST ──────────────────────────────────────── */
function ProductList() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState({ name: '', description: '', price: '', image: '' });

  const load = () => {
    fetch('/api/products').then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const notify = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 3000); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-admin-token': getToken() } });
    if (res.ok) { notify('Producto eliminado.'); load(); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, description: p.description || '', price: p.price, image: p.image || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/products/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
      body: JSON.stringify(formData),
    });
    if (res.ok) { notify('¡Producto actualizado!'); setEditingId(null); load(); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">INVENTARIO</h2>
        <p className="admin-subtitle">GESTIÓN DE CATÁLOGO</p>
      </div>
      {status && <div className="admin-status">{status}</div>}
      {loading ? <div className="admin-loading">CARGANDO...</div> : products.length === 0 ? (
        <div className="admin-loading">No hay productos. <Link to="/admin/add" style={{ color: 'var(--accent-red)' }}>Agregar uno →</Link></div>
      ) : (
        <div className="product-list">
          {products.map(product => (
            <div key={product.id} className="product-list-item">
              {editingId === product.id ? (
                <form onSubmit={handleUpdate} className="edit-form">
                  <div className="edit-form-grid">
                    <div className="form-group">
                      <label className="form-label">NOMBRE</label>
                      <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PRECIO ($)</label>
                      <input className="form-input" type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">DESCRIPCIÓN</label>
                      <input className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">IMAGEN</label>
                      <ImageUpload value={formData.image} onChange={url => setFormData({ ...formData, image: url })} />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button type="submit" className="admin-btn-save">GUARDAR</button>
                    <button type="button" className="admin-btn-cancel" onClick={() => setEditingId(null)}><X size={16} /> CANCELAR</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="product-list-thumb"><img src={product.image} alt={product.name} /></div>
                  <div className="product-list-info">
                    <div className="product-list-name">{product.name}</div>
                    <div className="product-list-desc">{product.description}</div>
                    <div className="product-list-price">${Number(product.price).toFixed(2)}</div>
                  </div>
                  <div className="product-list-actions">
                    <button className="action-btn edit" onClick={() => startEdit(product)} title="Editar"><Edit2 size={15} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(product.id, product.name)} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── IMAGE UPLOAD FIELD ────────────────────────────────── */
function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(value || '');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-token': getToken() }, body: fd });
      const data = await res.json();
      if (res.ok) { onChange(data.url); }
      else { alert(data.error || 'Error al subir imagen'); setPreview(value || ''); }
    } catch { alert('Error de red al subir imagen'); setPreview(value || ''); }
    setUploading(false);
  };

  return (
    <div className="img-upload-wrap">
      <label className="img-upload-label">
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
          onChange={handleFile} style={{ display: 'none' }} />
        <div className="img-upload-btn">
          {uploading ? 'SUBIENDO...' : preview ? 'CAMBIAR IMAGEN' : 'SELECCIONAR IMAGEN'}
        </div>
      </label>
      {preview && (
        <div className="img-upload-preview">
          <img src={preview} alt="Vista previa" />
        </div>
      )}
      {value && !preview.startsWith('blob:') && (
        <div className="img-upload-url">{value}</div>
      )}
    </div>
  );
}

/* ─── ADD PRODUCT ───────────────────────────────────────── */
function AddProduct() {
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image: '' });
  const [status, setStatus]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus('Subiendo...');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('¡PRODUCTO AGREGADO!');
        setFormData({ name: '', description: '', price: '', image: '' });
        setTimeout(() => setStatus(''), 3000);
      } else { setStatus('ERROR AL GUARDAR.'); }
    } catch { setStatus('ERROR DE RED.'); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">NUEVO ZAPATO</h2>
        <p className="admin-subtitle">AÑADIR AL CATÁLOGO PÚBLICO</p>
      </div>
      <div className="admin-card">
        {status && <div className="admin-status">{status}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del modelo</label>
            <input type="text" className="form-input" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nike Air Max 90" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows="3" required value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Características del calzado..." style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Precio ($)</label>
            <input type="number" step="0.01" className="form-input" required value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Imagen del producto</label>
            <ImageUpload value={formData.image} onChange={url => setFormData({ ...formData, image: url })} />
          </div>
          <button type="submit" className="admin-btn-save" style={{ marginTop: '1rem' }}>AÑADIR AL CATÁLOGO</button>
        </form>
      </div>
    </div>
  );
}

/* ─── USERS LIST ────────────────────────────────────────── */
function UsersList() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = () => {
    fetch('/api/admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.json()).then(d => { setUsers(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${email}?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'x-admin-token': getToken() } });
    const data = await res.json();
    if (res.ok) { setStatus('Cuenta eliminada.'); load(); }
    else setStatus(data.error || 'Error al eliminar.');
    setTimeout(() => setStatus(''), 3000);
  };

  const publicUsers = users.filter(u => u.role === 'user');
  const admins      = users.filter(u => u.role === 'admin');

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">CUENTAS REGISTRADAS</h2>
        <p className="admin-subtitle">{publicUsers.length} USUARIOS · {admins.length} ADMINISTRADORES</p>
      </div>
      {status && <div className="admin-status">{status}</div>}
      {loading ? <div className="admin-loading">CARGANDO...</div> : (
        <>
          {/* Usuarios públicos */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
              <User size={16} style={{ display: 'inline', marginRight: 8 }} />
              USUARIOS ({publicUsers.length})
            </h3>
            {publicUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no hay usuarios registrados.</p>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr><th>Nombre</th><th>Correo</th><th>Fecha</th><th></th></tr>
                  </thead>
                  <tbody>
                    {publicUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td><Mail size={12} style={{ marginRight: 6, opacity: 0.5 }} />{u.email}</td>
                        <td>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                        <td>
                          <button className="action-btn delete" onClick={() => handleDelete(u.id, u.email)} title="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Administradores */}
          <div className="admin-card">
            <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
              <ShieldPlus size={16} style={{ display: 'inline', marginRight: 8 }} />
              ADMINISTRADORES ({admins.length})
            </h3>
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Creado</th><th></th></tr>
                </thead>
                <tbody>
                  {admins.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td><Mail size={12} style={{ marginRight: 6, opacity: 0.5 }} />{u.email}</td>
                      <td>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                      <td>
                        {u.email !== 'stebanptol@gmail.com' && (
                          <button className="action-btn delete" onClick={() => handleDelete(u.id, u.email)} title="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── ADD ADMIN ─────────────────────────────────────────── */
function AddAdmin() {
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus('Creando...');
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setStatus(`✓ Administrador "${data.name}" creado correctamente.`);
        setForm({ name: '', email: '', password: '' });
      } else {
        setIsError(true);
        setStatus(data.error || 'Error al crear administrador.');
      }
    } catch { setIsError(true); setStatus('Error de red.'); }
    setTimeout(() => setStatus(''), 4000);
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">NUEVO ADMINISTRADOR</h2>
        <p className="admin-subtitle">AGREGAR ACCESO AL PANEL</p>
      </div>
      <div className="admin-card" style={{ maxWidth: 520 }}>
        {status && (
          <div className="admin-status" style={{ borderColor: isError ? 'var(--accent-red)' : undefined }}>
            {status}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input type="text" className="form-input" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input type="email" className="form-input" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@ejemplo.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña de acceso</label>
            <input type="password" className="form-input" required minLength={6} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mín. 6 caracteres" />
          </div>
          <button type="submit" className="admin-btn-save" style={{ marginTop: '0.5rem' }}>
            CREAR ADMINISTRADOR
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── SHELL ─────────────────────────────────────────────── */
export default function Admin() {
  const location = useLocation();
  const [token, setToken] = useState(getToken);

  const handleLogout = () => {
    fetch('/api/admin/logout', { method: 'POST', headers: { 'x-admin-token': getToken() } }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setToken(null);
  };

  if (!token) return <Navigate to="/" replace />;

  const navLink = (path, label, Icon) => (
    <li>
      <Link to={path} className={location.pathname === path ? 'active' : ''}>
        <Icon size={18} /> {label}
      </Link>
    </li>
  );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/Logo.png" alt="Arenas Sport" className="sidebar-logo-img" />
          <span className="admin-sidebar-tag">ADMIN</span>
        </div>
        <ul className="admin-menu">
          {navLink('/admin', 'Dashboard', LayoutDashboard)}
          {navLink('/admin/products', 'Inventario', Package)}
          {navLink('/admin/add', 'Nuevo Zapato', PlusCircle)}
          {navLink('/admin/users', 'Usuarios', Users)}
          {navLink('/admin/admins', 'Administradores', ShieldPlus)}
        </ul>
        <div className="admin-sidebar-footer">
          <Link to="/" className="sidebar-link"><Eye size={18} /> Ver Tienda</Link>
          <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/add"     element={<AddProduct />} />
          <Route path="/users"   element={<UsersList />} />
          <Route path="/admins"  element={<AddAdmin />} />
        </Routes>
      </main>
    </div>
  );
}
