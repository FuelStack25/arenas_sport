import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'arenas2024';
const ADMIN_TOKEN = `arenas_sport_${Buffer.from(ADMIN_PASSWORD + '_secure').toString('base64')}`;

app.use(cors());
app.use(express.json());

const dbDir = join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(join(dbDir, 'store.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      total_price REAL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)");
      stmt.run("Nike Air Max", "Zapatillas deportivas para correr con amortiguación de aire. Ideal para entrenamientos de alto impacto.", 120.50, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400");
      stmt.run("Adidas Ultraboost", "Comodidad y retorno de energía en cada paso. La elección del corredor de élite.", 150.00, "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400");
      stmt.run("Puma RS-X", "Estilo retro con tecnología moderna para el día a día. Diseño único que no pasa desapercibido.", 110.00, "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400");
      stmt.finalize();
    }
  });
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, description, price, image } = req.body;
  db.run(
    "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
    [name, description, price, image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, description, price, image });
    }
  );
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { name, description, price, image } = req.body;
  db.run(
    "UPDATE products SET name=?, description=?, price=?, image=? WHERE id=?",
    [name, description, price, image, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/sales', (req, res) => {
  const query = `
    SELECT sales.*, products.name as product_name
    FROM sales
    JOIN products ON sales.product_id = products.id
    ORDER BY sales.sale_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/stats', (_req, res) => {
  db.get("SELECT SUM(total_price) as total_revenue, COUNT(*) as total_sales FROM sales", (_err, salesRow) => {
    db.get("SELECT COUNT(*) as total_products FROM products", (_err2, productsRow) => {
      res.json({
        totalRevenue: salesRow?.total_revenue || 0,
        totalSales: salesRow?.total_sales || 0,
        totalProducts: productsRow?.total_products || 0
      });
    });
  });
});

const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
