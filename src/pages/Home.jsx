import React, { useState, useEffect } from 'react';

const Home = () => {
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
        console.error("Error loading products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-bg-text">ATHLETIC</div>
        <div className="container">
          <h1 className="hero-title">
            DOMINA EL <span>TERRENO</span>
          </h1>
          <p className="hero-subtitle">EQUIPAMIENTO DE ALTO RENDIMIENTO PARA ATLETAS DE ÉLITE</p>
          <div className="hero-actions">
            <button className="btn-primary">VER COLECCIÓN</button>
            <div className="scroll-indicator">
              <div className="mouse"></div>
              <span>DESLIZA</span>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-content">
          <span>ARENAS SPORT • NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • RENDIMIENTO SIN LÍMITES • ARENAS SPORT • NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • </span>
          <span>ARENAS SPORT • NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • RENDIMIENTO SIN LÍMITES • ARENAS SPORT • NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • </span>
        </div>
      </div>

      <section className="catalog-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">EQUIPAMIENTO <span>DESTACADO</span></h2>
            <span className="results-count">[{products.length}] ARTÍCULOS</span>
          </div>

          {loading ? (
            <div className="loading">CARGANDO PODER...</div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img src={product.image_url} alt={product.name} className="product-image" />
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <div className="product-price">${product.price}</div>
                    <button className="btn-add">AÑADIR AL CARRITO</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
