import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, PlusCircle, ArrowLeft } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, totalProducts: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div>
      <h2 style={{ color: 'var(--navy)', marginBottom: '2rem' }}>Resumen de Tienda</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontWeight: '600' }}>Ventas Totales</div>
          <div className="stat-value">${Number(stats.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontWeight: '600' }}>Zapatos Vendidos</div>
          <div className="stat-value">{stats.totalSales}</div>
        </div>
        <div className="stat-card">
          <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontWeight: '600' }}>Productos en Catálogo</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ color: 'var(--navy)', marginBottom: '1.5rem' }}>Últimas Ventas</h3>
        <p style={{ color: '#6c757d' }}>No hay ventas recientes para mostrar.</p>
        {/* Aquí iría una tabla con las ventas cuando haya datos */}
      </div>
    </div>
  );
}

function AddProduct() {
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Subiendo...');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus('¡Producto agregado con éxito!');
        setFormData({ name: '', description: '', price: '', image: '' });
      } else {
        setStatus('Error al guardar el producto.');
      }
    } catch (err) {
      setStatus('Error de red.');
    }
  };

  return (
    <div className="admin-card" style={{ maxWidth: '600px' }}>
      <h2 style={{ color: 'var(--navy)', marginBottom: '2rem' }}>Agregar Nuevo Zapato</h2>
      {status && <div style={{ marginBottom: '1rem', padding: '1rem', background: '#e3f2fd', color: '#0c5460', borderRadius: '8px' }}>{status}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre del modelo</label>
          <input 
            type="text" 
            className="form-control" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea 
            className="form-control" 
            rows="3" 
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>
        <div className="form-group">
          <label>Precio ($)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            required
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>URL de la imagen (opcional)</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="https://ejemplo.com/zapato.jpg"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Guardar Producto</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const location = useLocation();
  
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo" style={{ marginBottom: '3rem' }}>
          Panel Admin
        </div>
        <ul className="admin-menu">
          <li>
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/admin/add" className={location.pathname === '/admin/add' ? 'active' : ''}>
              <PlusCircle size={20} /> Subir Zapatos
            </Link>
          </li>
        </ul>
        
        <div style={{ padding: '2rem', marginTop: 'auto', position: 'absolute', bottom: 0 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Volver a la tienda
          </Link>
        </div>
      </aside>
      
      <main className="admin-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddProduct />} />
        </Routes>
      </main>
    </div>
  );
}
