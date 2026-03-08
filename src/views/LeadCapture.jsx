import { useState } from 'react';

const FORM_FIELDS = [
    { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Smith' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@company.com' },
    { key: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '(555) 123-4567' },
    { key: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Acme Corp' },
    { key: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'Tell us about your project…' },
];

export default function LeadCapture({ toast, refreshDeals, refreshContacts }) {
    const [tab, setTab] = useState('form');
    const [submissions, setSubmissions] = useState([
        { id: 1, name: 'Sarah Johnson', email: 'sarah@techcorp.com', company: 'TechCorp', message: 'Need a quote for access control & camera system — new office build, 25 doors, 40 cameras', date: 'Mar 5', status: 'new' },
        { id: 2, name: 'Mike Chen', email: 'mike@globalinc.com', company: 'Global Inc', message: 'Looking for structured cabling bid — 200 Cat6A drops, 2-story office, Sacramento area', date: 'Mar 3', status: 'contacted' },
    ]);
    const [formConfig, setFormConfig] = useState({
        title: 'Get in Touch',
        subtitle: 'Fill out the form below and our team will reach out within 24 hours.',
        buttonText: 'Submit',
        successMessage: 'Thank you! We\'ll be in touch soon.',
        redirectUrl: '',
        notifyEmail: '',
        autoCreateDeal: true,
        autoCreateContact: true,
        defaultPipeline: 'Sales Pipeline',
        defaultStage: 'Lead In',
    });
    const [showEmbed, setShowEmbed] = useState(false);

    const promoteToContact = async (sub) => {
        setSubmissions(ss => ss.map(s => s.id === sub.id ? { ...s, status: 'converted' } : s));
        toast(`${sub.name} promoted to contact!`);
    };

    const markContacted = (id) => {
        setSubmissions(ss => ss.map(s => s.id === id ? { ...s, status: 'contacted' } : s));
        toast('Marked as contacted');
    };

    const dismissLead = (id) => {
        setSubmissions(ss => ss.filter(s => s.id !== id));
        toast('Lead dismissed');
    };

    const embedCode = `<!-- Pipeline3D Lead Capture Form -->
<iframe
  src="${window.location.origin}/lead-form"
  style="width:100%;max-width:480px;height:560px;border:none;border-radius:12px;"
  title="Contact Form"
></iframe>`;

    const statusColor = { new: '#3b82f6', contacted: '#f59e0b', converted: '#10b981' };

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>📝 Form Builder</button>
                <button className={`detail-tab ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>📥 Submissions ({submissions.length})</button>
                <button className={`detail-tab ${tab === 'embed' ? 'active' : ''}`} onClick={() => setTab('embed')}>🔗 Embed / Share</button>
            </div>

            {tab === 'form' && (
                <div className="dashboard-grid">
                    {/* Form Preview */}
                    <div className="chart-card">
                        <div className="chart-card-title">Live Preview</div>
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{formConfig.title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{formConfig.subtitle}</p>
                            {FORM_FIELDS.map(f => (
                                <div className="form-group" key={f.key} style={{ marginBottom: 12 }}>
                                    <label className="form-label">{f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea className="form-textarea" placeholder={f.placeholder} style={{ minHeight: 80 }} readOnly />
                                    ) : (
                                        <input className="form-input" type={f.type} placeholder={f.placeholder} readOnly />
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>{formConfig.buttonText}</button>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div>
                        <div className="chart-card" style={{ marginBottom: 12 }}>
                            <div className="chart-card-title">Form Settings</div>
                            <div className="form-group">
                                <label className="form-label">Form Title</label>
                                <input className="form-input" value={formConfig.title} onChange={e => setFormConfig(c => ({ ...c, title: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subtitle</label>
                                <input className="form-input" value={formConfig.subtitle} onChange={e => setFormConfig(c => ({ ...c, subtitle: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Button Text</label>
                                <input className="form-input" value={formConfig.buttonText} onChange={e => setFormConfig(c => ({ ...c, buttonText: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Success Message</label>
                                <input className="form-input" value={formConfig.successMessage} onChange={e => setFormConfig(c => ({ ...c, successMessage: e.target.value }))} />
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="chart-card-title">Automation</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                    <div className={`automation-toggle ${formConfig.autoCreateContact ? 'on' : ''}`}
                                        onClick={() => setFormConfig(c => ({ ...c, autoCreateContact: !c.autoCreateContact }))}>
                                        <div className="automation-toggle-thumb" />
                                    </div>
                                    Auto-create Contact from submission
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                    <div className={`automation-toggle ${formConfig.autoCreateDeal ? 'on' : ''}`}
                                        onClick={() => setFormConfig(c => ({ ...c, autoCreateDeal: !c.autoCreateDeal }))}>
                                        <div className="automation-toggle-thumb" />
                                    </div>
                                    Auto-create Deal in "{formConfig.defaultStage}"
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'submissions' && (
                <div>
                    <div className="section-header" style={{ marginBottom: 12 }}>
                        <h3>{submissions.filter(s => s.status === 'new').length} new leads</h3>
                    </div>
                    <div className="automation-list">
                        {submissions.map(sub => (
                            <div className="automation-card" key={sub.id}>
                                <div className="automation-card-header" style={{ cursor: 'default' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: statusColor[sub.status]
                                        }}>
                                            {sub.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub.email} · {sub.company || '—'}</div>
                                            {sub.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>"{sub.message}"</div>}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`tag`} style={{ background: statusColor[sub.status] + '22', color: statusColor[sub.status], textTransform: 'capitalize' }}>
                                                {sub.status}
                                            </span>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub.date}</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    {sub.status === 'new' && <button className="btn btn-ghost btn-sm" onClick={() => markContacted(sub.id)}>📞 Mark Contacted</button>}
                                    {sub.status !== 'converted' && <button className="btn btn-primary btn-sm" onClick={() => promoteToContact(sub)}>👤 Promote to Contact</button>}
                                    <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => dismissLead(sub.id)}>Dismiss</button>
                                </div>
                            </div>
                        ))}
                        {submissions.length === 0 && (
                            <div className="empty-state"><div className="empty-state-icon">📥</div><h3>No submissions yet</h3><p>Embed your form on your website to capture leads.</p></div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'embed' && (
                <div className="dashboard-grid">
                    <div className="chart-card">
                        <div className="chart-card-title">📋 Embed Code</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Copy this code and paste it into your website's HTML to display the lead capture form.
                        </p>
                        <div style={{
                            background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: 12,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid var(--border)', lineHeight: 1.6
                        }}>
                            {embedCode}
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { navigator.clipboard.writeText(embedCode); toast('Copied!'); }}>
                            📋 Copy to Clipboard
                        </button>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">🔗 Direct Link</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Share this link directly with prospects:
                        </p>
                        <div style={{
                            background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13,
                            fontFamily: 'monospace', border: '1px solid var(--border)'
                        }}>
                            {window.location.origin}/lead-form
                        </div>
                        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/lead-form`); toast('Link copied!'); }}>
                            Copy Link
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
