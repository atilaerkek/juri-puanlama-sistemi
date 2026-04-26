import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';

// Supabase Bağlantısı
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const MainApp = () => {
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' 
    }}>
      <div style={{ 
        padding: '40px', backgroundColor: 'white', borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' 
      }}>
        <h1 style={{ color: '#1a365d' }}>Jüri Puanlama Sistemi</h1>
        <p style={{ color: '#4a5568' }}>Sistem başarıyla kuruldu.</p>
        <div style={{ marginTop: '20px' }}>
          <input type="password" placeholder="Jüri Şifresi" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
          <button style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Giriş Yap</button>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter basename="/juri-puanlama-sistemi">
    <Routes>
      <Route path="/" element={<MainApp />} />
    </Routes>
  </BrowserRouter>
);

export default App;
