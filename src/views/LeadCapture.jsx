import { useState } from 'react';

const DEFAULT_FIELDS = [
    { id: 'f1', key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Smith' },
    { id: 'f2', key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@company.com' },
    { id: 'f3', key: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '(555) 123-4567' },
    { id: 'f4', key: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Acme Corp' },
    { id: 'f5', key: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'Tell us about your project…' },
];

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Dropdown' },
];

let fieldCounter = 10;

export default function LeadCapture({ toast, refreshDeals, refreshContacts }) {
    const [tab, setTab] = useState('form');
    const [fields, setFields] = useState(DEFAULT_FIELDS);
    const [editingField, setEditingField] = useState(null);
    const [submissions, setSubmissions] = useState([
        { id: 1, name: 'Sarah Johnson', email: 'sarah@techcorp.com', company: 'TechCorp', message: 'Need a quote for CCTV, access control & intrusion — new office build, 25 doors, 40 cameras, perimeter alarm', date: 'Mar 5', status: 'new' },
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

    const addField = () => {
        fieldCounter++;
        const newField = {
            id: 'f' + fieldCounter,
            key: 'field_' + fieldCounter,
            label: 'New Field',
            type: 'text',
            required: false,
            placeholder: 'Enter value…',
            options: '',
        };
        setFields(f => [...f, newField]);
        setEditingField(newField.id);
        toast('Field added — configure it on the right');
    };

    const removeField = (id) => {
        setFields(f => f.filter(x => x.id !== id));
        if (editingField === id) setEditingField(null);
        toast('Field removed');
    };

    const moveField = (idx, dir) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= fields.length) return;
        const copy = [...fields];
        [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
        setFields(copy);
    };

    const updateField = (id, updates) => {
        setFields(f => f.map(x => x.id === id ? { ...x, ...updates } : x));
    };

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
    const activeField = fields.find(f => f.id === editingField);

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>📝 Form Builder</button>
                <button className={`detail-tab ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>📥 Submissions ({submissions.length})</button>
                <button className={`detail-tab ${tab === 'embed' ? 'active' : ''}`} onClick={() => setTab('embed')}>🔗 Embed / Share</button>
            </div>

            {tab === 'form' && (
                <div className="dashboard-grid">
                    {/* Left: Live Preview + Field List */}
                    <div>
                        <div className="chart-card" style={{ marginBottom: 12 }}>
                            <div className="chart-card-title">Live Preview</div>
                            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{formConfig.title}</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{formConfig.subtitle}</p>
                                {fields.map(f => (
                                    <div className="form-group" key={f.id} style={{
                                        marginBottom: 12,
                                        borderRadius: 'var(--radius-md)',
                                        outline: editingField === f.id ? '2px solid var(--accent)' : 'none',
                                        outlineOffset: 4,
                                        cursor: 'pointer',
                                    }}
                                        onClick={() => setEditingField(f.id)}
                                    >
                                        <label className="form-label">{f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        {f.type === 'textarea' ? (
                                            <textarea className="form-textarea" placeholder={f.placeholder} style={{ minHeight: 80 }} readOnly />
                                        ) : f.type === 'select' ? (
                                            <select className="form-input" disabled>
                                                <option>{f.placeholder || 'Select…'}</option>
                                                {(f.options || '').split(',').filter(Boolean).map((o, i) => (
                                                    <option key={i}>{o.trim()}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input className="form-input" type={f.type} placeholder={f.placeholder} readOnly />
                                        )}
                                    </div>
                                ))}
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>{formConfig.buttonText}</button>
                            </div>
                        </div>

                        {/* Field list with reorder + delete */}
                        <div className="chart-card">
                            <div className="chart-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Form Fields ({fields.length})</span>
                                <button className="btn btn-primary btn-sm" onClick={addField}>+ Add Field</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {fields.map((f, i) => (
                                    <div key={f.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 'var(--radius-md)',
                                        background: editingField === f.id ? 'var(--accent-bg, rgba(59,130,246,0.08))' : 'var(--bg-hover)',
                                        border: editingField === f.id ? '1px solid var(--accent)' : '1px solid transparent',
                                        cursor: 'pointer', transition: 'all .15s',
                                    }}
                                        onClick={() => setEditingField(f.id)}
                                    >
                                        {/* Reorder arrows */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, opacity: 0.5, fontSize: 11 }}>
                                            <button onClick={e => { e.stopPropagation(); moveField(i, -1); }} style={{
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1
                                            }} disabled={i === 0}>▲</button>
                                            <button onClick={e => { e.stopPropagation(); moveField(i, 1); }} style={{
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1
                                            }} disabled={i === fields.length - 1}>▼</button>
                                        </div>
                                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                                            {f.label} {f.required && <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {FIELD_TYPES.find(t => t.value === f.type)?.label || f.type}
                                        </span>
                                        <button onClick={e => { e.stopPropagation(); removeField(f.id); }} style={{
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: '2px 4px', opacity: 0.6, lineHeight: 1,
                                        }} title="Remove field">✕</button>
                                    </div>
                                ))}
                            </div>
                            {fields.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                                    No fields yet. Click <strong>+ Add Field</strong> to get started.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Settings + Field Editor */}
                    <div>
                        {/* Field editor (shows when a field is selected) */}
                        {activeField && (
                            <div className="chart-card" style={{ marginBottom: 12, border: '1px solid var(--accent)' }}>
                                <div className="chart-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>✏️ Edit Field</span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)} style={{ fontSize: 12 }}>Done</button>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Label</label>
                                    <input className="form-input" value={activeField.label}
                                        onChange={e => updateField(activeField.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Field Type</label>
                                    <select className="form-input" value={activeField.type}
                                        onChange={e => updateField(activeField.id, { type: e.target.value })}>
                                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Placeholder</label>
                                    <input className="form-input" value={activeField.placeholder}
                                        onChange={e => updateField(activeField.id, { placeholder: e.target.value })} />
                                </div>
                                {activeField.type === 'select' && (
                                    <div className="form-group">
                                        <label className="form-label">Options (comma-separated)</label>
                                        <input className="form-input" value={activeField.options || ''}
                                            onChange={e => updateField(activeField.id, { options: e.target.value })}
                                            placeholder="Option 1, Option 2, Option 3" />
                                    </div>
                                )}
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
                                    <div className={`automation-toggle ${activeField.required ? 'on' : ''}`}
                                        onClick={() => updateField(activeField.id, { required: !activeField.required })}>
                                        <div className="automation-toggle-thumb" />
                                    </div>
                                    Required field
                                </label>
                            </div>
                        )}

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

