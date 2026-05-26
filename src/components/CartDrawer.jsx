import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

const WHATSAPP_NUMBER = '5491100000000';
const fmt = (n) => Number(n).toLocaleString('es-AR');

export default function CartDrawer({ items, total, count, onRemove, onUpdate, onClear, onClose }) {
  const handleCheckout = () => {
    if (items.length === 0) return;
    const lines = items.map(i => `• ${i.name} x${i.qty} — $${fmt(i.price * i.qty)}`).join('\n');
    const msg = encodeURIComponent(
      `Hola! Quiero hacer un pedido:\n\n${lines}\n\n*Total: $${fmt(total)}*\n\n¿Están disponibles?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={18} />
            <span>TU CARRITO</span>
            {count > 0 && <span className="cart-count-badge">{count}</span>}
          </div>
          <button className="cart-close" onClick={onClose}><X size={18} /></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Tu carrito está vacío</p>
            <span>Agregá productos desde el catálogo</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.image && <img src={item.image} alt={item.name} />}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">${fmt(item.price)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty">
                      <button onClick={() => onUpdate(item.id, item.qty - 1)}><Minus size={11} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => onUpdate(item.id, item.qty + 1)}><Plus size={11} /></button>
                    </div>
                    <div className="cart-item-subtotal">${fmt(item.price * item.qty)}</div>
                    <button className="cart-remove" onClick={() => onRemove(item.id)}><Trash2 size={13} /></button>
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
