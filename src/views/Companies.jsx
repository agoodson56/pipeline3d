import { useState } from 'react';
import * as api from '../api.js';

export default function Companies({ companies, deals, toast, refreshCompanies }) {
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState(null);

    const getCompanyDeals = (name) => deals.filter(d => d.company === name);

    const handleAdd = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const company = {
            id: 'co' + Date.now(),
            name: fd.get('name'),
            industry: fd.get('industry'),
            website: fd.get('website'),
            size: fd.get('size') || '10-50',
            country: fd.get('country') || 'USA',
            notes: fd.get('notes') || '',
        };
        try {
            await api.saveCompany(company);
            await refreshCompanies();
            toast('Company added!');
            setShowAdd(false);
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteCompany(id);
            await refreshCompanies();
            toast('Company removed');
            setSelected(null);
        } catch (err) { toast(err.message, 'error'); }
    };

    return (
        <div>
            <div className="section-header">
                <h3>{companies.length} Companies</h3>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Company</button>
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr><th>Name</th><th>Industry</th><th>Size</th><th>Country</th><th>Deals</th></tr>
                    </thead>
                    <tbody>
                        {companies.map(c => {
                            const cd = getCompanyDeals(c.name);
                            return (
                                <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                                    <td>{c.name}</td>
                                    <td>{c.industry || '—'}</td>
                                    <td><span className="tag tag-blue">{c.size}</span></td>
                                    <td>{c.country || '—'}</td>
                                    <td><span className="tag tag-green">{cd.length}</span></td>
                                </tr>
                            );
                        })}
                        {companies.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No companies yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>New Company</h3>
                            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input name="name" className="form-input" required placeholder="Company name" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Industry</label>
                                        <input name="industry" className="form-input" placeholder="e.g. Technology" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Website</label>
                                        <input name="website" className="form-input" placeholder="example.com" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Size</label>
                                        <select name="size" className="form-select" defaultValue="10-50">
                                            <option>1-10</option><option>10-50</option><option>50-200</option>
                                            <option>200-1000</option><option>1000+</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <input name="country" className="form-input" defaultValue="USA" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea name="notes" className="form-textarea" placeholder="Optional notes" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Company</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{selected.name}</h3>
                            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="deal-detail-grid">
                                <div className="deal-detail-item"><div className="label">Industry</div><div className="value">{selected.industry || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">Website</div><div className="value">{selected.website || '—'}</div></div>
                                <div className="deal-detail-item"><div className="label">Size</div><div className="value">{selected.size}</div></div>
                                <div className="deal-detail-item"><div className="label">Country</div><div className="value">{selected.country}</div></div>
                            </div>
                            {selected.notes && <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>{selected.notes}</div>}
                            {getCompanyDeals(selected.name).length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div className="form-label">Related Deals</div>
                                    {getCompanyDeals(selected.name).map(d => (
                                        <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                            {d.title} — <span style={{ color: '#10b981', fontWeight: 600 }}>${d.value?.toLocaleString()}</span> · {d.stage}
                                        </div>
                                    ))}
                                </div>
                            )}
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
