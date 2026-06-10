import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, CheckCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '573137884893';
const fmt = (n) => Number(n).toLocaleString('es-AR');

export default function CartDrawer({ items, total, count, onRemove, onUpdate, onClear, onClose }) {
  const [done, setDone] = useState(false);

  const handleCheckout = async () => {
    if (!items.length) return;

    // Record sales intent (non-blocking, best-effort)
    try {
      await fetch('/api/sales/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            product_id: i.id,
            quantity: i.qty,
            total_price: i.price * i.qty,
          })),
        }),
      });
    } catch { /* ignore — no interrumpir el checkout */ }

    // Abrir WhatsApp
    const lines = items.map(i => `• ${i.name} x${i.qty} — $${fmt(i.price * i.qty)}`).join('\n');
    const msg = encodeURIComponent(
      `Hola! Quiero hacer un pedido:\n\n${lines}\n\n*Total: $${fmt(total)}*\n\n¿Están disponibles?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');

    // Mostrar pantalla de éxito y limpiar
    setDone(true);
    setTimeout(() => {
      onClear();
      onClose();
      setDone(false);
    }, 3000);
  };

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={16} />
            <span>TU CARRITO</span>
            {count > 0 && !done && <span className="cart-count-badge">{count}</span>}
          </div>
          <button className="cart-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        {done ? (
          /* ── Pantalla de éxito ── */
          <div className="cart-success">
            <div className="cart-success-icon">
              <CheckCircle size={32} />
            </div>
            <h3>¡PEDIDO ENVIADO!</h3>
            <p>Tu pedido fue enviado por WhatsApp.<br />Te responderemos a la brevedad.</p>
            <span className="cart-success-timer">Cerrando automáticamente...</span>
          </div>
        ) : items.length === 0 ? (
          /* ── Carrito vacío ── */
          <div className="cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Tu carrito está vacío</p>
            <span>Agregá productos desde el catálogo</span>
          </div>
        ) : (
          /* ── Items + footer ── */
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">${fmt(item.price)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty">
                      <button onClick={() => onUpdate(item.id, item.qty - 1)} aria-label="Menos"><Minus size={11} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => onUpdate(item.id, item.qty + 1)} aria-label="Más"><Plus size={11} /></button>
                    </div>
                    <div className="cart-item-subtotal">${fmt(item.price * item.qty)}</div>
                    <button className="cart-remove" onClick={() => onRemove(item.id)} aria-label="Eliminar"><Trash2 size={13} /></button>
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
