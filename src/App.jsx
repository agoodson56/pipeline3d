import { useState, useEffect, useCallback, useMemo } from 'react';
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
import Reports from './views/Reports.jsx';

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'pipeline', icon: '🔀', label: 'Pipeline' },
  { key: 'contacts', icon: '👥', label: 'Contacts' },
  { key: 'companies', icon: '🏢', label: 'Companies' },
  { key: 'activities', icon: '✅', label: 'Activities' },
  { key: 'calendar', icon: '📅', label: 'Calendar' },
  { key: 'forecast', icon: '📈', label: 'Forecast' },
  { key: 'reports', icon: '📉', label: 'Reports' },
  { key: 'emails', icon: '📧', label: 'Email Tracking' },
];

function App() {
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');

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

  // Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
        setCmdQuery('');
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Command palette search results
  const cmdResults = useMemo(() => {
    if (!cmdQuery.trim()) return [];
    const q = cmdQuery.toLowerCase();
    const results = [];

    // Search deals
    deals.filter(d => d.title?.toLowerCase().includes(q) || d.company?.toLowerCase().includes(q))
      .slice(0, 4).forEach(d => results.push({ type: 'deal', icon: '💰', label: d.title, sub: d.company || d.stage, action: () => setView('pipeline') }));

    // Search contacts
    contacts.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .slice(0, 4).forEach(c => results.push({ type: 'contact', icon: '👤', label: c.name, sub: c.company || c.email, action: () => setView('contacts') }));

    // Search companies
    companies.filter(c => c.name?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => results.push({ type: 'company', icon: '🏢', label: c.name, sub: c.industry, action: () => setView('companies') }));

    // Search nav
    NAV.filter(n => n.label.toLowerCase().includes(q))
      .forEach(n => results.push({ type: 'nav', icon: n.icon, label: `Go to ${n.label}`, sub: '', action: () => setView(n.key) }));

    return results.slice(0, 10);
  }, [cmdQuery, deals, contacts, companies]);

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
      case 'reports': return <Reports {...viewProps} />;
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
            <button className="btn btn-ghost btn-sm" onClick={() => { setCmdOpen(true); setCmdQuery(''); }}>
              🔍 Search <kbd style={{ marginLeft: 6, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 11 }}>⌘K</kbd>
            </button>
          </div>
        </header>
        <div className="page-content">
          {renderView()}
        </div>
      </main>

      {/* ─── Command Palette ─── */}
      {cmdOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCmdOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
              <input
                autoFocus
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                placeholder="Search deals, contacts, companies, or navigate…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit' }}
              />
              <kbd style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 11, color: 'var(--text-muted)' }}>ESC</kbd>
            </div>
            {cmdResults.length > 0 && (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {cmdResults.map((r, i) => (
                  <div key={i}
                    onClick={() => { r.action(); setCmdOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</div>
                      {r.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.sub}</div>}
                    </div>
                    <span className="tag tag-accent" style={{ fontSize: 10, textTransform: 'capitalize' }}>{r.type}</span>
                  </div>
                ))}
              </div>
            )}
            {cmdQuery && cmdResults.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No results for "{cmdQuery}"</div>
            )}
            {!cmdQuery && (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
                Type to search across deals, contacts, companies, or navigate to any page.
              </div>
            )}
          </div>
        </div>
      )}

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
