import React, { useEffect, useState } from 'react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <header className="hero">
        <div className="container">
          <h1>Encuentra tu estilo ideal</h1>
          <p>La mejor selección de zapatillas deportivas para superar tus límites. Diseño, confort y calidad en cada paso.</p>
        </div>
      </header>

      <main className="container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>Cargando catálogo...</div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <img 
                  src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'} 
                  alt={product.name} 
                  className="product-image"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' }}
                />
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.9rem', minHeight: '40px' }}>
                    {product.description}
                  </p>
                  <div className="product-price">${Number(product.price).toFixed(2)}</div>
                  <button className="btn btn-navy" onClick={() => alert('¡Agregado al carrito!')}>
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
