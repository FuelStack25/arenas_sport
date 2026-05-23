import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbDir = join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const db = new sqlite3.Database(join(dbDir, 'store.db'));

// In-memory admin sessions: token -> { email, name }
const adminSessions = new Map();

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    total_price REAL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed products
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)');
      stmt.run('Nike Air Max', 'Zapatillas deportivas para correr con amortiguación de aire. Ideal para entrenamientos de alto impacto.', 120.50, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400');
      stmt.run('Adidas Ultraboost', 'Comodidad y retorno de energía en cada paso. La elección del corredor de élite.', 150.00, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400');
      stmt.run('Puma RS-X', 'Estilo retro con tecnología moderna para el día a día. Diseño único que no pasa desapercibido.', 110.00, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400');
      stmt.finalize();
    }
  });

  // Seed initial superadmin
  db.get('SELECT id FROM users WHERE email = ?', ['stebanptol@gmail.com'], (_err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync('123456', 10);
      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Steban', 'stebanptol@gmail.com', hash, 'admin']);
    }
  });
});

/* ── MIDDLEWARE ─────────────────────────────────────────── */
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  const session = adminSessions.get(token);
  if (!session) return res.status(403).json({ error: 'No autorizado' });
  req.adminEmail = session.email;
  req.adminName = session.name;
  next();
}

/* ── ADMIN AUTH ─────────────────────────────────────────── */
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  db.get("SELECT * FROM users WHERE email = ? AND role = 'admin'", [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, { email: user.email, name: user.name });
    res.json({ token, name: user.name, email: user.email });
  });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) adminSessions.delete(token);
  res.json({ ok: true });
});

/* ── PUBLIC AUTH ────────────────────────────────────────── */
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [name, email, hash], function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'El correo ya está registrado' });
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email });
      });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/role', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  db.get('SELECT role FROM users WHERE email = ?', [email], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ role: row.role });
  });
});

app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    res.json({ name: user.name, email: user.email, role: user.role });
  });
});

/* ── PRODUCTS ───────────────────────────────────────────── */
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, description, price, image } = req.body;
  db.run('INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)',
    [name, description, price, image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, description, price, image });
    });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { name, description, price, image } = req.body;
  db.run('UPDATE products SET name=?, description=?, price=?, image=? WHERE id=?',
    [name, description, price, image, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

/* ── ADMIN — USERS & ADMINS ─────────────────────────────── */
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/admins', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
      [name, email, hash], function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'El correo ya está registrado' });
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email, role: 'admin' });
      });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.get('SELECT email FROM users WHERE id = ?', [req.params.id], (_err, row) => {
    if (row?.email === req.adminEmail) return res.status(400).json({ error: 'No podés eliminar tu propia cuenta' });
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

/* ── STATS ──────────────────────────────────────────────── */
app.get('/api/stats', requireAdmin, (_req, res) => {
  db.get('SELECT SUM(total_price) as total_revenue, COUNT(*) as total_sales FROM sales', (_e, salesRow) => {
    db.get('SELECT COUNT(*) as total_products FROM products', (_e2, productsRow) => {
      db.get("SELECT COUNT(*) as total_users FROM users WHERE role = 'user'", (_e3, usersRow) => {
        res.json({
          totalRevenue: salesRow?.total_revenue || 0,
          totalSales: salesRow?.total_sales || 0,
          totalProducts: productsRow?.total_products || 0,
          totalUsers: usersRow?.total_users || 0,
        });
      });
    });
  });
});

app.get('/api/sales', requireAdmin, (_req, res) => {
  const query = `SELECT sales.*, products.name as product_name FROM sales
    JOIN products ON sales.product_id = products.id ORDER BY sales.sale_date DESC`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ── STATIC ─────────────────────────────────────────────── */
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => console.log(`Arenas Sport API on port ${PORT}`));
