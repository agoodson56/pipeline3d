import { useState, lazy, Suspense } from 'react';
import * as api from '../api.js';

const UserManagement = lazy(() => import('./UserManagement.jsx'));

const DEFAULT_FIELDS = [
    { id: 1, name: 'Service Line', type: 'dropdown', entity: 'deals', options: ['Structured Cabling', 'CCTV', 'DAS', 'Access Control', 'Audio Visual', 'Intrusion', 'Fire Alarm', 'Security Systems', 'Service & Maintenance'], active: true },
    { id: 2, name: 'Project Type', type: 'dropdown', entity: 'deals', options: ['New Install', 'Upgrade / Retrofit', 'Service & Repair', 'Design-Build', 'Consultation / Assessment', 'Maintenance Agreement'], active: true },
    { id: 3, name: 'Lead Source', type: 'dropdown', entity: 'deals', options: ['Website (3dtsi.com)', 'Referral', 'GC / Contractor Referral', 'Architect / Engineer Spec', 'RFP / Bid Invite', 'Existing Customer', 'Cold Call', 'Trade Show', 'LinkedIn', 'Other'], active: true },
    { id: 4, name: 'Decision Timeline', type: 'dropdown', entity: 'deals', options: ['Immediate', '1-3 months', '3-6 months', '6+ months'], active: true },
    { id: 5, name: 'Contract Length', type: 'text', entity: 'deals', options: [], active: true },
    { id: 6, name: 'Bid Due Date', type: 'date', entity: 'deals', options: [], active: true },
    { id: 7, name: 'Territory', type: 'dropdown', entity: 'contacts', options: ['Sacramento / NorCal', 'Bay Area', 'Southern California', 'Houston / Texas', 'Other US', 'International'], active: true },
    { id: 8, name: 'LinkedIn URL', type: 'text', entity: 'contacts', options: [], active: false },
];

export default function Settings({ toast, pipelines, refreshPipelines, currentUser, isAdmin, monthlyQuota, dealRotting, defaultProbability, refreshSettings }) {
    const [tab, setTab] = useState(isAdmin ? 'users' : 'fields');
    const [customFields, setCustomFields] = useState(DEFAULT_FIELDS);
    const [showAddField, setShowAddField] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'text', entity: 'deals', options: '' });

    // 2FA state
    const [twoFASetup, setTwoFASetup] = useState(null); // { secret, otpauthUri }
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState('');
    const [disablePw, setDisablePw] = useState('');

    const addField = () => {
        if (!newField.name.trim()) return;
        setCustomFields(fs => [...fs, {
            id: Date.now(), name: newField.name.trim(), type: newField.type, entity: newField.entity,
            options: newField.type === 'dropdown' ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : [],
            active: true,
        }]);
        toast('Custom field added!');
        setShowAddField(false);
        setNewField({ name: '', type: 'text', entity: 'deals', options: '' });
    };

    const toggleField = (id) => {
        setCustomFields(fs => fs.map(f => f.id === id ? { ...f, active: !f.active } : f));
    };

    const deleteField = (id) => {
        setCustomFields(fs => fs.filter(f => f.id !== id));
        toast('Field removed');
    };

    const dealFields = customFields.filter(f => f.entity === 'deals');
    const contactFields = customFields.filter(f => f.entity === 'contacts');

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                {isAdmin && (
                    <button className={`detail-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 Users</button>
                )}
                <button className={`detail-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>🛠 Custom Fields</button>
                <button className={`detail-tab ${tab === 'pipelines' ? 'active' : ''}`} onClick={() => setTab('pipelines')}>🔀 Pipelines</button>
                <button className={`detail-tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>🔐 Security</button>
                <button className={`detail-tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>⚙️ General</button>
            </div>

            {tab === 'users' && isAdmin && (
                <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>}>
                    <UserManagement toast={toast} currentUser={currentUser} />
                </Suspense>
            )}

            {tab === 'fields' && (
                <div>
                    <div className="section-header">
                        <h3>{customFields.filter(f => f.active).length} active fields</h3>
                        <button className="btn btn-primary" onClick={() => setShowAddField(true)}>+ Add Field</button>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Deal Fields</h4>
                        <div className="automation-list">
                            {dealFields.map(field => (
                                <div className={`automation-card ${field.active ? '' : 'inactive'}`} key={field.id}>
                                    <div className="automation-card-header" style={{ cursor: 'default' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div className={`automation-toggle ${field.active ? 'on' : ''}`} onClick={() => toggleField(field.id)}>
                                                <div className="automation-toggle-thumb" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{field.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {field.type === 'dropdown' ? `Dropdown: ${field.options.join(', ')}` : `Text input`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span className="tag tag-accent" style={{ fontSize: 10 }}>{field.type}</span>
                                            <button className="btn-icon" onClick={() => deleteField(field.id)}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Contact Fields</h4>
                        <div className="automation-list">
                            {contactFields.map(field => (
                                <div className={`automation-card ${field.active ? '' : 'inactive'}`} key={field.id}>
                                    <div className="automation-card-header" style={{ cursor: 'default' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div className={`automation-toggle ${field.active ? 'on' : ''}`} onClick={() => toggleField(field.id)}>
                                                <div className="automation-toggle-thumb" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{field.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {field.type === 'dropdown' ? `Dropdown: ${field.options.join(', ')}` : `Text input`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span className="tag tag-accent" style={{ fontSize: 10 }}>{field.type}</span>
                                            <button className="btn-icon" onClick={() => deleteField(field.id)}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'pipelines' && (
                <div>
                    <div className="section-header" style={{ marginBottom: 12 }}>
                        <h3>{pipelines.length} pipelines</h3>
                    </div>
                    {pipelines.map(p => (
                        <div className="chart-card" key={p.id} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color }} />
                                <span style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {(p.stages || []).map((s, i) => (
                                    <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                                        <span style={{ fontSize: 13 }}>{s.name}</span>
                                        {i < (p.stages || []).length - 1 && <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Trade-Specific Pipeline Templates */}
                    <div style={{ marginTop: 24, padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🏗️ Trade-Specific Pipeline Templates</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Pre-configured stages for each trade — ready to use or customize.</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                            {[
                                { name: '🔥 Fire Alarm', color: '#ef4444', stages: ['Lead In', 'Contact Made', 'Site Survey', 'Design & Engineering', 'AHJ Submittal', 'Proposal', 'Negotiation', 'Won'] },
                                { name: '📡 DAS', color: '#8b5cf6', stages: ['Lead In', 'Contact Made', 'RF Survey', 'Carrier Coordination', 'Design & Engineering', 'Proposal', 'Negotiation', 'Won'] },
                                { name: '🔐 Access Control', color: '#3b82f6', stages: ['Lead In', 'Contact Made', 'Security Consulting', 'Site Survey', 'System Design', 'Proposal', 'Negotiation', 'Won'] },
                                { name: '🔌 Structured Cabling', color: '#10b981', stages: ['Lead In', 'Contact Made', 'Site Survey', 'Pathway Design', 'Proposal', 'Negotiation', 'Won'] },
                                { name: '📹 CCTV / Surveillance', color: '#f59e0b', stages: ['Lead In', 'Contact Made', 'Site Survey', 'Camera Layout Design', 'Proposal', 'Negotiation', 'Won'] },
                                { name: '🔊 Audio Visual', color: '#ec4899', stages: ['Lead In', 'Contact Made', 'Needs Assessment', 'AV Design', 'Proposal', 'Negotiation', 'Won'] },
                            ].map((tmpl, idx) => (
                                <div key={idx} style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: tmpl.color }} />
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{tmpl.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {tmpl.stages.map((s, i) => (
                                            <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: `${tmpl.color}15`, color: tmpl.color, border: `1px solid ${tmpl.color}30` }}>
                                                {s}{i < tmpl.stages.length - 1 ? ' →' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'general' && (
                <div className="dashboard-grid">
                    <div className="chart-card">
                        <div className="chart-card-title">Company Information</div>
                        <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" defaultValue="3D Technology Services Inc." /></div>
                        <div className="form-group"><label className="form-label">Industry</label><input className="form-input" defaultValue="Systems Integration / Low Voltage" /></div>
                        <div className="form-group"><label className="form-label">Default Currency</label><select className="form-select" defaultValue="USD"><option>USD</option><option>EUR</option><option>GBP</option></select></div>
                        <div className="form-group"><label className="form-label">Fiscal Year Start</label><select className="form-select" defaultValue="January"><option>January</option><option>April</option><option>July</option><option>October</option></select></div>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">Deal Defaults</div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            const settings = {
                                defaultProbability: fd.get('defaultProbability'),
                                dealRotting: fd.get('dealRotting'),
                                monthlyQuota: fd.get('monthlyQuota'),
                            };
                            try {
                                await api.saveSettings(settings);
                                if (typeof refreshSettings === 'function') await refreshSettings();
                                toast('✅ Settings saved!');
                            } catch (err) { toast(err.message, 'error'); }
                        }}>
                            <div className="form-group"><label className="form-label">Default Win Probability (%)</label><input name="defaultProbability" className="form-input" type="number" defaultValue={defaultProbability || 20} min="0" max="100" /></div>
                            <div className="form-group"><label className="form-label">Deal Rotting (days)</label><input name="dealRotting" className="form-input" type="number" defaultValue={dealRotting || 30} min="1" /></div>
                            <div className="form-group">
                                <label className="form-label">Monthly Quota ($)</label>
                                <input name="monthlyQuota" className="form-input" type="number" defaultValue={monthlyQuota || 100000} min="0" step="1000" />
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Annual: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((monthlyQuota || 100000) * 12)}</div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>💾 Save Deal Settings</button>
                        </form>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">Your Account</div>
                        <div className="form-group"><label className="form-label">Name</label><input className="form-input" defaultValue={currentUser?.name} disabled /></div>
                        <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue={currentUser?.email} disabled /></div>
                        <div className="form-group"><label className="form-label">Role</label><input className="form-input" defaultValue={currentUser?.role === 'admin' ? 'Administrator' : 'Sales Representative'} disabled /></div>
                    </div>
                </div>
            )}

            {tab === 'security' && (
                <div className="dashboard-grid">
                    <div className="chart-card">
                        <div className="chart-card-title">🔐 Two-Factor Authentication (2FA)</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Add an extra layer of security by requiring a 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) each time you sign in.
                        </p>

                        {twoFAError && (
                            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                                ⚠️ {twoFAError}
                            </div>
                        )}

                        {!twoFASetup && !twoFAEnabled && (
                            <button className="btn btn-primary" disabled={twoFALoading} onClick={async () => {
                                setTwoFALoading(true); setTwoFAError('');
                                try {
                                    const data = await api.setup2FA();
                                    setTwoFASetup(data);
                                } catch (e) { setTwoFAError(e.message); }
                                setTwoFALoading(false);
                            }}>
                                {twoFALoading ? '⏳ Setting up...' : '🔐 Enable 2FA'}
                            </button>
                        )}

                        {twoFASetup && !twoFAEnabled && (
                            <div>
                                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Step 1: Add this key to your authenticator app</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                                        <code style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 15, fontFamily: 'monospace', letterSpacing: 2, wordBreak: 'break-all' }}>
                                            {twoFASetup.secret}
                                        </code>
                                        <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(twoFASetup.secret); toast('Key copied!'); }}>
                                            📋 Copy
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open Google Authenticator → Tap + → Enter a setup key → Paste the key above</div>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Step 2: Enter the 6-digit code from your app</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="form-input" value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000" maxLength={6} inputMode="numeric"
                                            style={{ flex: 1, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'monospace' }} />
                                        <button className="btn btn-primary" disabled={twoFACode.length !== 6 || twoFALoading} onClick={async () => {
                                            setTwoFALoading(true); setTwoFAError('');
                                            try {
                                                await api.confirm2FA(twoFACode);
                                                setTwoFAEnabled(true);
                                                setTwoFASetup(null);
                                                setTwoFACode('');
                                                toast('✅ 2FA enabled successfully!');
                                            } catch (e) { setTwoFAError(e.message); }
                                            setTwoFALoading(false);
                                        }}>
                                            {twoFALoading ? '⏳' : '✓ Verify'}
                                        </button>
                                    </div>
                                </div>
                                <button className="btn btn-ghost" onClick={() => { setTwoFASetup(null); setTwoFACode(''); setTwoFAError(''); }}>Cancel</button>
                            </div>
                        )}

                        {twoFAEnabled && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#065f46', borderRadius: 10, marginBottom: 16 }}>
                                    <span style={{ fontSize: 24 }}>✅</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#d1fae5' }}>2FA is enabled</div>
                                        <div style={{ fontSize: 12, color: '#a7f3d0' }}>Your account is protected with two-factor authentication</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Disable 2FA</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="password" className="form-input" placeholder="Enter your password" value={disablePw}
                                        onChange={e => setDisablePw(e.target.value)} style={{ flex: 1 }} />
                                    <button className="btn btn-ghost" style={{ color: '#ef4444' }} disabled={!disablePw || twoFALoading} onClick={async () => {
                                        setTwoFALoading(true); setTwoFAError('');
                                        try {
                                            await api.disable2FA(disablePw);
                                            setTwoFAEnabled(false);
                                            setDisablePw('');
                                            toast('2FA disabled');
                                        } catch (e) { setTwoFAError(e.message); }
                                        setTwoFALoading(false);
                                    }}>
                                        Disable 2FA
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chart-card">
                        <div className="chart-card-title">🔔 Push Notifications</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Receive browser notifications for deal updates, overdue activities, and new leads.
                        </p>
                        <button className="btn btn-primary" onClick={async () => {
                            if ('Notification' in window) {
                                const perm = await Notification.requestPermission();
                                if (perm === 'granted') {
                                    new Notification('Pipeline3D', { body: 'Notifications enabled!', icon: '/logo.png' });
                                    toast('✅ Notifications enabled!');
                                } else {
                                    toast('Notifications blocked — check browser settings', 'error');
                                }
                            } else {
                                toast('Notifications not supported in this browser', 'error');
                            }
                        }}>
                            {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✅ Notifications Active' : '🔔 Enable Notifications'}
                        </button>
                    </div>

                    <div className="chart-card">
                        <div className="chart-card-title">📡 Offline Mode</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Pipeline3D automatically caches your data for offline access. When you lose internet, you can still view your deals, contacts, and activities in read-only mode. Changes sync automatically when you reconnect.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: navigator.onLine ? '#10b981' : '#ef4444' }} />
                            <span style={{ fontSize: 13 }}>{navigator.onLine ? 'Online — data syncing normally' : 'Offline — viewing cached data'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Custom Field Modal */}
            {showAddField && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddField(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add Custom Field</h3>
                            <button className="modal-close" onClick={() => setShowAddField(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Field Name *</label>
                                <input className="form-input" value={newField.name} onChange={e => setNewField(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lead Source" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-select" value={newField.type} onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}>
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="dropdown">Dropdown</option>
                                        <option value="date">Date</option>
                                        <option value="checkbox">Checkbox</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Applies To</label>
                                    <select className="form-select" value={newField.entity} onChange={e => setNewField(f => ({ ...f, entity: e.target.value }))}>
                                        <option value="deals">Deals</option>
                                        <option value="contacts">Contacts</option>
                                        <option value="companies">Companies</option>
                                    </select>
                                </div>
                            </div>
                            {newField.type === 'dropdown' && (
                                <div className="form-group">
                                    <label className="form-label">Options (comma-separated)</label>
                                    <input className="form-input" value={newField.options} onChange={e => setNewField(f => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddField(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={addField}>Add Field</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
