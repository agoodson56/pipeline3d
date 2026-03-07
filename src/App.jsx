import { useState, useEffect, useCallback } from 'react';
import './index.css';
import * as api from './api.js';
import Dashboard from './views/Dashboard.jsx';
import Pipeline from './views/Pipeline.jsx';
import Contacts from './views/Contacts.jsx';
import Companies from './views/Companies.jsx';
import Activities from './views/Activities.jsx';
import CalendarView from './views/CalendarView.jsx';
import Forecast from './views/Forecast.jsx';
import EmailTracking from './views/EmailTracking.jsx';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'pipeline', icon: '🔀', label: 'Pipeline' },
  { key: 'contacts', icon: '👥', label: 'Contacts' },
  { key: 'companies', icon: '🏢', label: 'Companies' },
  { key: 'activities', icon: '✅', label: 'Activities' },
  { key: 'calendar', icon: '📅', label: 'Calendar' },
  { key: 'forecast', icon: '📈', label: 'Forecast' },
  { key: 'emails', icon: '📧', label: 'Email Tracking' },
];

function App() {
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Data state
  const [pipelines, setPipelines] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [emails, setEmails] = useState([]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // Load all data on mount
  useEffect(() => {
    async function load() {
      try {
        const [p, d, c, co, a, e] = await Promise.all([
          api.getPipelines(), api.getDeals(), api.getContacts(),
          api.getCompanies(), api.getActivities(), api.getEmails(),
        ]);
        setPipelines(p); setDeals(d); setContacts(c);
        setCompanies(co); setActivities(a); setEmails(e);
      } catch (err) {
        toast('Failed to load data: ' + err.message, 'error');
      }
      setLoading(false);
    }
    load();
  }, [toast]);

  const navigate = (v) => { setView(v); setSidebarOpen(false); };

  const refreshDeals = async () => { try { setDeals(await api.getDeals()); } catch { } };
  const refreshContacts = async () => { try { setContacts(await api.getContacts()); } catch { } };
  const refreshCompanies = async () => { try { setCompanies(await api.getCompanies()); } catch { } };
  const refreshActivities = async () => { try { setActivities(await api.getActivities()); } catch { } };
  const refreshEmails = async () => { try { setEmails(await api.getEmails()); } catch { } };
  const refreshPipelines = async () => { try { setPipelines(await api.getPipelines()); } catch { } };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const viewProps = {
    deals, contacts, companies, activities, emails, pipelines, toast,
    refreshDeals, refreshContacts, refreshCompanies, refreshActivities, refreshEmails, refreshPipelines
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard {...viewProps} />;
      case 'pipeline': return <Pipeline {...viewProps} />;
      case 'contacts': return <Contacts {...viewProps} />;
      case 'companies': return <Companies {...viewProps} />;
      case 'activities': return <Activities {...viewProps} />;
      case 'calendar': return <CalendarView {...viewProps} />;
      case 'forecast': return <Forecast {...viewProps} />;
      case 'emails': return <EmailTracking {...viewProps} />;
      default: return <Dashboard {...viewProps} />;
    }
  };

  const currentNav = NAV.find(n => n.key === view) || NAV[0];

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="mobile-overlay show" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Pipeline3D" style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 8 }} />
          <h1>Pipeline3D</h1>
          <span>Sales CRM</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {NAV.slice(0, 5).map(n => (
            <div key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
              {n.key === 'activities' && activities.filter(a => !a.done).length > 0 && (
                <span className="nav-badge">{activities.filter(a => !a.done).length}</span>
              )}
            </div>
          ))}
          <div className="nav-section-label">Insights</div>
          {NAV.slice(5).map(n => (
            <div key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h2>{currentNav.icon} {currentNav.label}</h2>
          </div>
          <div className="top-bar-actions">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search…" />
            </div>
          </div>
        </header>
        <div className="page-content">
          {renderView()}
        </div>
      </main>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
