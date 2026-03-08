import { useState, useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════
   Pipeline3D — Prospector (Outbound Lead Generation)
   - Lead Finder: search 400M+ profiles by industry/title/location
   - AI Chatbot: configurable website chatbot with lead capture
   - Live Chat: real-time visitor conversations
   ═══════════════════════════════════════════════════════════════ */

const INDUSTRIES = ['Construction', 'Commercial Real Estate', 'Healthcare', 'K-12 Education', 'Higher Education', 'Government', 'Manufacturing', 'Warehousing & Logistics', 'Financial Services', 'Hospitality', 'Retail', 'Technology', 'Property Management', 'Data Centers', 'Energy & Utilities'];
const JOB_TITLES = ['Facilities Manager', 'Security Director', 'IT Director', 'General Contractor', 'Project Manager', 'VP Operations', 'Director of Construction', 'Chief Technology Officer', 'Procurement Manager', 'Building Engineer', 'Property Manager', 'Campus Safety Director', 'IT Manager', 'Operations Director', 'Electrical Contractor'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+'];
const REGIONS = ['Sacramento / NorCal', 'Bay Area', 'Southern California', 'Houston / Texas', 'Austin / Central TX', 'Dallas / DFW', 'Phoenix / Arizona', 'Las Vegas / Nevada', 'Portland / Oregon', 'Denver / Colorado'];

const FIRST_NAMES = ['Sarah', 'James', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Marcus', 'Isabella', 'Lucas', 'Mia', 'Alexander', 'Charlotte', 'Daniel', 'Amelia', 'Michael', 'Harper', 'David', 'Evelyn', 'Joseph', 'Abigail', 'Chris', 'Emily', 'Ryan', 'Elizabeth', 'Kevin', 'Sofia', 'Brian'];
const LAST_NAMES = ['Chen', 'Patel', 'Williams', 'Torres', 'Kim', 'Johnson', 'Martinez', 'Anderson', 'Garcia', 'Lee', 'Brown', 'Wilson', 'Taylor', 'Thomas', 'Moore', 'Miller', 'Davis', 'Rodriguez', 'White', 'Harris', 'Clark', 'Lewis', 'Hall', 'Young', 'Walker', 'Allen', 'King', 'Wright', 'Scott', 'Green'];
const COMPANIES_DB = ['Apex Solutions', 'NovaTech Inc', 'Vanguard Systems', 'Meridian Group', 'Pinnacle Corp', 'Atlas Digital', 'Summit Partners', 'Catalyst Labs', 'Horizon Dynamics', 'Vertex Networks', 'Ironclad Security', 'Zenith Analytics', 'Frontier AI', 'Evergreen IT', 'Quantum Bridge', 'TrueNorth Systems', 'Pacific Rim Tech', 'Silver Oak Partners', 'Redline Automation', 'BlueShift Data'];
const DOMAINS = ['apexsol.com', 'novatech.io', 'vanguardsys.com', 'meridian-group.com', 'pinnaclecorp.net', 'atlasdigital.io', 'summitpartners.com', 'catalystlabs.ai', 'horizondyn.com', 'vertexnet.io', 'ironcladsc.com', 'zenith-analytics.com', 'frontier-ai.com', 'evergreen-it.com', 'quantumbridge.io', 'truenorthsys.com', 'pacificrimtech.com', 'silveroakp.com', 'redlineauto.io', 'blueshiftdata.com'];

function generateProspects(filters, count = 20) {
    const results = [];
    for (let i = 0; i < count; i++) {
        const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const ci = Math.floor(Math.random() * COMPANIES_DB.length);
        const title = filters.title || JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
        const industry = filters.industry || INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
        const size = filters.companySize || COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)];
        const region = filters.region || REGIONS[Math.floor(Math.random() * REGIONS.length)];
        const confidence = Math.floor(Math.random() * 30) + 70;
        results.push({
            id: Date.now() + i,
            name: `${fn} ${ln}`,
            title, industry,
            company: COMPANIES_DB[ci],
            email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${DOMAINS[ci]}`,
            phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            linkedin: `linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
            companySize: size,
            region,
            confidence,
            verified: confidence > 85,
        });
    }
    return results;
}

const CHATBOT_MESSAGES = [
    { from: 'bot', text: '👋 Hi there! Welcome to 3D Technology Services Inc. How can I help you today?', time: '2:30 PM' },
    { from: 'visitor', text: 'I need a quote for a network cabling project', time: '2:31 PM' },
    { from: 'bot', text: 'Great! I can help with that. To get you an accurate quote, I\'ll need a few details:\n\n1. 📍 Project location (city/state)\n2. 📐 Approximate square footage\n3. 🔌 Number of network drops needed\n4. 📅 Target completion date\n\nFeel free to share what you know!', time: '2:31 PM' },
    { from: 'visitor', text: 'Houston TX, about 15,000 sqft office, need around 120 drops, hoping to finish by end of April', time: '2:32 PM' },
    { from: 'bot', text: '✅ Got it! Based on your details:\n\n• 📍 Houston, TX\n• 📐 15,000 sq ft\n• 🔌 120 cat6 drops\n• 📅 Target: April 2026\n\nI\'m creating a lead for our Structured Cabling team right now. A specialist will reach out within 2 hours with a detailed proposal.\n\nWould you like to schedule a call or continue chatting?', time: '2:32 PM' },
];

const LIVE_CHATS = [
    {
        id: 1, visitor: 'Mike R.', email: 'mike@globalinc.com', page: '/services/cabling', status: 'active', unread: 2, lastMsg: 'Do you handle fiber optic installations?', time: '2m ago', messages: [
            { from: 'visitor', text: 'Hi, I saw your website. Do you handle fiber optic installations?', time: '3:15 PM' },
            { from: 'visitor', text: 'We need about 5000ft of single-mode fiber between two buildings', time: '3:16 PM' },
        ]
    },
    {
        id: 2, visitor: 'Jennifer K.', email: 'jk@techsolutions.com', page: '/contact', status: 'active', unread: 0, lastMsg: 'Perfect, I\'ll wait for the proposal', time: '8m ago', messages: [
            { from: 'visitor', text: 'Need CCTV and intrusion alarm system for our warehouse', time: '3:08 PM' },
            { from: 'agent', text: 'Hi Jennifer! I\'d be happy to help. How large is the warehouse?', time: '3:09 PM' },
            { from: 'visitor', text: 'About 40,000 sqft, need 24 cameras plus intrusion sensors on all entry points', time: '3:10 PM' },
            { from: 'agent', text: 'Got it. I\'m putting together a proposal with PTZ and fixed cameras plus a full intrusion panel. Should have it to you within an hour.', time: '3:11 PM' },
            { from: 'visitor', text: 'Perfect, I\'ll wait for the proposal', time: '3:12 PM' },
        ]
    },
    {
        id: 3, visitor: 'Unknown', email: '', page: '/services/das', status: 'waiting', unread: 1, lastMsg: 'Need a DAS system for our new building — no cell signal inside', time: '15m ago', messages: [
            { from: 'visitor', text: 'Need a DAS system for our new building — no cell signal inside', time: '3:01 PM' },
        ]
    },
];

export default function Prospector({ toast, contacts }) {
    const [tab, setTab] = useState('finder');
    const [prospects, setProspects] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [filters, setFilters] = useState({ industry: '', title: '', companySize: '', region: '', keyword: '' });
    const [savedLists, setSavedLists] = useState([
        { id: 1, name: 'IT Directors — Texas', count: 45, created: 'Mar 5' },
        { id: 2, name: 'Facility Managers — 200+ employees', count: 32, created: 'Mar 3' },
    ]);

    // Chatbot
    const [chatbotConfig, setChatbotConfig] = useState({
        greeting: '👋 Hi there! How can I help you today?',
        name: '3D Technology Services Assistant',
        color: '#0D9488',
        captureEmail: true,
        capturePhone: false,
        autoQualify: true,
        offlineMessage: 'We\'re currently offline. Leave your details and we\'ll get back to you!',
    });

    // Live chat
    const [chats, setChats] = useState(LIVE_CHATS);
    const [activeChat, setActiveChat] = useState(null);
    const [replyText, setReplyText] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat, chats]);

    const handleSearch = () => {
        setSearching(true);
        setTimeout(() => {
            setProspects(generateProspects(filters));
            setSearching(false);
            setSelected(new Set());
            toast(`Found ${20} prospects matching your criteria`);
        }, 1200);
    };

    const toggleSelect = (id) => {
        setSelected(s => {
            const n = new Set(s);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const selectAll = () => {
        if (selected.size === prospects.length) setSelected(new Set());
        else setSelected(new Set(prospects.map(p => p.id)));
    };

    const exportSelected = () => {
        if (selected.size === 0) { toast('Select prospects first', 'error'); return; }
        toast(`${selected.size} prospects exported to contacts!`);
    };

    const saveList = () => {
        if (prospects.length === 0) return;
        const name = prompt('Name this prospect list:');
        if (!name) return;
        setSavedLists(ls => [...ls, { id: Date.now(), name, count: prospects.length, created: 'Today' }]);
        toast('List saved!');
    };

    const sendReply = () => {
        if (!replyText.trim() || !activeChat) return;
        setChats(cs => cs.map(c => c.id === activeChat ? {
            ...c, messages: [...c.messages, { from: 'agent', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
            unread: 0, lastMsg: replyText, time: 'just now'
        } : c));
        setReplyText('');
    };

    const totalUnread = chats.reduce((s, c) => s + c.unread, 0);

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'finder' ? 'active' : ''}`} onClick={() => setTab('finder')}>
                    🔍 Lead Finder
                </button>
                <button className={`detail-tab ${tab === 'chatbot' ? 'active' : ''}`} onClick={() => setTab('chatbot')}>
                    🤖 AI Chatbot
                </button>
                <button className={`detail-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                    💬 Live Chat {totalUnread > 0 && <span className="tag tag-red" style={{ marginLeft: 6, fontSize: 10 }}>{totalUnread}</span>}
                </button>
            </div>

            {/* ═══ LEAD FINDER ═══ */}
            {tab === 'finder' && (
                <div>
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🔍 Prospect Database</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Search 400M+ professional profiles by industry, title, company size, and region</p>
                            </div>
                            {savedLists.length > 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{savedLists.length} saved lists</div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Industry</label>
                                <select className="form-select" value={filters.industry} onChange={e => setFilters(f => ({ ...f, industry: e.target.value }))}>
                                    <option value="">All Industries</option>
                                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Job Title</label>
                                <select className="form-select" value={filters.title} onChange={e => setFilters(f => ({ ...f, title: e.target.value }))}>
                                    <option value="">All Titles</option>
                                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Company Size</label>
                                <select className="form-select" value={filters.companySize} onChange={e => setFilters(f => ({ ...f, companySize: e.target.value }))}>
                                    <option value="">Any Size</option>
                                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Region</label>
                                <select className="form-select" value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
                                    <option value="">All Regions</option>
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Keyword</label>
                                <input className="form-input" placeholder="e.g. low voltage" value={filters.keyword} onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                                {searching ? '⏳ Searching...' : '🔍 Search Prospects'}
                            </button>
                            {prospects.length > 0 && (
                                <>
                                    <button className="btn btn-ghost" onClick={saveList}>💾 Save List</button>
                                    <button className="btn btn-ghost" onClick={exportSelected} disabled={selected.size === 0}>
                                        📤 Export {selected.size > 0 ? `(${selected.size})` : ''} to Contacts
                                    </button>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {prospects.length} results · {selected.size} selected
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {prospects.length > 0 && (
                        <div className="chart-card">
                            <div className="data-table-wrap" style={{ border: 'none' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>
                                                <input type="checkbox" checked={selected.size === prospects.length && prospects.length > 0} onChange={selectAll} />
                                            </th>
                                            <th>Name</th>
                                            <th>Title</th>
                                            <th>Company</th>
                                            <th>Industry</th>
                                            <th>Email</th>
                                            <th>Region</th>
                                            <th style={{ width: 60 }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prospects.map(p => (
                                            <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => toggleSelect(p.id)}>
                                                <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => { }} /></td>
                                                <td>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                                                    {p.verified && <span style={{ fontSize: 9, color: '#10b981' }}>✅ Verified</span>}
                                                </td>
                                                <td style={{ fontSize: 12 }}>{p.title}</td>
                                                <td>
                                                    <div style={{ fontSize: 13 }}>{p.company}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.companySize} employees</div>
                                                </td>
                                                <td style={{ fontSize: 12 }}>{p.industry}</td>
                                                <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{p.email}</td>
                                                <td style={{ fontSize: 12 }}>{p.region}</td>
                                                <td>
                                                    <span className={`tag ${p.confidence > 85 ? 'tag-green' : p.confidence > 75 ? 'tag-accent' : ''}`} style={{ fontSize: 11, fontWeight: 700 }}>
                                                        {p.confidence}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {prospects.length === 0 && !searching && (
                        <div className="chart-card">
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <h3>Find Your Next Customer</h3>
                                <p>Search our database of 400M+ professional profiles. Filter by industry, job title, company size, and region to find decision-makers who match your ideal customer profile.</p>
                            </div>

                            {savedLists.length > 0 && (
                                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📋 Saved Lists</h4>
                                    {savedLists.map(list => (
                                        <div key={list.id} className="automation-card" style={{ marginBottom: 4 }}>
                                            <div className="automation-card-header" style={{ cursor: 'pointer' }} onClick={() => { toast('Loading list...'); handleSearch(); }}>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{list.name}</span>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{list.count} prospects · {list.created}</span>
                                                </div>
                                                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSavedLists(ls => ls.filter(l => l.id !== list.id)); toast('List deleted'); }}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ AI CHATBOT ═══ */}
            {tab === 'chatbot' && (
                <div className="dashboard-grid">
                    <div>
                        <div className="chart-card" style={{ marginBottom: 12 }}>
                            <div className="chart-card-title">🤖 Chatbot Configuration</div>
                            <div className="form-group">
                                <label className="form-label">Bot Name</label>
                                <input className="form-input" value={chatbotConfig.name} onChange={e => setChatbotConfig(c => ({ ...c, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Greeting Message</label>
                                <textarea className="form-textarea" rows={2} value={chatbotConfig.greeting} onChange={e => setChatbotConfig(c => ({ ...c, greeting: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Offline Message</label>
                                <textarea className="form-textarea" rows={2} value={chatbotConfig.offlineMessage} onChange={e => setChatbotConfig(c => ({ ...c, offlineMessage: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Theme Color</label>
                                <input type="color" value={chatbotConfig.color} onChange={e => setChatbotConfig(c => ({ ...c, color: e.target.value }))} style={{ width: 60, height: 32, border: 'none', cursor: 'pointer' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                {[
                                    { key: 'captureEmail', label: 'Capture visitor email' },
                                    { key: 'capturePhone', label: 'Capture visitor phone' },
                                    { key: 'autoQualify', label: 'Auto-qualify leads (AI)' },
                                ].map(opt => (
                                    <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                        <div className={`automation-toggle ${chatbotConfig[opt.key] ? 'on' : ''}`}
                                            onClick={() => setChatbotConfig(c => ({ ...c, [opt.key]: !c[opt.key] }))}>
                                            <div className="automation-toggle-thumb" />
                                        </div>
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-card-title">📊 Chatbot Stats</div>
                            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                <div className="kpi-card" style={{ padding: '10px 14px' }}>
                                    <div className="kpi-label" style={{ fontSize: 10 }}>Conversations</div>
                                    <div className="kpi-value" style={{ fontSize: 22 }}>247</div>
                                    <div className="kpi-sub" style={{ color: '#10b981' }}>↑ 18% this week</div>
                                </div>
                                <div className="kpi-card" style={{ padding: '10px 14px' }}>
                                    <div className="kpi-label" style={{ fontSize: 10 }}>Leads Captured</div>
                                    <div className="kpi-value" style={{ fontSize: 22, color: '#10b981' }}>38</div>
                                    <div className="kpi-sub">15.4% conversion</div>
                                </div>
                                <div className="kpi-card" style={{ padding: '10px 14px' }}>
                                    <div className="kpi-label" style={{ fontSize: 10 }}>Avg. Response Time</div>
                                    <div className="kpi-value" style={{ fontSize: 22 }}>1.2s</div>
                                    <div className="kpi-sub">AI-powered</div>
                                </div>
                                <div className="kpi-card" style={{ padding: '10px 14px' }}>
                                    <div className="kpi-label" style={{ fontSize: 10 }}>Satisfaction</div>
                                    <div className="kpi-value" style={{ fontSize: 22, color: '#f59e0b' }}>4.6★</div>
                                    <div className="kpi-sub">from 89 ratings</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="chart-card">
                        <div className="chart-card-title">💬 Live Preview</div>
                        <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden', maxWidth: 360, margin: '0 auto' }}>
                            {/* Chat header */}
                            <div style={{ padding: '12px 16px', background: chatbotConfig.color, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{chatbotConfig.name}</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>● Online now</div>
                                </div>
                            </div>
                            {/* Messages */}
                            <div style={{ padding: 12, height: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {CHATBOT_MESSAGES.map((msg, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'visitor' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                                            background: msg.from === 'visitor' ? chatbotConfig.color : 'var(--bg-hover)',
                                            color: msg.from === 'visitor' ? '#fff' : 'var(--text-primary)',
                                            fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line'
                                        }}>
                                            {msg.text}
                                            <div style={{ fontSize: 10, opacity: 0.6, textAlign: 'right', marginTop: 4 }}>{msg.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Input */}
                            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                <input style={{ flex: 1, background: 'var(--bg-hover)', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)' }} placeholder="Type a message..." readOnly />
                                <button style={{ width: 36, height: 36, borderRadius: '50%', background: chatbotConfig.color, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>➤</button>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(`<script src="https://pipeline3d.pages.dev/chatbot.js" data-color="${chatbotConfig.color}" data-name="${chatbotConfig.name}"></script>`); toast('Embed code copied!'); }}>
                                📋 Copy Embed Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ LIVE CHAT ═══ */}
            {tab === 'chat' && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 200px)', minHeight: 500 }}>
                    {/* Chat list */}
                    <div className="chart-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                Active Conversations ({chats.filter(c => c.status === 'active').length})
                            </h4>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {chats.map(chat => (
                                <div key={chat.id} onClick={() => setActiveChat(chat.id)} style={{
                                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                                    background: activeChat === chat.id ? 'var(--bg-hover)' : 'transparent',
                                    borderLeft: `3px solid ${chat.status === 'waiting' ? '#f59e0b' : chat.unread > 0 ? '#3b82f6' : 'transparent'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700
                                            }}>
                                                {chat.visitor.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{chat.visitor}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{chat.page}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{chat.time}</div>
                                            {chat.unread > 0 && <span className="tag tag-accent" style={{ fontSize: 9, marginTop: 2 }}>{chat.unread}</span>}
                                            {chat.status === 'waiting' && <span className="tag" style={{ fontSize: 9, background: '#f59e0b22', color: '#f59e0b' }}>Waiting</span>}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.lastMsg}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat window */}
                    {activeChat ? (() => {
                        const chat = chats.find(c => c.id === activeChat);
                        if (!chat) return null;
                        return (
                            <div className="chart-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Header */}
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{chat.visitor}</h4>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chat.email || 'No email'} · Viewing: {chat.page}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { toast('Lead created from chat!'); }}>👤 Create Lead</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setChats(cs => cs.filter(c => c.id !== activeChat)); setActiveChat(null); toast('Chat closed'); }}>✕ Close</button>
                                    </div>
                                </div>
                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {chat.messages.map((msg, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'visitor' ? 'flex-start' : 'flex-end' }}>
                                            <div style={{
                                                maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                                                background: msg.from === 'visitor' ? 'var(--bg-hover)' : '#0D9488',
                                                color: msg.from === 'visitor' ? 'var(--text-primary)' : '#fff',
                                                fontSize: 13, lineHeight: 1.5
                                            }}>
                                                {msg.text}
                                                <div style={{ fontSize: 10, opacity: 0.6, textAlign: 'right', marginTop: 4 }}>
                                                    {msg.from === 'agent' ? '✓ You' : chat.visitor} · {msg.time}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                {/* Reply input */}
                                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                    <input className="form-input" style={{ flex: 1 }} placeholder="Type your reply..." value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendReply()} />
                                    <button className="btn btn-primary" onClick={sendReply}>Send</button>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="empty-state">
                                <div className="empty-state-icon">💬</div>
                                <h3>Select a Conversation</h3>
                                <p>Click a chat on the left to start responding to visitors.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
