import { useState } from 'react';
import * as api from '../api.js';
import { exportCSV } from '../utils.js';

export default function Contacts({ contacts, companies, toast, refreshContacts }) {
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');

    const filtered = contacts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.mobile?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const contact = {
            id: Date.now(),
            name: fd.get('name'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            mobile: fd.get('mobile'),
            company: fd.get('company'),
            companyId: '',
            role: fd.get('role'),
            deals: 0,
            tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()) : [],
        };
        try {
            await api.saveContact(contact);
            await refreshContacts();
            toast('Contact added!');
            setShowAdd(false);
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteContact(id);
            await refreshContacts();
            toast('Contact removed');
            setSelected(null);
        } catch (err) { toast(err.message, 'error'); }
    };

    return (
        <div>
            <div className="section-header">
                <h3>{contacts.length} Contacts</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div className="search-input-wrap">
                        <span className="search-icon">🔍</span>
                        <input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-ghost" onClick={() => { exportCSV(contacts.map(c => ({ Name: c.name, Email: c.email, Phone: c.phone, Mobile: c.mobile, Company: c.company, Role: c.role, Tags: (c.tags || []).join(', ') })), 'pipeline3d_contacts.csv'); toast('Exported!'); }}>⬇ CSV</button>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Contact</button>
                </div>
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Mobile</th><th>Company</th><th>Role</th><th>Tags</th></tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                                <td>{c.name}</td>
                                <td>{c.email || '—'}</td>
                                <td>{c.phone || '—'}</td>
                                <td>{c.mobile || '—'}</td>
                                <td>{c.company || '—'}</td>
                                <td>{c.role || '—'}</td>
                                <td>
                                    {(c.tags || []).map((t, i) => <span key={i} className="tag tag-accent" style={{ marginRight: 4 }}>{t}</span>)}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {search ? 'No matches found' : 'No contacts yet'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Contact Modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>New Contact</h3>
                            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input name="name" className="form-input" required placeholder="Full name" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input name="email" className="form-input" type="email" placeholder="email@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone (Office)</label>
                                        <input name="phone" className="form-input" placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">📱 Mobile Phone</label>
                                        <input name="mobile" className="form-input" placeholder="+1 (555) 000-0000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Company</label>
                                        <input name="company" className="form-input" placeholder="Company name" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <input name="role" className="form-input" placeholder="Job title" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tags (comma separated)</label>
                                        <input name="tags" className="form-input" placeholder="decision-maker, technical" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Contact</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Detail Modal */}
            {selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{selected.name}</h3>
                            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="deal-detail-grid">
                                <div className="deal-detail-item"><div className="label">Email</div><div className="value">{selected.email || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">Phone (Office)</div><div className="value">{selected.phone || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">📱 Mobile</div><div className="value">{selected.mobile || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">Company</div><div className="value">{selected.company || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">Role</div><div className="value">{selected.role || '—'}</div></div>
                            </div>
                            <div>
                                <div className="form-label">Tags</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                    {(selected.tags || []).map((t, i) => <span key={i} className="tag tag-accent">{t}</span>)}
                                    {(!selected.tags || selected.tags.length === 0) && <span style={{ color: '#64748b', fontSize: 13 }}>No tags</span>}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
                            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
