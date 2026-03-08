import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import * as api from './api.js';

// Lazy-load all views
const LoginScreen = lazy(() => import('./views/LoginScreen.jsx'));
const Dashboard = lazy(() => import('./views/Dashboard.jsx'));
const Pipeline = lazy(() => import('./views/Pipeline.jsx'));
const Contacts = lazy(() => import('./views/Contacts.jsx'));
const Companies = lazy(() => import('./views/Companies.jsx'));
const Activities = lazy(() => import('./views/Activities.jsx'));
const CalendarView = lazy(() => import('./views/CalendarView.jsx'));
const Forecast = lazy(() => import('./views/Forecast.jsx'));
const Reports = lazy(() => import('./views/Reports.jsx'));
const EmailTracking = lazy(() => import('./views/EmailTracking.jsx'));
const EmailComposer = lazy(() => import('./views/EmailComposer.jsx'));
const Automations = lazy(() => import('./views/Automations.jsx'));
const Integrations = lazy(() => import('./views/Integrations.jsx'));
const AICoach = lazy(() => import('./views/AICoach.jsx'));
const LeadCapture = lazy(() => import('./views/LeadCapture.jsx'));
const Settings = lazy(() => import('./views/Settings.jsx'));
const EmailSequences = lazy(() => import('./views/EmailSequences.jsx'));
const DataImport = lazy(() => import('./views/DataImport.jsx'));
const OnboardingTour = lazy(() => import('./views/OnboardingTour.jsx'));
const HelpCenter = lazy(() => import('./views/HelpCenter.jsx'));
const Prospector = lazy(() => import('./views/Prospector.jsx'));


const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', section: 'main' },
  { key: 'pipeline', icon: '🔀', label: 'Pipeline', section: 'main' },
  { key: 'contacts', icon: '👥', label: 'Contacts', section: 'main' },
  { key: 'companies', icon: '🏢', label: 'Companies', section: 'main' },
  { key: 'activities', icon: '✅', label: 'Activities', section: 'main' },
  { key: 'calendar', icon: '📅', label: 'Calendar', section: 'insights' },
  { key: 'forecast', icon: '📈', label: 'Forecast', section: 'insights' },
  { key: 'reports', icon: '📉', label: 'Reports', section: 'insights' },
  { key: 'emails', icon: '📧', label: 'Email', section: 'insights' },
  { key: 'ai', icon: '🧠', label: 'AI Coach', section: 'tools' },
  { key: 'automations', icon: '⚡', label: 'Automations', section: 'tools' },
  { key: 'sequences', icon: '📨', label: 'Sequences', section: 'tools' },
  { key: 'integrations', icon: '🔌', label: 'Integrations', section: 'tools' },
  { key: 'leads', icon: '🧲', label: 'Lead Capture', section: 'tools' },
  { key: 'prospector', icon: '🎯', label: 'Prospector', section: 'tools' },
  { key: 'import', icon: '📥', label: 'Data Import', section: 'tools' },
  { key: 'help', icon: '🛟', label: 'Help Center', section: 'tools' },
  { key: 'settings', icon: '⚙️', label: 'Settings', section: 'tools' },
];

const MOBILE_NAV = ['dashboard', 'pipeline', 'contacts', 'activities', 'ai'];

function App() {
  // ═══ AUTH STATE ═══
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showForceChangePw, setShowForceChangePw] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [changePwError, setChangePwError] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [welcomeBanner, setWelcomeBanner] = useState(null);

  const getGreeting = (name) => {
    const h = new Date().getHours();
    const timeGreet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (name || '').split(' ')[0] || 'there';
    return { timeGreet, firstName };
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const [pipelines, setPipelines] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [emails, setEmails] = useState([]);

  // PWA Install prompt
  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone);
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstall(true);
    }
  };

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // ═══ AUTH: Check session on mount ═══
  useEffect(() => {
    async function checkAuth() {
      const user = await api.verifySession();
      if (user) {
        setCurrentUser(user);
        if (user.mustChangePw) setShowForceChangePw(true);
        if (!localStorage.getItem('p3d_toured')) {
          setShowOnboarding(true);
        }
      }
      setAuthChecking(false);
    }
    checkAuth();

    // Listen for forced logout (401 responses)
    const logoutHandler = () => {
      setCurrentUser(null);
      setPipelines([]); setDeals([]); setContacts([]);
      setCompanies([]); setActivities([]); setEmails([]);
    };
    window.addEventListener('p3d-logout', logoutHandler);
    return () => window.removeEventListener('p3d-logout', logoutHandler);
  }, []);

  // ═══ AUTH: Login handler ═══
  const handleLogin = async (email, password) => {
    const result = await api.login(email, password);
    // If 2FA is required, return the challenge to LoginScreen
    if (result.requires2FA) return result;
    setCurrentUser(result.user);
    if (result.user.mustChangePw) setShowForceChangePw(true);
    loadAllData();
    if (!localStorage.getItem('p3d_toured')) {
      setShowOnboarding(true);
    }
    // Show welcome greeting
    const { timeGreet, firstName } = getGreeting(result.user.name);
    setWelcomeBanner({ timeGreet, firstName });
    setTimeout(() => setWelcomeBanner(null), 4000);
    // Request push notification permission
    requestNotificationPermission();
  };

  // ═══ AUTH: 2FA verification handler ═══
  const handleVerify2FA = async (challengeToken, code) => {
    const result = await api.verify2FALogin(challengeToken, code);
    setCurrentUser(result.user);
    if (result.user.mustChangePw) setShowForceChangePw(true);
    loadAllData();
    // Show welcome greeting after 2FA
    const { timeGreet, firstName } = getGreeting(result.user.name);
    setWelcomeBanner({ timeGreet, firstName });
    setTimeout(() => setWelcomeBanner(null), 4000);
    requestNotificationPermission();
  };

  // ═══ AUTH: Logout handler ═══
  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setShowUserMenu(false);
    setPipelines([]); setDeals([]); setContacts([]);
    setCompanies([]); setActivities([]); setEmails([]);
    setView('dashboard');
  };

  // ═══ DATA: Load all data ═══
  const loadAllData = useCallback(async () => {
    setLoading(true);
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
  }, [toast]);

  // Load data once authenticated
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // ═══ PUSH NOTIFICATIONS ═══
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        // Show a welcome notification
        new Notification('Pipeline3D', { body: 'Notifications enabled! You\'ll be alerted on deal updates.', icon: '/logo.png' });
      }
    }
  };

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); setCmdQuery(''); }
      if (e.key === 'Escape') { setCmdOpen(false); setShowUserMenu(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const cmdResults = useMemo(() => {
    if (!cmdQuery.trim()) return [];
    const q = cmdQuery.toLowerCase();
    const results = [];
    deals.filter(d => d.title?.toLowerCase().includes(q) || d.company?.toLowerCase().includes(q))
      .slice(0, 4).forEach(d => results.push({ type: 'deal', icon: '💰', label: d.title, sub: d.company || d.stage, action: () => setView('pipeline') }));
    contacts.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .slice(0, 4).forEach(c => results.push({ type: 'contact', icon: '👤', label: c.name, sub: c.company || c.email, action: () => setView('contacts') }));
    companies.filter(c => c.name?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => results.push({ type: 'company', icon: '🏢', label: c.name, sub: c.industry, action: () => setView('companies') }));
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

  // ═══ AUTH CHECK: Show loading screen while checking session ═══
  if (authChecking) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  // ═══ AUTH GATE: Show login if not authenticated ═══
  if (!currentUser) {
    return (
      <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
        <LoginScreen onLogin={handleLogin} onVerify2FA={handleVerify2FA} />
      </Suspense>
    );
  }

  // ═══ AUTHENTICATED: Main app ═══
  if (loading && deals.length === 0) return <div className="loading-screen"><div className="spinner" /></div>;

  const handleForceChangePw = async (e) => {
    e.preventDefault();
    setChangePwError('');
    if (changePwForm.newPw.length < 8) { setChangePwError('Password must be at least 8 characters'); return; }
    if (changePwForm.newPw !== changePwForm.confirm) { setChangePwError('Passwords do not match'); return; }
    setChangePwLoading(true);
    try {
      await api.changePassword(changePwForm.current, changePwForm.newPw);
      setShowForceChangePw(false);
      setCurrentUser(u => ({ ...u, mustChangePw: false }));
      setChangePwForm({ current: '', newPw: '', confirm: '' });
      toast('Password changed successfully!');
    } catch (err) {
      setChangePwError(err.message || 'Failed to change password');
    }
    setChangePwLoading(false);
  };

  const isAdmin = currentUser.role === 'admin';

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const viewProps = {
    deals, contacts, companies, activities, emails, pipelines, toast,
    refreshDeals, refreshContacts, refreshCompanies, refreshActivities, refreshEmails, refreshPipelines,
    currentUser, isAdmin,
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
      case 'ai': return <AICoach {...viewProps} />;
      case 'automations': return <Automations {...viewProps} />;
      case 'integrations': return <Integrations {...viewProps} />;
      case 'leads': return <LeadCapture {...viewProps} />;
      case 'sequences': return <EmailSequences {...viewProps} />;
      case 'import': return <DataImport {...viewProps} />;
      case 'help': return <HelpCenter {...viewProps} />;
      case 'prospector': return <Prospector {...viewProps} />;
      case 'settings': return <Settings {...viewProps} />;
      default: return <Dashboard {...viewProps} />;
    }
  };

  const currentNav = NAV.find(n => n.key === view) || NAV[0];
  const mainNav = NAV.filter(n => n.section === 'main');
  const insightsNav = NAV.filter(n => n.section === 'insights');
  const toolsNav = NAV.filter(n => n.section === 'tools');

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="mobile-overlay show" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Pipeline3D" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainNav.map(n => (
            <div key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
              {n.key === 'activities' && activities.filter(a => !a.done).length > 0 && (
                <span className="nav-badge">{activities.filter(a => !a.done).length}</span>
              )}
            </div>
          ))}
          <div className="nav-section-label">Insights</div>
          {insightsNav.map(n => (
            <div key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
          <div className="nav-section-label">Tools</div>
          {toolsNav.map(n => (
            <div key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
          {!isStandalone && (deferredPrompt || isIOS) && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <button className="btn btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={handleInstall}>
                📲 Install App
              </button>
            </div>
          )}
        </nav>

        {/* User Profile Section at bottom of sidebar */}
        <div className="sidebar-user" onClick={() => setShowUserMenu(u => !u)}>
          <div className="sidebar-user-avatar" style={{ background: currentUser.avatarColor || '#0D9488' }}>
            {getInitials(currentUser.name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser.name}</div>
            <div className="sidebar-user-role">{isAdmin ? '👑 Admin' : '💼 Sales Rep'}</div>
          </div>
          <span className="sidebar-user-dots">⋯</span>
        </div>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div className="user-menu">
            <div className="user-menu-header">
              <div className="sidebar-user-avatar" style={{ background: currentUser.avatarColor || '#0D9488', width: 32, height: 32, fontSize: 12 }}>
                {getInitials(currentUser.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentUser.email}</div>
              </div>
            </div>
            <div className="user-menu-divider" />
            <div className="user-menu-item" onClick={() => { navigate('settings'); setShowUserMenu(false); }}>
              ⚙️ Settings
            </div>
            <div className="user-menu-divider" />
            <div className="user-menu-item user-menu-item-danger" onClick={handleLogout}>
              🚪 Sign Out
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h2>{currentNav.icon} {currentNav.label}</h2>
          </div>
          <div className="top-bar-actions">
            <EmailComposer {...viewProps} />
            <button className="btn btn-ghost btn-sm" onClick={() => { setCmdOpen(true); setCmdQuery(''); }}>
              🔍 Search <kbd>⌘K</kbd>
            </button>
          </div>
        </header>
        <div className="page-content">
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner" /></div>}>
            {renderView()}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(key => {
          const n = NAV.find(x => x.key === key);
          return (
            <div key={key} className={`mobile-nav-item ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Command Palette */}
      {cmdOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCmdOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
              <input autoFocus value={cmdQuery} onChange={e => setCmdQuery(e.target.value)}
                placeholder="Search deals, contacts, companies, or navigate…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit' }} />
              <kbd>ESC</kbd>
            </div>
            {cmdResults.length > 0 && (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {cmdResults.map((r, i) => (
                  <div key={i} onClick={() => { r.action(); setCmdOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
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
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Type to search across all data, or navigate to any page.</div>
            )}
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSInstall && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowIOSInstall(false)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3>📲 Install Pipeline3D</h3>
              <button className="modal-close" onClick={() => setShowIOSInstall(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src="/logo.png" alt="Pipeline3D" style={{ width: 72, height: 72, borderRadius: 16 }} />
              </div>
              <div className="ios-install-steps">
                <div className="ios-step">
                  <div className="ios-step-num">1</div>
                  <div>Tap the <strong>Share</strong> button <span style={{ fontSize: 18 }}>⬆️</span> at the bottom of Safari</div>
                </div>
                <div className="ios-step">
                  <div className="ios-step-num">2</div>
                  <div>Scroll down and tap <strong>"Add to Home Screen"</strong></div>
                </div>
                <div className="ios-step">
                  <div className="ios-step-num">3</div>
                  <div>Tap <strong>"Add"</strong> in the top right to confirm</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowIOSInstall(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingTour onClose={() => { setShowOnboarding(false); localStorage.setItem('p3d_toured', '1'); }} onNavigate={navigate} />
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>

      {/* Welcome Banner */}
      {welcomeBanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease',
        }} onClick={() => setWelcomeBanner(null)}>
          <div style={{
            textAlign: 'center', padding: '48px 60px', borderRadius: 20,
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary))',
            border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.5s ease', maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              {welcomeBanner.timeGreet}, {welcomeBanner.firstName}!
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981, #0d9488)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginTop: 4,
            }}>
              Let's WIN today! 🏆
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>Click anywhere to continue</div>
          </div>
        </div>
      )}

      {/* Click outside user menu to close */}
      {showUserMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowUserMenu(false)} />}

      {/* Force Password Change Modal */}
      {showForceChangePw && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>🔒 Password Change Required</h3>
            </div>
            <form onSubmit={handleForceChangePw}>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  For security, you must change your password before continuing.
                </p>
                {changePwError && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                    ⚠️ {changePwError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={changePwForm.current}
                    onChange={e => setChangePwForm(f => ({ ...f, current: e.target.value }))} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password (min 8 characters)</label>
                  <input type="password" className="form-input" value={changePwForm.newPw}
                    onChange={e => setChangePwForm(f => ({ ...f, newPw: e.target.value }))} required minLength={8} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" value={changePwForm.confirm}
                    onChange={e => setChangePwForm(f => ({ ...f, confirm: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={changePwLoading}>
                  {changePwLoading ? 'Updating…' : '🔐 Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
