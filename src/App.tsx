import React, { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ProjectsPage from './pages/ProjectsPage';
import PartiesPage from './pages/PartiesPage';
import FlatsPage from './pages/FlatsPage';
import ReportsPage from './pages/ReportsPage';
import AIAssistantPage from './pages/AIAssistantPage';

import './styles/tailwind.css';
import { Menu, X } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Route = 'dashboard' | 'transactions' | 'projects' | 'parties' | 'flats' | 'reports';

export default function App() {
  const [route, setRoute] = useState<Route>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem('loggedIn') === 'true';
    setIsLoggedIn(status);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    window.location.reload(); // reloads app to show login page
  };

  const links = [
    { label: 'AI Assistant', route: 'aiassistant' },
    { label: 'Dashboard', route: 'dashboard' },
    { label: 'Transactions', route: 'transactions' },
    { label: 'Projects', route: 'projects' },
    { label: 'Parties', route: 'parties' },
    { label: 'Flats', route: 'flats' },
    { label: 'Reports', route: 'reports' },
  ];

  return !isLoggedIn ? (
    <LoginPage onLogin={() => setIsLoggedIn(true)} />
  ) : (
    <>
      <ToastContainer position="top-right" autoClose={20000} />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold">Accounting</h1>

            {/* Desktop nav */}
            <nav className="hidden md:flex space-x-3 text-sm text-slate-600">
              {links.map(l => (
                <button key={l.route} onClick={() => setRoute(l.route)} className="hover:underline">
                  {l.label}
                </button>
              ))}
              <button onClick={handleLogout}>Logout</button>
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          {/* Mobile dropdown */}
          {menuOpen && (
            <nav className="md:hidden flex flex-col bg-white shadow rounded-lg mb-4">
              {links.map(l => (
                <button
                  key={l.route}
                  onClick={() => {
                    setRoute(l.route);
                    setMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 hover:bg-gray-100"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          )}

          <main className="space-y-6 sm:scale-100 scale-90">
            {route === 'aiassistant' && <AIAssistantPage />}
            {route === 'dashboard' && <DashboardPage />}
            {route === 'transactions' && <TransactionsPage />}
            {route === 'projects' && <ProjectsPage />}
            {route === 'parties' && <PartiesPage />}
            {route === 'flats' && <FlatsPage />}
            {route === 'reports' && <ReportsPage />}
          </main>

          <footer className="text-xs text-slate-500 text-center mt-8">
            For use only by Ashok Choudhary. Unauthorized use is prohibited.
          </footer>
        </div>
      </div>
    </>
  );
}
