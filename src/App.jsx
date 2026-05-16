import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Store } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <nav className="navbar">
              <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="logo">
                  {/* El logo se debe colocar en la carpeta public como logo.png */}
                  <img src="/logo.png" alt="Arenas Sport Logo" onError={(e) => { e.target.style.display = 'none'; }} />
                  Arenas Sport
                </Link>
                <div className="nav-links">
                  <Link to="/">Catálogo</Link>
                  <Link to="/admin" style={{ color: 'var(--red)' }}>Panel Admin</Link>
                </div>
              </div>
            </nav>
            <Home />
          </>
        } />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
