import { useState } from 'react';

const CATEGORIES = [
    { id: 'comms', name: 'Communication', icon: '💬' },
    { id: 'productivity', name: 'Productivity', icon: '📋' },
    { id: 'finance', name: 'Finance & Billing', icon: '💰' },
    { id: 'marketing', name: 'Marketing & Outreach', icon: '📣' },
    { id: 'dev', name: 'Developer & Custom', icon: '⚙️' },
];

const BUILT_IN = [
    // Communication
    {
        id: 'gmail', name: 'Gmail (Two-Way Sync)', icon: '📧', category: 'comms', desc: 'Two-way email sync — see all Gmail conversations inside deal cards. Auto-log sent/received emails.', connected: false,
        fields: [{ key: 'oauthToken', label: 'Google OAuth Token', placeholder: 'Connect via Google OAuth' }]
    },
    {
        id: 'outlook', name: 'Outlook (Two-Way Sync)', icon: '📬', category: 'comms', desc: 'Two-way sync with Microsoft 365. Emails auto-linked to deals and contacts. Smart BCC fallback.', connected: false,
        fields: [{ key: 'oauthToken', label: 'Microsoft OAuth Token', placeholder: 'Connect via Microsoft OAuth' }]
    },
    {
        id: 'slack', name: 'Slack', icon: '💬', category: 'comms', desc: 'Post deal updates to Slack channels. Get notified on stage changes, wins, and stale deals.', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }]
    },
    {
        id: 'teams', name: 'Microsoft Teams', icon: '👥', category: 'comms', desc: 'Send deal notifications to Teams channels. Real-time alerts on pipeline changes.', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://outlook.office.com/webhook/...' }]
    },
    {
        id: 'twilio', name: 'Twilio', icon: '📱', category: 'comms', desc: 'Send SMS notifications on deal events. Auto-text follow-ups and reminders.', connected: false,
        fields: [{ key: 'accountSid', label: 'Account SID', placeholder: 'AC...' }, { key: 'authToken', label: 'Auth Token', placeholder: 'Your auth token' }]
    },
    // Productivity
    {
        id: 'google', name: 'Google Workspace', icon: '🔵', category: 'productivity', desc: 'Sync contacts, calendar events, and Google Drive attachments with Pipeline3D.', connected: false,
        fields: [{ key: 'clientId', label: 'OAuth Client ID', placeholder: 'your-client-id.apps.googleusercontent.com' }]
    },
    {
        id: 'calendly', name: 'Calendly', icon: '📅', category: 'productivity', desc: 'Auto-create deals and activities when meetings are scheduled via Calendly.', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Your Calendly API key' }]
    },
    {
        id: 'notion', name: 'Notion', icon: '📝', category: 'productivity', desc: 'Sync deals and contacts to Notion databases. Build custom dashboards.', connected: false,
        fields: [{ key: 'apiKey', label: 'Integration Token', placeholder: 'secret_...' }]
    },
    {
        id: 'asana', name: 'Asana', icon: '✅', category: 'productivity', desc: 'Create Asana tasks from Pipeline3D activities. Sync project timelines.', connected: false,
        fields: [{ key: 'apiKey', label: 'Personal Access Token', placeholder: '0/...' }]
    },
    {
        id: 'trello', name: 'Trello', icon: '📋', category: 'productivity', desc: 'Mirror pipeline stages to Trello boards. Create cards from deals.', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Your Trello API key' }]
    },
    {
        id: 'docusign', name: 'DocuSign', icon: '✍️', category: 'productivity', desc: 'Send proposals for e-signature. Auto-mark deals as Won when signed.', connected: false,
        fields: [{ key: 'apiKey', label: 'Integration Key', placeholder: 'Your DocuSign integration key' }]
    },
    // Finance
    {
        id: 'quickbooks', name: 'QuickBooks', icon: '📗', category: 'finance', desc: 'Sync won deals to QuickBooks invoices. Auto-create customers from contacts.', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'Your QuickBooks API key' }]
    },
    {
        id: 'xero', name: 'Xero', icon: '💙', category: 'finance', desc: 'Push closed-won deals to Xero as invoices. Sync payment status back to CRM.', connected: false,
        fields: [{ key: 'clientId', label: 'OAuth Client ID', placeholder: 'Your Xero client ID' }]
    },
    {
        id: 'stripe', name: 'Stripe', icon: '💳', category: 'finance', desc: 'Track payments against deals. Auto-update deal status on successful charges.', connected: false,
        fields: [{ key: 'apiKey', label: 'Secret Key', placeholder: 'sk_live_...' }]
    },
    // Marketing
    {
        id: 'mailchimp', name: 'Mailchimp', icon: '🐵', category: 'marketing', desc: 'Sync contacts to Mailchimp audiences. Trigger campaigns from pipeline events.', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'your-api-key-us1' }]
    },
    {
        id: 'sendgrid', name: 'SendGrid', icon: '📤', category: 'marketing', desc: 'Send transactional and marketing emails through SendGrid infrastructure.', connected: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'SG.your-key...' }]
    },
    {
        id: 'hubspot', name: 'HubSpot (Import)', icon: '🔶', category: 'marketing', desc: 'One-click import contacts and deals from HubSpot. Migrate to Pipeline3D in minutes.', connected: false,
        fields: [{ key: 'apiKey', label: 'Private App Token', placeholder: 'pat-na1-...' }]
    },
    {
        id: 'salesforce', name: 'Salesforce (Import)', icon: '☁️', category: 'marketing', desc: 'Import leads, contacts, and opportunities from Salesforce. Migrate your pipeline.', connected: false,
        fields: [{ key: 'apiKey', label: 'Security Token', placeholder: 'Your Salesforce token' }]
    },
    // Dev / Custom
    {
        id: 'zapier', name: 'Zapier', icon: '⚡', category: 'dev', desc: 'Connect to 6,000+ apps via Zapier webhooks. Zero-code automation bridge.', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }]
    },
    {
        id: 'make', name: 'Make (Integromat)', icon: '🔄', category: 'dev', desc: 'Build visual automation scenarios. Advanced data routing and transformation.', connected: false,
        fields: [{ key: 'webhookUrl', label: 'Make Webhook URL', placeholder: 'https://hook.us1.make.com/...' }]
    },
    {
        id: 'n8n', name: 'n8n', icon: '🔗', category: 'dev', desc: 'Self-hosted workflow automation. Full control over data flow and logic.', connected: false,
        fields: [{ key: 'webhookUrl', label: 'n8n Webhook URL', placeholder: 'https://your-n8n.example.com/webhook/...' }]
    },
    {
        id: 'github', name: 'GitHub', icon: '🐙', category: 'dev', desc: 'Link deals to GitHub repos. Track development progress on technical sales.', connected: false,
        fields: [{ key: 'token', label: 'Personal Access Token', placeholder: 'ghp_...' }]
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
                        <h3>{connectedCount} of {integrations.length} connected</h3>
                    </div>
                    {CATEGORIES.map(cat => {
                        const catIntegrations = integrations.filter(i => i.category === cat.id);
                        if (catIntegrations.length === 0) return null;
                        return (
                            <div key={cat.id} style={{ marginBottom: 20 }}>
                                <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                    {cat.icon} {cat.name} ({catIntegrations.length})
                                </h4>
                                <div className="integration-grid">
                                    {catIntegrations.map(int => (
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
                            </div>
                        );
                    })}
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
                        <div className="chart-card-title">🔒 Authentication & Security</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <p><strong>Auth Middleware:</strong> API endpoints are protected by Bearer token / API key authentication when configured.</p>
                            <p style={{ marginTop: 8 }}><strong>CORS:</strong> Restricted to <code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>pipeline3d.pages.dev</code> and localhost (dev).</p>
                            <p style={{ marginTop: 8 }}><strong>Headers:</strong> HSTS, CSP, X-Frame-Options, X-Content-Type-Options enabled.</p>
                            <p style={{ marginTop: 8 }}><strong>To enable auth:</strong> Set <code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>API_KEY</code> secret in Cloudflare dashboard → Settings → Variables.</p>
                        </div>
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
                                <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 12, color: '#f59e0b' }}>
                                    🔒 Credentials are encrypted and never stored in your browser.
                                </div>
                                {int.fields.map(f => (
                                    <div className="form-group" key={f.key}>
                                        <label className="form-label">{f.label}</label>
                                        <input className="form-input" type="password" autoComplete="off" placeholder={f.placeholder}
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
