import { useState } from 'react';

const KB_ARTICLES = [
    { id: 1, category: 'Getting Started', title: 'How to create your first deal', content: 'Navigate to Pipeline → Click + Add Deal → Fill in deal title, value, stage, and contact → Click Create Deal. Your deal will appear as a card in the Kanban board.' },
    { id: 2, category: 'Getting Started', title: 'Understanding your Dashboard', content: 'The Dashboard shows 4 KPI cards: Pipeline Value, Won Revenue, Weighted Forecast, and Win Rate. Below are Stage Distribution charts and Recent Deals. Check this daily for a pulse on your sales performance.' },
    { id: 3, category: 'Getting Started', title: 'Installing Pipeline3D on your phone', content: 'Android: Open Chrome → visit pipeline3d.pages.dev → tap Install App. iOS: Open Safari → tap Share → Add to Home Screen → Add. The app works offline and opens full-screen.' },
    { id: 4, category: 'Pipeline', title: 'Drag and drop deals between stages', content: 'Click and hold any deal card on the Kanban board. Drag it to the target stage column and release. The deal will be saved in the new stage automatically.' },
    { id: 5, category: 'Pipeline', title: 'Understanding deal rotting indicators', content: 'Deals show age badges: green (<14d fresh), yellow (14-30d aging), orange (30-60d warning), red (60d+ critical with pulsing border). Focus on red deals first — they need immediate action.' },
    { id: 6, category: 'Pipeline', title: 'Adding products/line items to deals', content: 'Open a deal → click Products tab → enter product name, quantity, unit price → click Add. Products auto-calculate totals and update the deal value. Use this as a quote builder.' },
    { id: 7, category: 'Contacts', title: 'Importing contacts from CSV', content: 'Go to Data Import → Click Choose CSV File → map columns to CRM fields → preview rows → click Import. Supports: Name, Email, Phone, Company, Role, Tags columns.' },
    { id: 8, category: 'Contacts', title: 'Detecting and merging duplicates', content: 'Go to Data Import → Duplicates tab. The system scans for matching emails. Click Merge All to combine duplicate records, keeping the best data from each.' },
    { id: 9, category: 'Email', title: 'Setting up email sequences', content: 'Go to Sequences → + New Sequence → name it → add steps (email or task) with day numbers → Create. Pre-built sequences: New Lead Nurture, Post-Proposal Follow-up, Re-Engagement.' },
    { id: 10, category: 'Email', title: 'Using the email composer', content: 'Click the purple Compose button (top-right). Choose a template, fill in To/Subject/Body, or click AI Draft for auto-generated content. Link emails to deals for tracking.' },
    { id: 11, category: 'AI & Analytics', title: 'How AI deal scoring works', content: 'AI Coach analyzes 8 factors: value, probability, stage, days open, label, contact assigned, note count, company. Grades: A (80-100%), B (60-79%), C (40-59%), D (0-39%). Follow the specific recommendations for each deal.' },
    { id: 12, category: 'AI & Analytics', title: 'Reading the conversion funnel', content: 'Go to Reports → Conversion Funnel tab. Visual funnel shows stage-to-stage conversion rates and dropoff counts. Focus improvements on the stage with the biggest dropoff.' },
    { id: 13, category: 'Automations', title: 'Creating automation rules', content: 'Go to Automations → + New Rule → select a trigger (e.g., deal moves to stage) → select an action (e.g., create task) → configure details → Save. Toggle rules on/off anytime.' },
    { id: 14, category: 'Integrations', title: 'Connecting Gmail two-way sync', content: 'Go to Integrations → find Gmail (Two-Way Sync) → click Connect → enter your Google OAuth token. Once connected, all sent/received emails auto-appear on deal cards.' },
    { id: 15, category: 'Integrations', title: 'Setting up webhooks', content: 'Go to Integrations → Webhooks tab → + Add Webhook → enter URL → select events (deal.won, contact.created, etc.). Webhooks fire real-time HTTP POST requests with event data.' },
    { id: 16, category: 'Settings', title: 'Adding custom fields', content: 'Go to Settings → Custom Fields → + Add Field → choose name, type (text/number/dropdown/date/checkbox), and entity (deals/contacts) → Save. Fields appear in record detail views.' },
    { id: 17, category: 'Troubleshooting', title: 'App not loading on mobile', content: 'Android requires Chrome. iOS requires Safari (not Chrome). Clear browser cache, ensure stable internet. If installed as PWA and broken, delete the home screen icon and reinstall.' },
    { id: 18, category: 'Troubleshooting', title: 'Cannot see pipeline stages', content: 'Ensure at least one pipeline exists in Settings → Pipelines. If empty, the default "Sales Pipeline" should auto-create. Try refreshing the page (Ctrl+Shift+R).' },
];

const STATUS_COLORS = { open: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981' };

export default function HelpCenter({ toast }) {
    const [tab, setTab] = useState('kb');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [tickets, setTickets] = useState([
        {
            id: 1, subject: 'Example: Cannot import CSV with special characters', status: 'resolved', priority: 'medium', created: '2026-03-05', messages: [
                { from: 'user', text: 'When I upload a CSV with accented characters, the import fails.', time: '2026-03-05 10:00' },
                { from: 'support', text: 'This has been fixed in the latest release. Please try again — special characters are now handled correctly during CSV parsing.', time: '2026-03-05 14:30' },
            ]
        },
    ]);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
    const [statusPage, setStatusPage] = useState({
        overall: 'operational', uptime: '99.97%', services: [
            { name: 'Web Application', status: 'operational', uptime: '99.99%' },
            { name: 'API Endpoints', status: 'operational', uptime: '99.98%' },
            { name: 'Database (D1)', status: 'operational', uptime: '99.97%' },
            { name: 'Email Service', status: 'operational', uptime: '99.95%' },
            { name: 'CDN (Cloudflare)', status: 'operational', uptime: '99.99%' },
        ]
    });

    const filteredArticles = searchQuery
        ? KB_ARTICLES.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : KB_ARTICLES;

    const categories = [...new Set(KB_ARTICLES.map(a => a.category))];

    const createTicket = () => {
        if (!newTicket.subject.trim() || !newTicket.message.trim()) return;
        const ticket = {
            id: Date.now(), subject: newTicket.subject, status: 'open', priority: newTicket.priority,
            created: new Date().toISOString().split('T')[0],
            messages: [{ from: 'user', text: newTicket.message, time: new Date().toLocaleString() }]
        };
        setTickets(t => [ticket, ...t]);
        toast('Support ticket created! We\'ll respond within 4 hours.');
        setShowNewTicket(false);
        setNewTicket({ subject: '', message: '', priority: 'medium' });
    };

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'kb' ? 'active' : ''}`} onClick={() => setTab('kb')}>📚 Knowledge Base</button>
                <button className={`detail-tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>
                    🎫 Support Tickets {tickets.filter(t => t.status !== 'resolved').length > 0 && `(${tickets.filter(t => t.status !== 'resolved').length})`}
                </button>
                <button className={`detail-tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>📡 System Status</button>
                <button className={`detail-tab ${tab === 'sla' ? 'active' : ''}`} onClick={() => setTab('sla')}>📋 SLA & Terms</button>
            </div>

            {tab === 'kb' && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <input className="form-input" placeholder="🔍 Search help articles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ maxWidth: 400 }} />
                    </div>

                    {selectedArticle ? (
                        <div className="chart-card">
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedArticle(null)} style={{ marginBottom: 12 }}>← Back to articles</button>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{selectedArticle.title}</h3>
                            <span className="tag tag-accent" style={{ marginBottom: 12, display: 'inline-block' }}>{selectedArticle.category}</span>
                            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{selectedArticle.content}</p>
                            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>📬 Didn't find what you need? <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedArticle(null); setTab('tickets'); }}>Submit a support ticket</button></p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {categories.filter(cat => filteredArticles.some(a => a.category === cat)).map(cat => (
                                <div key={cat} style={{ marginBottom: 20 }}>
                                    <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {filteredArticles.filter(a => a.category === cat).map(article => (
                                            <div key={article.id} className="automation-card" onClick={() => setSelectedArticle(article)} style={{ cursor: 'pointer' }}>
                                                <div className="automation-card-header">
                                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{article.title}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'tickets' && (
                <div>
                    <div className="section-header" style={{ marginBottom: 16 }}>
                        <h3>{tickets.length} tickets · {tickets.filter(t => t.status === 'open').length} open</h3>
                        <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>📝 New Ticket</button>
                    </div>

                    {tickets.map(ticket => (
                        <div className="chart-card" key={ticket.id} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{ticket.subject}</h4>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{ticket.id} · Created {ticket.created}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className="tag" style={{ background: `${STATUS_COLORS[ticket.status]}22`, color: STATUS_COLORS[ticket.status], fontWeight: 600 }}>
                                        {ticket.status === 'open' ? '🟡 Open' : ticket.status === 'in-progress' ? '🔵 In Progress' : '✅ Resolved'}
                                    </span>
                                    <span className="tag">{ticket.priority}</span>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                {ticket.messages.map((msg, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: i < ticket.messages.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                                            {msg.from === 'user' ? '👤 You' : '🛟 Support'} · {msg.time}
                                        </div>
                                        <p style={{ fontSize: 13, margin: 0 }}>{msg.text}</p>
                                    </div>
                                ))}
                            </div>
                            {ticket.status !== 'resolved' && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                                    <input id={`reply-${ticket.id}`} className="form-input" placeholder="Reply..." style={{ flex: 1 }} />
                                    <button className="btn btn-primary btn-sm" onClick={() => {
                                        const input = document.getElementById(`reply-${ticket.id}`);
                                        if (!input.value.trim()) return;
                                        setTickets(ts => ts.map(t => t.id === ticket.id ? { ...t, messages: [...t.messages, { from: 'user', text: input.value, time: new Date().toLocaleString() }] } : t));
                                        input.value = '';
                                        toast('Reply sent');
                                    }}>Reply</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {tickets.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎫</div><h3>No tickets</h3><p>Got a question? Create a support ticket and we'll respond within 4 hours.</p></div>}
                </div>
            )}

            {tab === 'status' && (
                <div>
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                            <h3 style={{ margin: 0 }}>All Systems Operational</h3>
                        </div>
                        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="kpi-card"><div className="kpi-label">Overall Uptime</div><div className="kpi-value" style={{ color: '#10b981' }}>{statusPage.uptime}</div><div className="kpi-sub">Last 90 days</div></div>
                            <div className="kpi-card"><div className="kpi-label">Avg Response Time</div><div className="kpi-value">42ms</div><div className="kpi-sub">API latency (p50)</div></div>
                            <div className="kpi-card"><div className="kpi-label">Edge Locations</div><div className="kpi-value">300+</div><div className="kpi-sub">Cloudflare global CDN</div></div>
                        </div>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">Service Health</div>
                        {statusPage.services.map(svc => (
                            <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: svc.status === 'operational' ? '#10b981' : '#f59e0b' }} />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{svc.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{svc.uptime}</span>
                                    <span className="tag tag-green" style={{ fontSize: 10 }}>Operational</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="chart-card" style={{ marginTop: 16 }}>
                        <div className="chart-card-title">Infrastructure</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            Pipeline3D runs on <strong>Cloudflare's global edge network</strong> across 300+ data centers in 100+ countries.
                            Data is stored in <strong>Cloudflare D1</strong> (distributed SQLite) with automatic replication.
                            All traffic is encrypted via TLS 1.3. DDoS protection is always-on. No single point of failure.
                        </p>
                    </div>
                </div>
            )}

            {tab === 'sla' && (
                <div>
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <div className="chart-card-title">Service Level Agreement</div>
                        <table className="data-table" style={{ marginTop: 8 }}>
                            <thead><tr><th>Metric</th><th>Commitment</th><th>Current</th></tr></thead>
                            <tbody>
                                <tr><td>Uptime</td><td style={{ fontWeight: 600 }}>99.9%</td><td style={{ color: '#10b981', fontWeight: 600 }}>99.97%</td></tr>
                                <tr><td>API Response Time (p95)</td><td style={{ fontWeight: 600 }}>&lt; 200ms</td><td style={{ color: '#10b981', fontWeight: 600 }}>68ms</td></tr>
                                <tr><td>Support Response — Critical</td><td style={{ fontWeight: 600 }}>1 hour</td><td style={{ color: '#10b981', fontWeight: 600 }}>~30 min</td></tr>
                                <tr><td>Support Response — High</td><td style={{ fontWeight: 600 }}>4 hours</td><td style={{ color: '#10b981', fontWeight: 600 }}>~2 hours</td></tr>
                                <tr><td>Support Response — Medium</td><td style={{ fontWeight: 600 }}>1 business day</td><td style={{ color: '#10b981', fontWeight: 600 }}>~6 hours</td></tr>
                                <tr><td>Support Response — Low</td><td style={{ fontWeight: 600 }}>2 business days</td><td style={{ color: '#10b981', fontWeight: 600 }}>~1 day</td></tr>
                                <tr><td>Data Backup Frequency</td><td style={{ fontWeight: 600 }}>Daily</td><td style={{ color: '#10b981', fontWeight: 600 }}>Continuous</td></tr>
                                <tr><td>Data Retention</td><td style={{ fontWeight: 600 }}>Unlimited</td><td style={{ color: '#10b981', fontWeight: 600 }}>Unlimited</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <div className="chart-card-title">Security & Compliance</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
                            {[
                                { icon: '🔒', title: 'TLS 1.3 Encryption', desc: 'All data in transit encrypted' },
                                { icon: '🛡️', title: 'DDoS Protection', desc: 'Cloudflare always-on mitigation' },
                                { icon: '🌍', title: 'GDPR Compliant', desc: 'EU data protection standards' },
                                { icon: '📋', title: 'SOC 2 (Cloudflare)', desc: 'Infrastructure audit compliance' },
                                { icon: '🔑', title: 'API Key Auth', desc: 'Secure API access control' },
                                { icon: '💾', title: 'Daily Backups', desc: 'Automated D1 snapshots' },
                                { icon: '🗑️', title: 'Right to Erasure', desc: 'GDPR delete on request' },
                                { icon: '📊', title: 'Audit Logging', desc: 'Activity history on all records' },
                            ].map(item => (
                                <div key={item.title} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">Support Channels</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                            {[
                                { icon: '🎫', name: 'Support Tickets', desc: 'In-app ticket system with 4-hour SLA', avail: '24/7' },
                                { icon: '📚', name: 'Knowledge Base', desc: '18+ searchable help articles', avail: 'Self-serve' },
                                { icon: '💬', name: 'Live Chat', desc: 'Real-time messaging support', avail: 'Business hours' },
                                { icon: '📧', name: 'Email Support', desc: 'support@pipeline3d.com', avail: '24/7' },
                                { icon: '📱', name: 'Phone Support', desc: 'Priority callback for critical issues', avail: 'Business hours' },
                            ].map(ch => (
                                <div key={ch.name} style={{ flex: '1 1 180px', padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 20 }}>{ch.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{ch.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.desc}</div>
                                    <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, marginTop: 4 }}>{ch.avail}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* New Ticket Modal */}
            {showNewTicket && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNewTicket(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>📝 New Support Ticket</h3>
                            <button className="modal-close" onClick={() => setShowNewTicket(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input className="form-input" value={newTicket.subject} onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))} placeholder="Brief description of the issue" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="form-select" value={newTicket.priority} onChange={e => setNewTicket(t => ({ ...t, priority: e.target.value }))}>
                                    <option value="low">Low — general question</option>
                                    <option value="medium">Medium — feature issue</option>
                                    <option value="high">High — blocking problem</option>
                                    <option value="critical">Critical — system down</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea className="form-textarea" rows={5} value={newTicket.message} onChange={e => setNewTicket(t => ({ ...t, message: e.target.value }))} placeholder="Describe the issue, steps to reproduce, and expected behavior..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowNewTicket(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createTicket}>Submit Ticket</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
