import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Account from './pages/Account';
import CartDrawer from './components/CartDrawer';
import { useCart } from './hooks/useCart';

const USER_KEY = 'arenas_user';
const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};

function App() {
  const [user, setUser] = useState(loadUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const cart = useCart();

  useEffect(() => {
    if (!user?.email) { setIsAdmin(false); return; }
    fetch(`/api/user/role?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => setIsAdmin(d.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [user?.email]);

  const handleLogin = (data) => {
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <BrowserRouter>
      {showCart && (
        <CartDrawer
          items={cart.items} total={cart.total} count={cart.count}
          onRemove={cart.remove} onUpdate={cart.update}
          onClear={cart.clear} onClose={() => setShowCart(false)}
        />
      )}
      <Routes>
        <Route path="/" element={
          <>
            <nav className="navbar">
              <div className="container">
                <Link to="/" className="logo">
                  <img src="/Logo.png" alt="Arenas Sport" className="logo-img" />
                </Link>
                <div className="nav-links">
                  <a href="#catalogo">CATÁLOGO</a>
                  <a href="#contacto">CONTACTO</a>
                  {isAdmin && (
                    <Link to="/admin" className="nav-account" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
                      ADMIN
                    </Link>
                  )}
                  <Link to="/cuenta" className="nav-account">
                    {user ? user.name.split(' ')[0].toUpperCase() : 'MI CUENTA'}
                  </Link>
                  <button className="nav-cart-btn" onClick={() => setShowCart(true)} aria-label="Carrito">
                    <ShoppingCart size={18} />
                    {cart.count > 0 && <span className="nav-cart-badge">{cart.count}</span>}
                  </button>
                </div>
              </div>
            </nav>
            <Home onAdd={cart.add} onOpenCart={() => setShowCart(true)} />
          </>
        } />
        <Route path="/cuenta" element={<Account user={user} onLogin={handleLogin} onLogout={handleLogout} />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
