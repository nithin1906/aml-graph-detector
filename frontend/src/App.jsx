import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import AboutUs from './pages/AboutUs';
import UploadStatement from './pages/UploadStatement';
import Header from './components/Header';
import { useState, useEffect } from 'react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = 'dark'; // Forced darkness

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <Router>
      <div className="flex h-screen w-screen text-white overflow-hidden" data-theme="dark" style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        {/* Mobile sidebar overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeSidebar}
          />
        )}

        <Navigation isOpen={sidebarOpen} onClose={closeSidebar} />

        <div className="flex-1 flex flex-col overflow-auto">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex-1 overflow-auto p-6" style={{
            backgroundColor: 'var(--bg-primary)'
          }}>
            <Routes>
              <Route path="/" element={<Dashboard onCloseSidebar={closeSidebar} />} />
              <Route path="/dashboard" element={<Dashboard onCloseSidebar={closeSidebar} />} />
              <Route path="/upload" element={<UploadStatement />} />
              <Route path="/about" element={<AboutUs />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
