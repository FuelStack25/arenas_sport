import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ArrowLeft, TrendingUp, Package, DollarSign } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, totalProducts: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">PANEL GENERAL</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>[ MÉTRICAS DE RENDIMIENTO ]</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="stat-card" style={{ background: 'var(--surface)', padding: '2rem', border: '1px solid var(--border-color)', position: 'relative' }}>
          <DollarSign size={32} color="var(--volt)" style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.5 }} />
          <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Ingresos Totales</div>
          <div className="stat-value" style={{ fontFamily: 'Teko, sans-serif', fontSize: '4rem', color: 'var(--text-main)' }}>${Number(stats.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--surface)', padding: '2rem', border: '1px solid var(--border-color)', position: 'relative' }}>
          <TrendingUp size={32} color="var(--volt)" style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.5 }} />
          <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Ventas Registradas</div>
          <div className="stat-value" style={{ fontFamily: 'Teko, sans-serif', fontSize: '4rem', color: 'var(--text-main)' }}>{stats.totalSales}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--surface)', padding: '2rem', border: '1px solid var(--border-color)', position: 'relative' }}>
          <Package size={32} color="var(--volt)" style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.5 }} />
          <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Zapatos en Catálogo</div>
          <div className="stat-value" style={{ fontFamily: 'Teko, sans-serif', fontSize: '4rem', color: 'var(--text-main)' }}>{stats.totalProducts}</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ fontFamily: 'Teko, sans-serif', fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Últimos Movimientos</h3>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>EL REGISTRO DE VENTAS SE MOSTRARÁ AQUÍ PRONTO.</p>
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
        setStatus('¡PRODUCTO AGREGADO CON ÉXITO!');
        setFormData({ name: '', description: '', price: '', image: '' });
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('ERROR AL GUARDAR EL PRODUCTO.');
      }
    } catch (err) {
      setStatus('ERROR DE RED.');
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '3rem' }}>
        <h2 className="admin-title">NUEVO ZAPATO</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>[ AÑADE NUEVO INVENTARIO AL CATÁLOGO PÚBLICO ]</p>
      </div>

      <div className="admin-card">
        {status && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--volt)', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {status}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre del modelo</label>
            <input 
              type="text" 
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '1.1rem' }} 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Zapatilla Nitro V1"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descripción del calzado</label>
            <textarea 
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '1.1rem' }} 
              rows="4" 
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Escribe las características principales..."
            ></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Precio Unitario ($)</label>
            <input 
              type="number" 
              step="0.01" 
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '1.1rem' }} 
              required
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>URL de la imagen (Opcional)</label>
            <input 
              type="url" 
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '1.1rem' }} 
              placeholder="https://ejemplo.com/zapato.jpg"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
          </div>
          <button type="submit" className="admin-btn-save">{editingId ? 'GUARDAR CAMBIOS' : 'AÑADIR PRODUCTO'}</button>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const location = useLocation();
  
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">
          ADMIN
        </div>
        <ul className="admin-menu">
          <li>
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
              <LayoutDashboard size={20} /> Métricas
            </Link>
          </li>
          <li>
            <Link to="/admin/add" className={location.pathname === '/admin/add' ? 'active' : ''}>
              <PlusCircle size={20} /> Inventario
            </Link>
          </li>
        </ul>
        
        <div style={{ padding: '2rem', marginTop: 'auto' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ArrowLeft size={20} /> Salir a la Tienda
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
