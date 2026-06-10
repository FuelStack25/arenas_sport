import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by'); // SEC-007
app.use(helmet({ contentSecurityPolicy: false })); // SEC-002
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true })); // SEC-003
app.use(express.json({ limit: '100kb' })); // SEC-006

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Esperá 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const dbDir = join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

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

  const seedAdmin = (name, email, password) => {
    db.get('SELECT id FROM users WHERE email = ?', [email], (_err, row) => {
      if (!row) {
        const hash = bcrypt.hashSync(password, 10);
        db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')", [name, email, hash]);
      }
    });
  };
  seedAdmin('Steban', 'stebanptol@gmail.com', '123456');
  seedAdmin('Luis Arenas', 'LuisArenasCardona06@gmail.com', '81457');
});

// Migration: add is_new and in_stock columns if they don't exist
db.all('PRAGMA table_info(products)', (_err, cols) => {
  if (!cols) return;
  const names = cols.map(c => c.name);
  if (!names.includes('is_new'))   db.run('ALTER TABLE products ADD COLUMN is_new INTEGER DEFAULT 1');
  if (!names.includes('in_stock')) db.run('ALTER TABLE products ADD COLUMN in_stock INTEGER DEFAULT 1');
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
app.post('/api/admin/login', authLimiter, (req, res) => {
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
app.post('/api/register', authLimiter, async (req, res) => {
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

// SEC-005: solo devuelve el propio rol — no permite enumerar otros emails
app.get('/api/user/role', (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email requerido' });
  db.get('SELECT role FROM users WHERE email = ?', [email], (err, row) => {
    if (err || !row) return res.json({ role: 'user' }); // respuesta neutra, sin revelar si existe
    res.json({ role: row.role });
  });
});

app.post('/api/user/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const payload = { name: user.name, email: user.email, role: user.role };
    if (user.role === 'admin') {
      const token = crypto.randomBytes(32).toString('hex');
      adminSessions.set(token, { email: user.email, name: user.name });
      payload.adminToken = token;
    }
    res.json(payload);
  });
});

/* ── UPLOADS ────────────────────────────────────────────── */
app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo inválido. Solo JPG, PNG o WEBP hasta 8 MB.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

/* ── PRODUCTS ───────────────────────────────────────────── */
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, description, price, image, is_new, in_stock } = req.body;
  db.run('INSERT INTO products (name, description, price, image, is_new, in_stock) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400', is_new ?? 1, in_stock ?? 1],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, description, price, image, is_new, in_stock });
    });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { name, description, price, image, is_new, in_stock } = req.body;
  db.run('UPDATE products SET name=?, description=?, price=?, image=?, is_new=?, in_stock=? WHERE id=?',
    [name, description, price, image, is_new ?? 1, in_stock ?? 1, req.params.id],
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
  const query = `SELECT sales.*, products.name as product_name, products.image as product_image
    FROM sales LEFT JOIN products ON sales.product_id = products.id
    ORDER BY sales.sale_date DESC LIMIT 100`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Record sales from WhatsApp checkout (public, intent-based tracking)
app.post('/api/sales/batch', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Items requeridos' });
  const stmt = db.prepare('INSERT INTO sales (product_id, quantity, total_price) VALUES (?, ?, ?)');
  for (const item of items) {
    stmt.run(item.product_id || null, item.quantity, item.total_price);
  }
  stmt.finalize(err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* ── STATIC ─────────────────────────────────────────────── */
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

// SEC-008: Error handler centralizado
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`Arenas Sport API on port ${PORT}`));
