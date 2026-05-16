import React, { useEffect, useState } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

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
        <div className="hero-bg-text">LIMITLESS</div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text-block">
              <h1>
                Supera tus<br/><span>límites.</span>
              </h1>
              <p className="hero-desc">
                La mejor selección de zapatillas deportivas diseñadas para el rendimiento, confort y estilo absoluto. Tu próximo récord empieza aquí, no dejes que nada te detenga.
              </p>
              <a href="#catalog" className="btn">
                Explorar Colección <ArrowRight size={20} />
              </a>
            </div>
            
            <div className="hero-visual">
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200" 
                alt="Featured Sneaker" 
                className="hero-shoe-img"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="marquee-container">
        <div className="marquee-content">
          <span>NUEVA COLECCIÓN DISPONIBLE</span>
          <span>&nbsp;•&nbsp;</span>
          <span>RENDIMIENTO MÁXIMO</span>
          <span>&nbsp;•&nbsp;</span>
          <span>DISEÑO BRUTALISTA</span>
          <span>&nbsp;•&nbsp;</span>
          <span>ZAPATILLAS DE ALTA GAMA</span>
          <span>&nbsp;•&nbsp;</span>
          <span>NUEVA COLECCIÓN DISPONIBLE</span>
          <span>&nbsp;•&nbsp;</span>
          <span>RENDIMIENTO MÁXIMO</span>
          <span>&nbsp;•&nbsp;</span>
          <span>DISEÑO BRUTALISTA</span>
          <span>&nbsp;•&nbsp;</span>
          <span>ZAPATILLAS DE ALTA GAMA</span>
          <span>&nbsp;•&nbsp;</span>
        </div>
      </div>

      <main className="catalog-section" id="catalog">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Últimos Modelos</h2>
            <div className="results-count">[{products.length} RESULTADOS]</div>
          </div>
          
          {loading ? (
            <div className="loader">CARGANDO_DATOS...</div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'} 
                      alt={product.name} 
                      className="product-image"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600' }}
                    />
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-footer">
                      <div className="product-price">${Number(product.price).toFixed(2)}</div>
                      <button className="btn-icon" onClick={() => alert('¡Agregado al carrito!')} title="Agregar al carrito">
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
