import { useState } from 'react';

const DEFAULT_FIELDS = [
    { id: 1, name: 'Project Type', type: 'dropdown', entity: 'deals', options: ['New Install', 'Upgrade', 'Maintenance', 'Consultation'], active: true },
    { id: 2, name: 'Lead Source', type: 'dropdown', entity: 'deals', options: ['Website', 'Referral', 'Cold Call', 'Trade Show', 'LinkedIn', 'Other'], active: true },
    { id: 3, name: 'Decision Timeline', type: 'dropdown', entity: 'deals', options: ['Immediate', '1-3 months', '3-6 months', '6+ months'], active: true },
    { id: 4, name: 'Contract Length', type: 'text', entity: 'deals', options: [], active: true },
    { id: 5, name: 'Territory', type: 'dropdown', entity: 'contacts', options: ['Northeast', 'Southeast', 'Midwest', 'West', 'International'], active: true },
    { id: 6, name: 'LinkedIn URL', type: 'text', entity: 'contacts', options: [], active: false },
];

export default function Settings({ toast, pipelines, refreshPipelines }) {
    const [tab, setTab] = useState('fields');
    const [customFields, setCustomFields] = useState(DEFAULT_FIELDS);
    const [showAddField, setShowAddField] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'text', entity: 'deals', options: '' });

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
                <button className={`detail-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>🛠 Custom Fields</button>
                <button className={`detail-tab ${tab === 'pipelines' ? 'active' : ''}`} onClick={() => setTab('pipelines')}>🔀 Pipelines</button>
                <button className={`detail-tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>⚙️ General</button>
            </div>

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
                </div>
            )}

            {tab === 'general' && (
                <div className="dashboard-grid">
                    <div className="chart-card">
                        <div className="chart-card-title">Company Information</div>
                        <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" defaultValue="3D Technology Services Inc." /></div>
                        <div className="form-group"><label className="form-label">Industry</label><input className="form-input" defaultValue="Low Voltage / Technology" /></div>
                        <div className="form-group"><label className="form-label">Default Currency</label><select className="form-select" defaultValue="USD"><option>USD</option><option>EUR</option><option>GBP</option></select></div>
                        <div className="form-group"><label className="form-label">Fiscal Year Start</label><select className="form-select" defaultValue="January"><option>January</option><option>April</option><option>July</option><option>October</option></select></div>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title">Deal Defaults</div>
                        <div className="form-group"><label className="form-label">Default Win Probability</label><input className="form-input" type="number" defaultValue="20" /></div>
                        <div className="form-group"><label className="form-label">Deal Rotting (days)</label><input className="form-input" type="number" defaultValue="30" /></div>
                        <div className="form-group"><label className="form-label">Monthly Quota ($)</label><input className="form-input" type="number" defaultValue="100000" /></div>
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
