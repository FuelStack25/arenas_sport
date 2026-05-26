import { useState, useEffect } from 'react';

const CART_KEY = 'arenas_cart';

export function useCart() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing)
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }];
    });
  };

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const update = (id, qty) => {
    if (qty < 1) { remove(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, add, remove, update, clear, total, count };
}
