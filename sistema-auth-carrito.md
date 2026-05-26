# Sistema de Cuentas, Admin Panel y Carrito
### Guía de implementación para proyectos React + Express + SQLite

---

## Instrucciones para Claude

Este documento describe cómo implementar un sistema completo de autenticación de usuarios, panel de administración protegido y carrito de compras con checkout por WhatsApp. Está pensado para adaptarse a cualquier proyecto existente.

**Antes de empezar, leer el proyecto:**
1. Leer `src/index.css` para identificar las variables CSS existentes (colores, tipografías, bordes)
2. Leer `src/App.jsx` para entender la estructura de rutas
3. Leer el componente de página principal para entender cómo están los productos
4. Leer `server.js` o el backend principal para entender la estructura de la API
5. Adaptar **todos** los nombres de clases CSS y variables a los ya usados en el proyecto. No inventar nuevos si ya existen equivalentes.

---

## Stack requerido

- **Frontend:** React + React Router v6/v7
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (via `sqlite3`)
- **Dependencia nueva:** `bcryptjs` → `npm install bcryptjs`
- **Íconos:** `lucide-react` (ya instalado en la mayoría de proyectos React modernos)

---

## Parte 1 — Backend (`server.js`)

### 1.1 Imports y variables nuevas

Agregar al inicio del archivo, junto a los imports existentes:

```js
import bcrypt from 'bcryptjs';

// Email que tendrá acceso al panel admin automáticamente
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tu@email.com';

// Map en memoria para sesiones de usuario: token -> { userId, email, name, isAdmin }
const userSessions = new Map();
```

### 1.2 Tabla de usuarios en SQLite

Agregar dentro del bloque `db.serialize()`, junto a las tablas existentes:

```js
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### 1.3 Middleware y validaciones

```js
// Protege rutas de usuario (requiere token de sesión de usuario)
function requireUser(req, res, next) {
  const token = req.headers['x-user-token'];
  const session = token ? userSessions.get(token) : null;
  if (!session) return res.status(401).json({ error: 'No autenticado' });
  req.user = session;
  next();
}

// Contraseñas prohibidas y validación
const COMMON_PASSWORDS = new Set([
  '123456', '1234567', '12345678', '123456789',
  'password', 'qwerty', '111111', 'abc123', 'iloveyou', 'admin'
]);
const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+[\]{}|;':",.<>?/\\`~]/;

function validatePassword(pw) {
  if (COMMON_PASSWORDS.has(pw)) return 'Contraseña demasiado común.';
  if (pw.length < 8) return 'Mínimo 8 caracteres.';
  if (!SPECIAL_CHAR_RE.test(pw)) return 'Debe incluir al menos un carácter especial (!@#$%...).';
  return null;
}
```

### 1.4 Endpoints de usuario

Agregar estos endpoints. El rate limiter (`authLimiter`) debe ser el mismo que ya existe en el proyecto para el login de admin:

```js
// Registro
app.post('/api/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });

  const hash = await bcrypt.hash(password, 12);
  db.run(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name.trim(), email.toLowerCase().trim(), hash],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE'))
          return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
        return res.status(500).json({ error: 'Error al crear cuenta.' });
      }
      res.json({ ok: true });
    }
  );
});

// Login de usuario
app.post('/api/user/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos.' });

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], async (err, user) => {
    if (err || !user)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const token = crypto.randomBytes(32).toString('hex');
    const isAdmin = user.email === ADMIN_EMAIL;
    userSessions.set(token, { userId: user.id, email: user.email, name: user.name, isAdmin });

    const response = { token, name: user.name, email: user.email, isAdmin };
    // Si es admin, devuelve también el token del panel para auto-autenticarlo
    if (isAdmin) response.adminToken = ADMIN_TOKEN; // ADMIN_TOKEN debe existir en el proyecto
    res.json(response);
  });
});

// Datos del usuario actual
app.get('/api/user/me', requireUser, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, isAdmin: req.user.isAdmin });
});

// Logout
app.post('/api/user/logout', (req, res) => {
  const token = req.headers['x-user-token'];
  if (token) userSessions.delete(token);
  res.json({ ok: true });
});
```

### 1.5 Endpoint de usuarios para el panel admin

```js
// Lista de usuarios registrados (solo accesible con token admin)
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  db.all(
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});
```

### 1.6 Actualizar endpoint de stats (si existe)

Si el proyecto tiene un `/api/stats`, agregar el conteo de usuarios:

```js
// Dentro del callback anidado de stats existente, agregar:
db.get('SELECT COUNT(*) as users FROM users', (_e3, row3) => {
  res.json({
    // ...stats existentes...,
    totalUsers: row3?.users || 0
  });
});
```

### 1.7 Cambio en el admin login existente

El panel admin ya no debe mostrar un formulario en `/admin`. El token del admin se guarda en `localStorage`. Asegurarse de que la función `getToken` en el componente Admin lea de `localStorage`:

```js
// Cambiar de:
const getToken = () => sessionStorage.getItem(TOKEN_KEY);
// A:
const getToken = () => localStorage.getItem(TOKEN_KEY);
```

---

## Parte 2 — Frontend

### 2.1 Hook del carrito (`src/hooks/useCart.js`)

```js
import { useState, useEffect } from 'react';

const CART_KEY = 'app_cart'; // Cambiar prefijo al nombre del proyecto

export function useCart() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing)
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        // Agregar aquí campos extra según el modelo de producto del proyecto
        qty: 1,
      }];
    });
  };

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const update = (id, qty) => {
    if (qty < 1) { remove(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, add, remove, update, clear, total, count };
}
```

### 2.2 Utilidades de sesión de usuario (`src/components/AuthModal.jsx` — parte superior)

```js
const USER_TOKEN_KEY = 'app_user_token';   // Cambiar prefijo
const USER_DATA_KEY  = 'app_user';         // Cambiar prefijo
const ADMIN_TOKEN_KEY = 'app_admin_token'; // Debe coincidir con el TOKEN_KEY del componente Admin

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
```

### 2.3 Componente AuthModal completo (`src/components/AuthModal.jsx`)

**Nota para Claude:** Adaptar todos los nombres de clase CSS (`.auth-overlay`, `.auth-modal`, etc.) a los patrones de nomenclatura ya usados en el proyecto. Revisar si ya existe algún modal o formulario del que pueda reutilizar estilos base.

```jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

// [imports de utilidades de arriba]

const COMMON = new Set(['123456', '12345678', 'password', 'qwerty', '111111', 'abc123']);
const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{}|;':",.<>?/\\`~]/;

function validatePassword(pw) {
  if (COMMON.has(pw)) return 'Contraseña demasiado común.';
  if (pw.length < 8) return 'Mínimo 8 caracteres.';
  if (!SPECIAL_RE.test(pw)) return 'Debe incluir al menos un carácter especial (!@#$%...).';
  return null;
}

export default function AuthModal({ onClose, onAuth }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const switchTab = (t) => { setTab(t); setError(''); };

  const doLogin = async (email, password) => {
    const res = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return false; }

    localStorage.setItem(USER_TOKEN_KEY, data.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({
      name: data.name, email: data.email, isAdmin: data.isAdmin
    }));
    // Si es admin, guardar su token para auto-autenticar el panel
    if (data.adminToken) localStorage.setItem(ADMIN_TOKEN_KEY, data.adminToken);
    onAuth({ name: data.name, email: data.email, isAdmin: data.isAdmin });
    onClose();
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await doLogin(form.email, form.password); }
    catch { setError('Error de red.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const pwErr = validatePassword(form.password);
    if (pwErr) { setError(pwErr); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await doLogin(form.email, form.password);
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  };

  // IMPORTANTE: Reemplazar los nombres de clase por los del proyecto actual
  // Buscar en el CSS existente: clases de overlay/modal, formularios, botones primarios, mensajes de error
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}><X size={18} /></button>

        {/* Reemplazar con el nombre/logo del proyecto */}
        <div className="auth-brand">Nombre <span>Proyecto</span></div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
            Ingresar
          </button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
            Crear cuenta
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <p className="auth-switch">
              ¿No tenés cuenta?{' '}
              <button type="button" onClick={() => switchTab('register')}>Crear una gratis</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" type="text" value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="Tu nombre" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => set('password', e.target.value)} placeholder="Mín. 8 chars + un especial" required />
              <div className="auth-hint">Mínimo 8 caracteres e incluir al menos un símbolo (!@#$%...)</div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <p className="auth-switch">
              ¿Ya tenés cuenta?{' '}
              <button type="button" onClick={() => switchTab('login')}>Ingresar</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
```

### 2.4 Componente CartDrawer (`src/components/CartDrawer.jsx`)

**Nota para Claude:** El número de WhatsApp y el formato del mensaje deben ajustarse al negocio del proyecto. Adaptar también los campos del producto (`varietal`, `vintage`, etc.) a los campos reales del modelo de datos.

```jsx
import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

const WHATSAPP_NUMBER = 'XXXXXXXXXX'; // Reemplazar con el número real (sin + ni espacios)
const fmt = (n) => Number(n).toLocaleString('es-AR'); // Ajustar locale si aplica

export default function CartDrawer({ items, total, count, onRemove, onUpdate, onClear, onClose }) {
  const handleCheckout = () => {
    if (items.length === 0) return;
    // Personalizar el formato del mensaje según el negocio
    const lines = items.map(i => `• ${i.name} x${i.qty} — $${fmt(i.price * i.qty)}`).join('\n');
    const msg = encodeURIComponent(
      `Hola! Quiero hacer un pedido:\n\n${lines}\n\n*Total: $${fmt(total)}*\n\n¿Están disponibles?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={18} />
            <span>Tu carrito</span>
            {count > 0 && <span className="cart-count-badge">{count}</span>}
          </div>
          <button className="cart-close" onClick={onClose}><X size={18} /></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Tu carrito está vacío</p>
            <span>Agregá productos desde el catálogo</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.image && <img src={item.image} alt={item.name} />}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    {/* Adaptar campos extra según el modelo del proyecto */}
                    <div className="cart-item-price">${fmt(item.price)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty">
                      <button onClick={() => onUpdate(item.id, item.qty - 1)}><Minus size={11} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => onUpdate(item.id, item.qty + 1)}><Plus size={11} /></button>
                    </div>
                    <div className="cart-item-subtotal">${fmt(item.price * item.qty)}</div>
                    <button className="cart-remove" onClick={() => onRemove(item.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">Total estimado</span>
                <span className="cart-total-value">${fmt(total)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                Pedir por WhatsApp
              </button>
              <button className="cart-clear-btn" onClick={onClear}>Vaciar carrito</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

### 2.5 App.jsx — estructura con todo integrado

```jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import AuthModal, { getUser, getUserToken, clearUser } from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import { useCart } from './hooks/useCart';

// Adaptar el Navbar según el diseño existente del proyecto
function Navbar({ user, onOpenAuth, onLogout, cartCount, onOpenCart }) {
  return (
    <nav className="navbar"> {/* Usar la clase ya existente en el proyecto */}
      <div className="container">
        <Link to="/" className="nav-brand">Logo / Nombre</Link>
        <div className="nav-links">
          {/* Links existentes del proyecto */}

          {user ? (
            <>
              {user.isAdmin && <Link to="/admin" className="nav-admin-btn">Admin</Link>}
              <div className="nav-user">
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                <button className="nav-logout-btn" onClick={onLogout}>Salir</button>
              </div>
            </>
          ) : (
            <button className="nav-login-btn" onClick={onOpenAuth}>Ingresar</button>
          )}

          {/* Ícono carrito con badge */}
          <button className="nav-cart-btn" onClick={onOpenCart} aria-label="Carrito">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(getUser);
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const cart = useCart();

  const handleLogout = async () => {
    const token = getUserToken();
    if (token) fetch('/api/user/logout', { method: 'POST', headers: { 'x-user-token': token } }).catch(() => {});
    clearUser();
    setUser(null);
  };

  return (
    <BrowserRouter>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
      {showCart && (
        <CartDrawer
          items={cart.items} total={cart.total} count={cart.count}
          onRemove={cart.remove} onUpdate={cart.update}
          onClear={cart.clear} onClose={() => setShowCart(false)}
        />
      )}
      <Routes>
        <Route path="/" element={
          <>
            <Navbar
              user={user} onOpenAuth={() => setShowAuth(true)} onLogout={handleLogout}
              cartCount={cart.count} onOpenCart={() => setShowCart(true)}
            />
            {/* Pasar onAdd y onOpenCart a la página de productos */}
            <Home onAdd={cart.add} onOpenCart={() => setShowCart(true)} />
          </>
        } />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 2.6 Panel Admin — cambios necesarios

En el componente `Admin.jsx` existente hacer estos cambios:

```js
// 1. Cambiar import: agregar Navigate
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// 2. Agregar icono Users
import { /* iconos existentes */, Users } from 'lucide-react';

// 3. TOKEN_KEY debe coincidir con ADMIN_TOKEN_KEY del AuthModal
const TOKEN_KEY = 'app_admin_token'; // Mismo valor que ADMIN_TOKEN_KEY

// 4. Leer de localStorage en lugar de sessionStorage
const getToken = () => localStorage.getItem(TOKEN_KEY);

// 5. En el shell del Admin, reemplazar el LoginForm por redirect
// Cambiar:
if (!token) return <LoginForm onLogin={setToken} />;
// Por:
if (!token) return <Navigate to="/" replace />;

// 6. En handleLogout, usar localStorage
const handleLogout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); };

// 7. Agregar nueva ruta en el Router del Admin
<Route path="/users" element={<UsersList />} />

// 8. Agregar ítem en el sidebar
{navItem('/admin/users', 'Usuarios', Users)}
```

**Componente UsersList** (agregar dentro de Admin.jsx):

```jsx
function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (iso) => new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">Usuarios</h2>
        <p className="admin-sub">{users.length} cuenta{users.length !== 1 ? 's' : ''} registrada{users.length !== 1 ? 's' : ''}</p>
      </div>
      {loading ? <div className="admin-loading">Cargando...</div> : users.length === 0 ? (
        <div className="admin-loading">Aún no hay usuarios registrados.</div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Registrado</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{fmt(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## Parte 3 — CSS

**Instrucción crítica para Claude:** Antes de escribir cualquier estilo, identificar en el CSS existente:
- Variable de color primario / acento
- Variable de color de fondo
- Variable de color de superficie / card
- Variable de color de borde
- Variable de tipografía principal y monospace
- Clases existentes de botones (primary, ghost, etc.)
- Clases existentes de formularios (inputs, labels, form-group)

Luego escribir los nuevos estilos usando esas variables. Los bloques a estilizar son:

### Navbar (nuevos elementos)
- `.nav-login-btn` — botón "Ingresar", estilo ghost/outline con color acento
- `.nav-admin-btn` — botón "Admin", fondo color acento, texto invertido
- `.nav-user` — wrapper nombre + botón salir, flex row
- `.nav-user-name` — nombre en tipografía mono/pequeña, color secundario
- `.nav-logout-btn` — botón texto sin borde, color muted
- `.nav-cart-btn` — cuadrado pequeño con borde, ícono centrado
- `.nav-cart-badge` — círculo rojo absoluto sobre el ícono, número de items

### Modal de autenticación
- `.auth-overlay` — fixed, inset 0, fondo oscuro semitransparente, backdrop-blur, flex centrado, z-index alto
- `.auth-modal` — panel centrado max-width ~420px, fondo superficie, borde, padding
- `.auth-close` — botón X, posición absoluta arriba derecha
- `.auth-brand` — nombre/logo del proyecto, tipografía grande, centrado
- `.auth-tabs` — flex row, borde inferior, dos tabs
- `.auth-tab` — flex 1, sin fondo, borde inferior activo con color acento, font mono pequeño
- `.auth-tab.active` — color acento, borde inferior visible
- `.auth-form` — flex column, gap entre campos
- `.auth-error` — caja con fondo rojo tenue, borde rojo, texto error
- `.auth-hint` — texto pequeño gris debajo del input de contraseña
- `.auth-btn` — botón full-width, fondo color acento, texto invertido
- `.auth-switch` — texto pequeño centrado, link para cambiar de tab

### Carrito drawer
- `.cart-backdrop` — fixed, inset 0, fondo oscuro, z-index 900
- `.cart-drawer` — fixed, top/right/bottom 0, max-width ~420px, fondo superficie, borde izquierdo, flex column, z-index 901, animación slideRight
- `.cart-header` — flex space-between, borde inferior, padding
- `.cart-title` — flex row con ícono, texto mono small
- `.cart-count-badge` — pastilla pequeña con fondo acento/rojo
- `.cart-empty` — flex column centrado, ícono grande opaco, texto descriptivo
- `.cart-items` — flex 1, overflow-y auto, scroll estilizado
- `.cart-item` — flex row, gap, padding, borde inferior
- `.cart-item-img` — thumbnail cuadrado ~56x72px, object-fit cover
- `.cart-item-name` — tipografía serif o principal
- `.cart-item-price` — precio unitario, color acento
- `.cart-qty` — flex row con botones +/-, borde contenedor, número centrado
- `.cart-item-subtotal` — precio total del item
- `.cart-remove` — ícono trash, color muted, hover rojo
- `.cart-footer` — padding, borde superior, flex column
- `.cart-total-row` — flex space-between, label muted vs valor grande
- `.cart-checkout-btn` — full-width, fondo WhatsApp verde (#25D366), texto blanco
- `.cart-clear-btn` — texto pequeño muted, sin fondo, hover rojo suave

### Botón "Agregar al carrito" en cards de producto
- `.btn-add-cart` — inline-flex con ícono, outline con color acento, hover fondo tenue

### Toast de confirmación
- `.added-toast` — fixed bottom center, fondo superficie, borde acento, font mono, animación slideUp + fadeOut a los 2.5s

---

## Parte 4 — Crear la cuenta del dueño

Después de implementar todo, crear la cuenta del administrador directamente vía API:

```bash
curl -X POST https://tudominio.com/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"TuPassword@123"}'
```

O desde el servidor:

```bash
curl -s -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"TuPassword@123"}'
```

Verificar que devuelve `{"ok":true}` y probar login.

---

## Checklist de implementación

- [ ] `npm install bcryptjs`
- [ ] Tabla `users` creada en SQLite
- [ ] Endpoints `/api/register`, `/api/user/login`, `/api/user/me`, `/api/user/logout` funcionando
- [ ] Endpoint `/api/admin/users` protegido con token admin
- [ ] `src/hooks/useCart.js` creado
- [ ] `src/components/AuthModal.jsx` creado con utilidades de sesión exportadas
- [ ] `src/components/CartDrawer.jsx` creado con número de WhatsApp correcto
- [ ] `App.jsx` actualizado: carrito, auth modal, navbar con ícono carrito y botón admin
- [ ] `Admin.jsx` actualizado: lee token de localStorage, redirige a `/` si no hay token, sección Usuarios
- [ ] CSS adaptado a las variables del proyecto
- [ ] Build exitoso (`npm run build`)
- [ ] Cuenta del dueño creada vía API
- [ ] Verificado que login con email admin muestra botón "Admin" en navbar
- [ ] Verificado que `/admin` sin sesión redirige a inicio (no muestra formulario)
