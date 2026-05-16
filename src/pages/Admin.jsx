import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ArrowLeft, TrendingUp,
  Package, DollarSign, LogOut, Trash2, Edit2, Eye, X
} from 'lucide-react';

const TOKEN_KEY = 'arenas_admin_token';
const getToken = () => sessionStorage.getItem(TOKEN_KEY);

/* ─── LOGIN ─────────────────────────────────────────────────────────────── */
function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        sessionStorage.setItem(TOKEN_KEY, token);
        onLogin(token);
      } else {
        setError('Contraseña incorrecta. Intentá de nuevo.');
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
          <div className="login-logo">ARENAS<span>SPORT</span></div>
          <div className="login-badge">PANEL ADMINISTRADOR</div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span>{error}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">CONTRASEÑA DE ACCESO</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'VERIFICANDO...' : 'INGRESAR AL PANEL'}
          </button>
        </form>

        <Link to="/" className="login-back">
          <ArrowLeft size={16} /> Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, totalProducts: 0 });

  useEffect(() => {
    fetch('/api/stats', { headers: { 'x-admin-token': getToken() } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">PANEL GENERAL</h2>
        <p className="admin-subtitle">MÉTRICAS DE RENDIMIENTO</p>
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

/* ─── PRODUCT LIST ───────────────────────────────────────────────────────── */
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image: '' });

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const notify = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': getToken() },
    });
    if (res.ok) { notify('Producto eliminado.'); loadProducts(); }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setFormData({ name: product.name, description: product.description || '', price: product.price, image: product.image || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/products/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
      body: JSON.stringify(formData),
    });
    if (res.ok) { notify('¡Producto actualizado!'); setEditingId(null); loadProducts(); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">INVENTARIO</h2>
        <p className="admin-subtitle">GESTIÓN DE CATÁLOGO</p>
      </div>

      {status && <div className="admin-status">{status}</div>}

      {loading ? (
        <div className="admin-loading">CARGANDO...</div>
      ) : products.length === 0 ? (
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
                      <label className="form-label">URL IMAGEN</label>
                      <input className="form-input" type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button type="submit" className="admin-btn-save">GUARDAR CAMBIOS</button>
                    <button type="button" className="admin-btn-cancel" onClick={() => setEditingId(null)}>
                      <X size={16} /> CANCELAR
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="product-list-thumb">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-list-info">
                    <div className="product-list-name">{product.name}</div>
                    <div className="product-list-desc">{product.description}</div>
                    <div className="product-list-price">${Number(product.price).toFixed(2)}</div>
                  </div>
                  <div className="product-list-actions">
                    <button className="action-btn edit" onClick={() => startEdit(product)} title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(product.id, product.name)} title="Eliminar">
                      <Trash2 size={15} />
                    </button>
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

/* ─── ADD PRODUCT ────────────────────────────────────────────────────────── */
function AddProduct() {
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Subiendo...');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('¡PRODUCTO AGREGADO CON ÉXITO!');
        setFormData({ name: '', description: '', price: '', image: '' });
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('ERROR AL GUARDAR EL PRODUCTO.');
      }
    } catch {
      setStatus('ERROR DE RED.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">NUEVO ZAPATO</h2>
        <p className="admin-subtitle">AÑADIR INVENTARIO AL CATÁLOGO PÚBLICO</p>
      </div>

      <div className="admin-card">
        {status && <div className="admin-status">{status}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del modelo</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Nike Air Max 90"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción del calzado</label>
            <textarea
              className="form-input"
              rows="4"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Características principales del calzado..."
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Precio Unitario ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL de la imagen</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://ejemplo.com/zapato.jpg"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>
          <button type="submit" className="admin-btn-save" style={{ marginTop: '1rem' }}>
            AÑADIR AL CATÁLOGO
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── ADMIN SHELL ────────────────────────────────────────────────────────── */
export default function Admin() {
  const location = useLocation();
  const [token, setToken] = useState(getToken);

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

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
          <span className="admin-sidebar-logo">ARENAS<em>SPORT</em></span>
          <span className="admin-sidebar-tag">ADMIN</span>
        </div>

        <ul className="admin-menu">
          {navLink('/admin', 'Dashboard', LayoutDashboard)}
          {navLink('/admin/products', 'Inventario', Package)}
          {navLink('/admin/add', 'Nuevo Zapato', PlusCircle)}
        </ul>

        <div className="admin-sidebar-footer">
          <Link to="/" className="sidebar-link">
            <Eye size={18} /> Ver Tienda
          </Link>
          <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/add" element={<AddProduct />} />
        </Routes>
      </main>
    </div>
  );
}
