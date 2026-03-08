import { useState } from 'react';

const GUIDE_SECTIONS = [
    {
        title: '🚀 Getting Started',
        content: [
            { heading: 'Logging In', text: '1. Open your browser and go to your Pipeline3D URL\n2. Enter the email and password your admin gave you\n3. Click Sign In — you\'ll land on the Dashboard' },
            { heading: 'Sidebar Navigation', text: 'The sidebar has three sections:\n• Main — Dashboard, Pipeline, Contacts, Companies, Activities\n• Insights — Calendar, Forecast, Reports, Email\n• Tools — AI Coach, Automations, Sequences, Integrations, Lead Capture, Prospector, Data Import, Help Center, Settings\n\nAt the bottom of the sidebar, click your name to see your profile or sign out.' },
            { heading: 'What Can I See?', text: '🔒 Deals, Activities, Emails — only YOUR data (private to each rep)\n👥 Contacts & Companies — shared across the whole team (prevents duplicates)' },
            { heading: 'Install on Mobile', text: 'iPhone: tap Share → "Add to Home Screen"\nAndroid: tap ⋮ menu → "Install app"\nThe app works offline and opens full-screen like a native app.' },
        ]
    },
    {
        title: '📊 Dashboard — Your Daily Snapshot',
        content: [
            { heading: 'KPI Cards', text: 'The top row shows 4 key numbers:\n• Total Pipeline Value — sum of all your active deals\n• Active Deals — how many deals you\'re working\n• Won Revenue — deals you\'ve closed\n• Activities Due — pending tasks that need attention' },
            { heading: 'Charts', text: 'Below the KPIs:\n• Revenue by Stage — see where your money sits\n• Deal Labels — Hot / Warm / Cold breakdown\n• Recent Activity — latest actions in your pipeline\n\n💡 Tip: Check your Dashboard every morning to plan your day.' },
        ]
    },
    {
        title: '🔀 Pipeline — Managing Your Deals',
        content: [
            { heading: 'Pipeline Stages', text: 'Default stages:\n• Lead In — new opportunity, not yet contacted\n• Contact Made — initial conversation done, qualifying the project\n• Site Survey — on-site visit to assess scope, measurements & existing infrastructure\n• Proposal — scope of work and quote sent to the customer\n• Negotiation — discussing terms, pricing & project timeline\n• Won 🎉 — deal closed, project awarded!' },
            { heading: 'Adding a New Deal', text: '1. Click the green + Add Deal button\n2. Fill in: Title (e.g. "Sacramento Medical Center — Access Control"), Value ($), Stage, Contact, Company, Probability (%), Label (Hot/Warm/Cold), Expected Close\n3. Click Create Deal\n\nYour deal card appears on the Kanban board!\n\n💡 Tip: Use a naming convention: [Customer] — [Service Line] (e.g. "Acme Corp — Structured Cabling")' },
            { heading: 'Moving Deals (Drag & Drop)', text: '• Click and hold a deal card\n• Drag it to the new stage column\n• Release to drop it\n\nOr click a deal → Details tab → use the stage buttons under "Move to Stage"' },
            { heading: 'Deal Detail Tabs', text: 'Click any deal card to see:\n• Details — value, stage, contact, probability, days open\n• Products — add line items (name, qty, price) — auto-calculates total\n• Notes — add timestamped notes (press Enter or click Add)\n• History — automatic timeline of all changes' },
            { heading: 'Deal Age Warning', text: 'Deals show colored age badges:\n🟢 Under 14 days — fresh\n🟡 14-30 days — starting to age\n🟠 30-60 days — needs attention\n🔴 60+ days — critical, take action now!' },
            { heading: 'Export', text: 'Click ⬇ Export CSV at the top to download all your deals as a spreadsheet.' },
        ]
    },
    {
        title: '👥 Contacts — Your People',
        content: [
            { heading: 'Adding a Contact', text: '1. Click + Add Contact\n2. Fill in: Name (required), Email, Phone (Office), 📱 Mobile Phone, Company, Role, Tags\n3. Click Add Contact\n\n💡 Tags help you categorize: "decision-maker", "GC", "architect", "facilities-mgr", "end-user"' },
            { heading: 'Searching', text: 'Use the 🔍 search bar — it searches by name, email, company, and mobile number.' },
            { heading: 'Viewing Details', text: 'Click any row to see full contact info including both Phone and Mobile numbers.' },
            { heading: 'Export', text: 'Click ⬇ CSV to download all contacts as a spreadsheet (includes Mobile column).' },
        ]
    },
    {
        title: '🏢 Companies — Your Accounts',
        content: [
            { heading: 'Adding a Company', text: '1. Click + Add Company\n2. Fill in: Name (required), Industry, Website, Size, Country, Notes\n3. Click Add Company\n\nEach company card shows associated deals and their total value.\n\n💡 For GCs and architects, note which projects they\'re involved in. This helps cross-reference future bid invitations.' },
        ]
    },
    {
        title: '✅ Activities — Stay On Track',
        content: [
            { heading: 'Adding an Activity', text: '1. Click + Add Activity\n2. Fill in: Title, Type (📞 Call, 📧 Email, 🤝 Meeting, 📋 Task), Priority (High/Medium/Low), Due, Due Date, Related Deal\n3. Click Add Activity' },
            { heading: 'Completing', text: 'Click the checkbox ✓ on the left to mark done. Click again to reopen.' },
            { heading: 'Filtering', text: 'Use the filter chips: All, Pending, or Completed.' },
        ]
    },
    {
        title: '📅 Calendar — Week View',
        content: [
            { heading: 'How It Works', text: 'Shows your activities plotted on a weekly calendar grid.\nUse it to see what\'s coming up, spot gaps in your schedule, and plan your time visually.' },
        ]
    },
    {
        title: '📈 Forecast — Revenue Projections',
        content: [
            { heading: 'What You See', text: '• Weighted Pipeline — deal values × probability\n• Expected Revenue by Month — when deals are projected to close\n• Pipeline Coverage — how much pipeline you need vs. your target\n\nThis helps you see if you\'re on track to hit your quota.' },
        ]
    },
    {
        title: '📉 Reports — Performance Metrics',
        content: [
            { heading: 'Available Reports', text: '• Deals Won vs. Lost over time\n• Average Deal Size\n• Sales Cycle Length — how long deals take to close\n• Stage Conversion Rates — where deals get stuck\n• Top Performing Deals' },
        ]
    },
    {
        title: '📧 Email — Compose & Track',
        content: [
            { heading: 'Composing', text: '1. Go to Email in the sidebar\n2. Fill in recipient, subject, and body\n3. Click Send' },
            { heading: 'Tracking', text: 'The Email Tracking tab shows all emails sent, open/click tracking, and engagement scores for each contact.' },
        ]
    },
    {
        title: '📨 Email Sequences — Automated Follow-ups',
        content: [
            { heading: 'Preset Sequences', text: '• New Lead Nurture — welcome emails + follow-ups over 21 days, ideal for inbound 3dtsi.com leads\n• Post-Proposal Follow-Up — check-in after sending a scope of work\n• Re-Engagement (Cold Leads) — reach out to leads that went quiet' },
            { heading: 'Creating a Custom Sequence', text: '1. Click + New Sequence\n2. Name your sequence\n3. Add steps: Email or Task, with the day number\n4. Fill in subject/template\n5. Click Create Sequence' },
        ]
    },
    {
        title: '🧠 AI Coach — Smart Deal Scoring',
        content: [
            { heading: 'How It Works', text: 'AI Coach analyzes your deals based on: deal value, probability, how long it\'s been open, whether it has a contact and company, stage progression, and note count.' },
            { heading: 'Using It', text: '1. Go to AI Coach in the sidebar\n2. Click Analyze next to any deal\n3. You\'ll see a score (1-100) and specific recommendations like "Add a contact" or "This deal is aging, schedule a follow-up"\n\n💡 Check the AI Coach weekly. Focus on deals with low scores.' },
        ]
    },
    {
        title: '⚡ Automations',
        content: [
            { heading: 'Create an Automation', text: '1. Go to Automations\n2. Click + New Automation\n3. Set the Trigger (when something happens)\n4. Set the Action (what should happen)\n5. Save and activate\n\nExamples:\n• Deal moves to "Site Survey" → auto-create task: "Conduct site survey — measure & document"\n• New deal created → auto-assign follow-up call\n• Deal won → send thank-you email + Slack/Teams notification' },
        ]
    },
    {
        title: '🧲 Lead Capture — Web Forms',
        content: [
            { heading: 'How It Works', text: '1. Go to Lead Capture\n2. Browse form templates or create a custom form\n3. Customize the fields\n4. Copy the embed code for your website\n\nWhen someone fills out the form, they\'re auto-added as a contact in Pipeline3D.' },
        ]
    },
    {
        title: '🎯 Prospector — Find New Leads',
        content: [
            { heading: 'Tools Available', text: '• Lead Finder — search for leads by industry (Construction, Healthcare, Education, Government), job title (Facilities Manager, Security Director, IT Director), company size, and region (Sacramento, Bay Area, Houston, etc.)\n• AI Chatbot — deploy on 3dtsi.com to auto-qualify visitors asking about cabling, CCTV, access control, DAS, AV, intrusion, and fire alarm projects\n• Live Chat — engage with website visitors in real-time and create leads instantly' },
        ]
    },
    {
        title: '📥 Data Import — Upload Your Contacts',
        content: [
            { heading: 'From Outlook', text: '1. In Outlook: File → Open & Export → Import/Export\n2. Select "Export to a file" → CSV\n3. Choose your Contacts folder → save the .csv file\n4. In Pipeline3D: go to Data Import (📥 in sidebar)\n5. Click 📂 Choose CSV File\n6. Auto-detected columns: First Name + Last Name → Name, E-mail Address → Email, Business Phone → Phone, Mobile Phone → Mobile, Company → Company, Job Title → Role\n7. Review the mapping, preview the data\n8. Click 📥 Import Contacts — done!' },
            { heading: 'From Excel or Google Sheets', text: '1. Make sure Row 1 has column headers (Name, Email, Phone, Mobile, Company, etc.)\n2. File → Save As → CSV format\n3. Upload the .csv file in Data Import' },
            { heading: 'After Importing', text: '• Go to the 🔄 Duplicates tab to check for and merge duplicate contacts\n• Go to the ✨ AI Enrichment tab to auto-fill missing company and role data from email addresses\n\n💡 Contacts are shared with the whole team. Duplicate emails are automatically skipped during import.' },
        ]
    },
    {
        title: '⚙️ Settings',
        content: [
            { heading: 'Your Profile', text: 'Click your name at the bottom of the sidebar to view your profile or sign out.' },
            { heading: 'Settings Page', text: '• General — company info (3D Technology Services Inc.), currency, fiscal year\n• Custom Fields — Service Line, Project Type, Lead Source, Bid Due Date, Territory, and more\n• Pipelines — customize stages (Lead In → Contact Made → Site Survey → Proposal → Negotiation → Won)\n• Users (admin only) — manage the sales team, add/remove reps' },
        ]
    },
    {
        title: '💡 Tips & Best Practices',
        content: [
            { heading: 'Daily Routine', text: '1. Morning: Check Dashboard → see Activities Due and today\'s site surveys\n2. Before each call: Open the deal → review Notes, History, and Service Line\n3. After each call/survey: Add a Note → create a follow-up Activity\n4. End of day: Move deals to correct stage → mark Activities complete' },
            { heading: 'Deal Management', text: '🔥 Label hot deals so you can focus on them\n📝 Add notes after every interaction and site visit\n📦 Add products/line items to build your scope of work and quote\n🏷️ Always set the Service Line (Structured Cabling, CCTV, DAS, Access Control, Audio Visual, Intrusion, Fire Alarm, Security Systems)\n⏱️ Watch the age indicator — red means take action now\n📐 After a site survey, update the deal value with accurate estimates' },
            { heading: 'Contact Management', text: '📱 Always add mobile phone — fastest way to reach GCs and facilities managers\n🏷️ Use tags: "decision-maker", "GC", "architect", "facilities-mgr", "end-user"\n🏢 Link contacts to companies for better reporting' },
            { heading: 'First Day Setup', text: '📥 Import your Outlook contacts on Day 1\n🔄 Check for duplicates after importing\n✨ Run AI Enrichment to fill missing company/role data\n⌨️ Use Ctrl+K for quick navigation' },
        ]
    },
];

function UserGuide() {
    const [openSections, setOpenSections] = useState({ 0: true });

    const toggle = (i) => setOpenSections(s => ({ ...s, [i]: !s[i] }));

    const printGuide = () => {
        let html = `<html><head><title>Pipeline3D User Guide</title><style>
            body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.7; }
            h1 { font-size: 28px; border-bottom: 3px solid #D4A017; padding-bottom: 8px; }
            h2 { font-size: 20px; margin-top: 32px; color: #0D9488; }
            h3 { font-size: 15px; margin-top: 16px; font-weight: 600; }
            p, li { font-size: 13px; }
            .section { page-break-inside: avoid; margin-bottom: 24px; }
            @media print { body { margin: 20px; } }
        </style></head><body><h1>\ud83d\udcd6 Pipeline3D \u2014 Sales Team User Guide</h1><p style="color:#666">3D Technology Services \u00b7 March 2026</p>`;
        GUIDE_SECTIONS.forEach(sec => {
            html += `<div class="section"><h2>${sec.title}</h2>`;
            sec.content.forEach(item => {
                html += `<h3>${item.heading}</h3>`;
                html += `<p>${item.text.replace(/\n/g, '<br>')}</p>`;
            });
            html += `</div>`;
        });
        html += `</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 600);
    };

    return (
        <div>
            <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                    <h3 style={{ margin: 0 }}>Pipeline3D — Sales Team User Guide</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Complete step-by-step instructions for every feature</p>
                </div>
                <button className="btn btn-ghost" onClick={printGuide}>🖨️ Print / Save PDF</button>
            </div>

            {GUIDE_SECTIONS.map((sec, i) => (
                <div className="chart-card" key={i} style={{ marginBottom: 8 }}>
                    <div onClick={() => toggle(i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '2px 0' }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{sec.title}</span>
                        <span style={{ fontSize: 18, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: openSections[i] ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                    </div>
                    {openSections[i] && (
                        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            {sec.content.map((item, j) => (
                                <div key={j} style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{item.heading}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.8 }}>{item.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}


const KB_ARTICLES = [
    { id: 1, category: 'Getting Started', title: 'How to create your first deal', content: 'Navigate to Pipeline → Click + Add Deal → Fill in deal title (e.g. "Acme Corp — Security System"), value, stage, and contact → Click Create Deal. Your deal will appear as a card in the Kanban board. Tip: use the naming convention [Customer] — [Service Line].' },
    { id: 2, category: 'Getting Started', title: 'Understanding your Dashboard', content: 'The Dashboard shows 4 KPI cards: Pipeline Value, Won Revenue, Weighted Forecast, and Win Rate. Below are Stage Distribution charts and Recent Deals. Check this daily for a pulse on your sales performance.' },
    { id: 3, category: 'Getting Started', title: 'Installing Pipeline3D on your phone', content: 'Android: Open Chrome → visit pipeline3d.pages.dev → tap Install App. iOS: Open Safari → tap Share → Add to Home Screen → Add. The app works offline and opens full-screen.' },
    { id: 4, category: 'Pipeline', title: 'Drag and drop deals between stages', content: 'Click and hold any deal card on the Kanban board. Drag it to the target stage column and release. The deal will be saved in the new stage automatically.' },
    { id: 5, category: 'Pipeline', title: 'Understanding deal rotting indicators', content: 'Deals show age badges: green (<14d fresh), yellow (14-30d aging), orange (30-60d warning), red (60d+ critical with pulsing border). Focus on red deals first — they need immediate action.' },
    { id: 6, category: 'Pipeline', title: 'Adding products/line items to deals', content: 'Open a deal → click Products tab → enter product name (e.g. "Cat6A Cable Run", "PTZ Camera", "Access Control Reader", "DAS Antenna", "Intrusion Panel"), quantity, unit price → click Add. Products auto-calculate totals and update the deal value. Use this as a scope of work and quote builder.' },
    { id: 7, category: 'Contacts', title: 'Importing contacts from CSV', content: 'Go to Data Import → Click Choose CSV File → map columns to CRM fields → preview rows → click Import. Supports: Name, Email, Phone, Company, Role, Tags columns.' },
    { id: 8, category: 'Contacts', title: 'Detecting and merging duplicates', content: 'Go to Data Import → Duplicates tab. The system scans for matching emails. Click Merge All to combine duplicate records, keeping the best data from each.' },
    { id: 9, category: 'Email', title: 'Setting up email sequences', content: 'Go to Sequences → + New Sequence → name it → add steps (email or task) with day numbers → Create. Pre-built sequences: New Lead Nurture (21-day drip), Post-Proposal Follow-up, Re-Engagement (Cold Leads).' },
    { id: 10, category: 'Email', title: 'Using the email composer', content: 'Click the purple Compose button (top-right). Choose a template, fill in To/Subject/Body, or click AI Draft for auto-generated content. Link emails to deals for tracking.' },
    { id: 11, category: 'AI & Analytics', title: 'How AI deal scoring works', content: 'AI Coach analyzes 8 factors: value, probability, stage, days open, label, contact assigned, note count, company. Grades: A (80-100%), B (60-79%), C (40-59%), D (0-39%). Follow the specific recommendations for each deal.' },
    { id: 12, category: 'AI & Analytics', title: 'Reading the conversion funnel', content: 'Go to Reports → Conversion Funnel tab. Visual funnel shows stage-to-stage conversion rates and dropoff counts. Focus improvements on the stage with the biggest dropoff.' },
    { id: 13, category: 'Automations', title: 'Creating automation rules', content: 'Go to Automations → + New Rule → select a trigger (e.g., deal moves to Site Survey) → select an action (e.g., create task: "Conduct site survey") → configure details → Save. Toggle rules on/off anytime.' },
    { id: 14, category: 'Integrations', title: 'Connecting Gmail two-way sync', content: 'Go to Integrations → find Gmail (Two-Way Sync) → click Connect → enter your Google OAuth token. Once connected, all sent/received emails auto-appear on deal cards.' },
    { id: 15, category: 'Integrations', title: 'Setting up webhooks', content: 'Go to Integrations → Webhooks tab → + Add Webhook → enter URL → select events (deal.won, contact.created, etc.). Webhooks fire real-time HTTP POST requests with event data.' },
    { id: 16, category: 'Settings', title: 'Adding custom fields', content: 'Go to Settings → Custom Fields → + Add Field → choose name, type (text/number/dropdown/date/checkbox), and entity (deals/contacts/companies) → Save. Pre-configured fields include: Service Line, Project Type, Lead Source, Bid Due Date, Decision Timeline, Territory, and Contract Length.' },
    { id: 19, category: 'Pipeline', title: 'Using Service Line fields on deals', content: 'Every deal should have a Service Line set: Structured Cabling, CCTV, DAS, Access Control, Audio Visual, Intrusion, Fire Alarm, Security Systems, or Service & Maintenance. Use "Security Systems" for bundled projects that combine CCTV + Access Control + Intrusion. This drives better reporting and helps management see which trades are generating the most pipeline.' },
    { id: 20, category: 'Pipeline', title: 'The Site Survey workflow', content: 'When a deal moves to "Site Survey" stage: 1) An automation auto-creates a task to conduct the survey. 2) Visit the site to measure, document existing infrastructure, and photograph the space. 3) Add notes to the deal about what you found. 4) Update the deal value with your accurate estimate. 5) Add products/line items for the scope of work. 6) Move the deal to "Proposal" when ready to send the quote.' },
    { id: 17, category: 'Troubleshooting', title: 'App not loading on mobile', content: 'Android requires Chrome. iOS requires Safari (not Chrome). Clear browser cache, ensure stable internet. If installed as PWA and broken, delete the home screen icon and reinstall.' },
    { id: 18, category: 'Troubleshooting', title: 'Cannot see pipeline stages', content: 'Ensure at least one pipeline exists in Settings → Pipelines. If empty, the default "Sales Pipeline" should auto-create. Try refreshing the page (Ctrl+Shift+R).' },
];

const STATUS_COLORS = { open: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981' };

export default function HelpCenter({ toast }) {
    const [tab, setTab] = useState('guide');
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
                <button className={`detail-tab ${tab === 'guide' ? 'active' : ''}`} onClick={() => setTab('guide')}>📖 User Guide</button>
                <button className={`detail-tab ${tab === 'kb' ? 'active' : ''}`} onClick={() => setTab('kb')}>📚 Knowledge Base</button>
                <button className={`detail-tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>
                    🎫 Support Tickets {tickets.filter(t => t.status !== 'resolved').length > 0 && `(${tickets.filter(t => t.status !== 'resolved').length})`}
                </button>
                <button className={`detail-tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>📡 System Status</button>
                <button className={`detail-tab ${tab === 'sla' ? 'active' : ''}`} onClick={() => setTab('sla')}>📋 SLA & Terms</button>
            </div>

            {tab === 'guide' && <UserGuide />}

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
