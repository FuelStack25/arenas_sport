import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

const WHATSAPP_NUMBER = '573137884893';

const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function ProductCard({ product, onAdd, index }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWhatsApp = () => {
    const sizeText = selectedSize ? ` Talle: *${selectedSize}*` : '';
    const message = encodeURIComponent(
      `Hola! Me interesa el modelo *${product.name}* — $${Number(product.price).toFixed(2)}.${sizeText} ¿Está disponible?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="product-card" style={{ '--card-i': index }}>
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-badge">NUEVO</div>
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-price">
          <span className="price-currency">$</span>
          {Number(product.price).toFixed(2)}
        </div>

        <div className="size-selector">
          <span className="size-label">
            TALLE{selectedSize ? `: ${selectedSize}` : ' — SELECCIONÁ'}
          </span>
          <div className="size-grid">
            {SIZES.map(size => (
              <button
                key={size}
                className={`size-btn${selectedSize === size ? ' active' : ''}`}
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="product-actions">
          <button className="btn-add-cart" onClick={handleAdd}>
            <ShoppingCart size={13} />
            {added ? 'AGREGADO ✓' : 'AGREGAR'}
          </button>
          <button className="btn-whatsapp" onClick={handleWhatsApp}>
            <WhatsAppIcon />
            WHATSAPP
          </button>
        </div>
      </div>
    </div>
  );
}

const Home = ({ onAdd }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-container">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-text">AS</div>

        {/* Decorative tactical coordinates */}
        <div className="hero-coordinates">
          <div>LAT 6.2442° N</div>
          <div>LON 75.5812° W</div>
          <div>ALT 1495 m</div>
          <div style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>ARENAS / SPORT</div>
          <div style={{ color: 'var(--text-dim)' }}>COL — 2025</div>
        </div>

        <div className="container">
          <h1 className="hero-title">
            DOMINA EL <span>TERRENO</span>
          </h1>
          <p className="hero-subtitle">EQUIPAMIENTO DE ALTO RENDIMIENTO PARA ATLETAS DE ÉLITE</p>
          <div className="hero-actions">
            <a href="#catalogo" className="btn-primary">
              VER COLECCIÓN
              <span className="btn-primary-arrow">→</span>
            </a>
            <div className="scroll-indicator">
              <div className="mouse"><div className="mouse-wheel"></div></div>
              <span>DESLIZÁ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE DOBLE ── */}
      <div className="marquee-wrap">
        <div className="marquee">
          <div className="marquee-content">
            <span>ARENAS SPORT</span><span className="sep">◆</span>
            <span>NUEVA COLECCIÓN</span><span className="sep">◆</span>
            <span>ENVÍOS A TODO EL PAÍS</span><span className="sep">◆</span>
            <span>RENDIMIENTO SIN LÍMITES</span><span className="sep">◆</span>
            <span>ARENAS SPORT</span><span className="sep">◆</span>
            <span>NUEVA COLECCIÓN</span><span className="sep">◆</span>
            <span>ENVÍOS A TODO EL PAÍS</span><span className="sep">◆</span>
            <span>RENDIMIENTO SIN LÍMITES</span><span className="sep">◆</span>
          </div>
        </div>
        <div className="marquee-2">
          <div className="marquee-content-2">
            <span>CALZADO DEPORTIVO DE ALTO RENDIMIENTO</span>
            <span>✦</span>
            <span>TALLAS 36 — 45</span>
            <span>✦</span>
            <span>PEDIDOS POR WHATSAPP</span>
            <span>✦</span>
            <span>MARCAS PREMIUM</span>
            <span>✦</span>
            <span>CALZADO DEPORTIVO DE ALTO RENDIMIENTO</span>
            <span>✦</span>
            <span>TALLAS 36 — 45</span>
            <span>✦</span>
            <span>PEDIDOS POR WHATSAPP</span>
            <span>✦</span>
            <span>MARCAS PREMIUM</span>
            <span>✦</span>
          </div>
        </div>
      </div>

      {/* ── CATÁLOGO ── */}
      <section className="catalog-section" id="catalogo">
        <div className="container">
          <div className="section-header">
            <div className="section-number">// 01 — EQUIPAMIENTO</div>
            <h2 className="section-title">COLECCIÓN <span>ACTUAL</span></h2>
            <span className="results-count">[{products.length.toString().padStart(2, '0')}] ARTÍCULOS</span>
          </div>

          {loading ? (
            <div className="loading">CARGANDO...</div>
          ) : products.length === 0 ? (
            <div className="loading">SIN PRODUCTOS DISPONIBLES AÚN</div>
          ) : (
            <div className="product-grid">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} onAdd={onAdd} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer" id="contacto">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/Logo.png" alt="Arenas Sport" className="footer-logo-img" />
              <p>Calzado deportivo de alto rendimiento.<br />Hacé tu pedido directamente por WhatsApp.</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp footer-wa-btn"
            >
              <WhatsAppIcon />
              CONTACTAR AHORA
            </a>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} ARENAS SPORT — TODOS LOS DERECHOS RESERVADOS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
