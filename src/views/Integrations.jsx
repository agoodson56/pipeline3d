import { useState } from 'react';

const BUILT_IN = [
    {
        id: 'slack', name: 'Slack', icon: '💬', desc: 'Post deal updates to Slack channels', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }]
    },
    {
        id: 'teams', name: 'Microsoft Teams', icon: '👥', desc: 'Send notifications to Teams channels', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://outlook.office.com/webhook/...' }]
    },
    {
        id: 'zapier', name: 'Zapier', icon: '⚡', desc: 'Connect to 6,000+ apps via Zapier webhooks', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }]
    },
    {
        id: 'make', name: 'Make (Integromat)', icon: '🔄', desc: 'Automate workflows with Make scenarios', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Make Webhook URL', placeholder: 'https://hook.us1.make.com/...' }]
    },
    {
        id: 'quickbooks', name: 'QuickBooks', icon: '📗', desc: 'Sync won deals to QuickBooks invoices', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Your QuickBooks API key' }]
    },
    {
        id: 'google', name: 'Google Workspace', icon: '🔵', desc: 'Sync contacts & calendar with Google', connected: false,
        fields: [{ key: 'clientId', label: 'OAuth Client ID', placeholder: 'your-client-id.apps.googleusercontent.com' }]
    },
];

const WEBHOOK_EVENTS = [
    'deal.created', 'deal.updated', 'deal.won', 'deal.lost', 'deal.deleted',
    'contact.created', 'contact.updated',
    'activity.created', 'activity.completed',
];

export default function Integrations({ toast }) {
    const [integrations, setIntegrations] = useState(BUILT_IN);
    const [configuring, setConfiguring] = useState(null);
    const [configValues, setConfigValues] = useState({});
    const [webhooks, setWebhooks] = useState([
        { id: 1, url: 'https://hooks.zapier.com/hooks/catch/12345/abcde/', events: ['deal.won', 'deal.created'], active: true },
    ]);
    const [showAddWebhook, setShowAddWebhook] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ url: '', events: [] });
    const [tab, setTab] = useState('integrations');

    const handleConnect = (id) => {
        const integration = integrations.find(i => i.id === id);
        if (!integration) return;
        // Check all fields are filled
        const allFilled = integration.fields.every(f => configValues[f.key]?.trim());
        if (!allFilled) { toast('Please fill all fields', 'error'); return; }
        setIntegrations(is => is.map(i => i.id === id ? { ...i, connected: true } : i));
        toast(`${integration.name} connected!`);
        setConfiguring(null);
    };

    const handleDisconnect = (id) => {
        setIntegrations(is => is.map(i => i.id === id ? { ...i, connected: false } : i));
        toast('Disconnected');
    };

    const addWebhook = () => {
        if (!newWebhook.url.trim() || newWebhook.events.length === 0) { toast('URL and events required', 'error'); return; }
        setWebhooks(ws => [...ws, { ...newWebhook, id: Date.now(), active: true }]);
        toast('Webhook added!');
        setShowAddWebhook(false);
        setNewWebhook({ url: '', events: [] });
    };

    const toggleEvent = (event) => {
        setNewWebhook(w => ({
            ...w,
            events: w.events.includes(event) ? w.events.filter(e => e !== event) : [...w.events, event],
        }));
    };

    const connectedCount = integrations.filter(i => i.connected).length;

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'integrations' ? 'active' : ''}`} onClick={() => setTab('integrations')}>🔌 Integrations</button>
                <button className={`detail-tab ${tab === 'webhooks' ? 'active' : ''}`} onClick={() => setTab('webhooks')}>🔗 Webhooks</button>
                <button className={`detail-tab ${tab === 'api' ? 'active' : ''}`} onClick={() => setTab('api')}>🛠 API</button>
            </div>

            {tab === 'integrations' && (
                <>
                    <div className="section-header">
                        <h3>{connectedCount} connected</h3>
                    </div>
                    <div className="integration-grid">
                        {integrations.map(int => (
                            <div className={`integration-card ${int.connected ? 'connected' : ''}`} key={int.id}>
                                <div className="integration-card-icon">{int.icon}</div>
                                <div className="integration-card-info">
                                    <div className="integration-card-name">{int.name}</div>
                                    <div className="integration-card-desc">{int.desc}</div>
                                </div>
                                {int.connected ? (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className="tag tag-green">Connected</span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(int.id)}>Disconnect</button>
                                    </div>
                                ) : (
                                    <button className="btn btn-primary btn-sm" onClick={() => { setConfiguring(int.id); setConfigValues({}); }}>Connect</button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {tab === 'webhooks' && (
                <>
                    <div className="section-header">
                        <h3>{webhooks.length} webhooks</h3>
                        <button className="btn btn-primary" onClick={() => setShowAddWebhook(true)}>+ Add Webhook</button>
                    </div>
                    <div className="automation-list">
                        {webhooks.map(wh => (
                            <div className="automation-card" key={wh.id}>
                                <div className="automation-card-header">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>{wh.url}</div>
                                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                            {wh.events.map(ev => <span key={ev} className="tag tag-accent" style={{ fontSize: 10 }}>{ev}</span>)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className={`tag ${wh.active ? 'tag-green' : ''}`}>{wh.active ? 'Active' : 'Paused'}</span>
                                        <button className="btn btn-danger btn-sm" onClick={() => { setWebhooks(ws => ws.filter(w => w.id !== wh.id)); toast('Removed'); }}>✕</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {webhooks.length === 0 && (
                            <div className="empty-state"><div className="empty-state-icon">🔗</div><h3>No webhooks</h3><p>Add a webhook to receive real-time events.</p></div>
                        )}
                    </div>
                </>
            )}

            {tab === 'api' && (
                <div>
                    <div className="chart-card">
                        <div className="chart-card-title">REST API Endpoints</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {[
                                { method: 'GET', path: '/api/deals', desc: 'List all deals' },
                                { method: 'POST', path: '/api/deals', desc: 'Create or update a deal' },
                                { method: 'DELETE', path: '/api/deals?id={id}', desc: 'Delete a deal' },
                                { method: 'GET', path: '/api/contacts', desc: 'List all contacts' },
                                { method: 'POST', path: '/api/contacts', desc: 'Create or update a contact' },
                                { method: 'GET', path: '/api/companies', desc: 'List all companies' },
                                { method: 'POST', path: '/api/companies', desc: 'Create or update a company' },
                                { method: 'GET', path: '/api/pipelines', desc: 'List all pipelines' },
                                { method: 'GET', path: '/api/activities', desc: 'List all activities' },
                                { method: 'POST', path: '/api/activities', desc: 'Create or update an activity' },
                                { method: 'GET', path: '/api/emails', desc: 'List email logs' },
                                { method: 'GET', path: '/api/settings', desc: 'Get all settings' },
                            ].map((ep, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span className={`tag ${ep.method === 'GET' ? 'tag-green' : ep.method === 'POST' ? 'tag-blue' : 'tag-red'}`} style={{ width: 60, textAlign: 'center', fontWeight: 700 }}>{ep.method}</span>
                                    <span style={{ color: 'var(--accent-light)', flex: 1 }}>{ep.path}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{ep.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="chart-card" style={{ marginTop: 16 }}>
                        <div className="chart-card-title">Authentication</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            All API endpoints are accessible at your Cloudflare Pages URL. CORS is enabled for cross-origin requests.
                            For production, add API key authentication via Cloudflare Workers middleware.
                        </p>
                    </div>
                </div>
            )}

            {/* Configure Integration Modal */}
            {configuring && (() => {
                const int = integrations.find(i => i.id === configuring);
                if (!int) return null;
                return (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfiguring(null)}>
                        <div className="modal">
                            <div className="modal-header">
                                <h3>{int.icon} Connect {int.name}</h3>
                                <button className="modal-close" onClick={() => setConfiguring(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{int.desc}</p>
                                {int.fields.map(f => (
                                    <div className="form-group" key={f.key}>
                                        <label className="form-label">{f.label}</label>
                                        <input className="form-input" placeholder={f.placeholder}
                                            value={configValues[f.key] || ''} onChange={e => setConfigValues(v => ({ ...v, [f.key]: e.target.value }))} />
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-ghost" onClick={() => setConfiguring(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={() => handleConnect(int.id)}>Connect</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Add Webhook Modal */}
            {showAddWebhook && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddWebhook(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>🔗 New Webhook</h3>
                            <button className="modal-close" onClick={() => setShowAddWebhook(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Endpoint URL *</label>
                                <input className="form-input" placeholder="https://..." value={newWebhook.url}
                                    onChange={e => setNewWebhook(w => ({ ...w, url: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Events to receive *</label>
                                <div className="automation-option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    {WEBHOOK_EVENTS.map(ev => (
                                        <div key={ev} className={`automation-option ${newWebhook.events.includes(ev) ? 'selected' : ''}`}
                                            onClick={() => toggleEvent(ev)}>
                                            <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{ev}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddWebhook(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={addWebhook}>Add Webhook</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
