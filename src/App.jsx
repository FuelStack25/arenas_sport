import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <nav className="navbar">
              <div className="container">
                <Link to="/" className="logo">
                  ARENAS<span>SPORT</span>
                </Link>
                <div className="nav-links">
                  <Link to="/">Catálogo</Link>
                  <Link to="/admin" style={{ color: 'var(--volt)' }}>[ Admin ]</Link>
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
