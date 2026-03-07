import { useState, useRef, useMemo } from 'react';
import * as api from '../api.js';

export default function DataImport({ contacts, toast, refreshContacts, refreshDeals }) {
    const [tab, setTab] = useState('import');
    const [importData, setImportData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importing, setImporting] = useState(false);
    const [importType, setImportType] = useState('contacts');
    const fileRef = useRef();

    // Duplicate detection
    const duplicates = useMemo(() => {
        const emailMap = {};
        const dupes = [];
        contacts.forEach(c => {
            const key = (c.email || '').toLowerCase().trim();
            if (!key) return;
            if (emailMap[key]) {
                const existing = emailMap[key];
                if (!dupes.find(d => d.email === key)) {
                    dupes.push({ email: key, contacts: [existing, c] });
                } else {
                    dupes.find(d => d.email === key).contacts.push(c);
                }
            } else {
                emailMap[key] = c;
            }
        });
        return dupes;
    }, [contacts]);

    // Contact enrichment (simulated AI)
    const enrichContact = (contact) => {
        const domain = contact.email ? contact.email.split('@')[1] : '';
        const enriched = { ...contact };
        if (domain && !contact.company) {
            const co = domain.replace('.com', '').replace('.net', '').replace('.org', '');
            enriched.company = co.charAt(0).toUpperCase() + co.slice(1);
        }
        if (!contact.role && contact.tags) {
            if (contact.tags.includes('cto') || contact.tags.includes('technical')) enriched.role = 'Technical Lead';
            else if (contact.tags.includes('ceo') || contact.tags.includes('owner')) enriched.role = 'CEO / Owner';
        }
        if (domain) {
            enriched.linkedinUrl = `https://linkedin.com/company/${domain.replace(/\.(com|net|org|io)$/, '')}`;
            enriched.website = `https://${domain}`;
        }
        return enriched;
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { toast('File needs at least 2 rows (header + data)', 'error'); return; }
            const hdrs = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            setHeaders(hdrs);
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                hdrs.forEach((h, i) => { row[h] = vals[i] || ''; });
                return row;
            });
            setImportData(rows);
            // Auto-map common headers
            const autoMap = {};
            hdrs.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('name') && !lower.includes('company')) autoMap[h] = 'name';
                else if (lower.includes('email')) autoMap[h] = 'email';
                else if (lower.includes('phone')) autoMap[h] = 'phone';
                else if (lower.includes('company') || lower.includes('organization')) autoMap[h] = 'company';
                else if (lower.includes('role') || lower.includes('title') || lower.includes('position')) autoMap[h] = 'role';
                else if (lower.includes('tag')) autoMap[h] = 'tags';
            });
            setMapping(autoMap);
            toast(`Loaded ${rows.length} rows from ${file.name}`);
        };
        reader.readAsText(file);
    };

    const runImport = async () => {
        if (importData.length === 0) return;
        setImporting(true);
        let imported = 0;
        for (const row of importData) {
            const record = { id: Date.now() + imported };
            Object.entries(mapping).forEach(([csvCol, crmField]) => {
                if (crmField && row[csvCol]) record[crmField] = row[csvCol];
            });
            if (record.name || record.email) {
                try {
                    await api.saveContact(record);
                    imported++;
                } catch (e) { /* skip errors */ }
            }
        }
        await refreshContacts();
        toast(`Imported ${imported} contacts!`);
        setImportData([]);
        setHeaders([]);
        setImporting(false);
    };

    const mergeDuplicates = async (dupe) => {
        // Merge: keep first, delete rest
        const [keep, ...remove] = dupe.contacts;
        for (const c of remove) {
            // Merge missing fields from duplicates into primary
            if (!keep.phone && c.phone) keep.phone = c.phone;
            if (!keep.company && c.company) keep.company = c.company;
            if (!keep.role && c.role) keep.role = c.role;
            try { await api.deleteContact(c.id); } catch (e) { }
        }
        try { await api.saveContact(keep); } catch (e) { }
        await refreshContacts();
        toast(`Merged ${remove.length + 1} contacts into "${keep.name}"`);
    };

    const CRM_FIELDS = ['name', 'email', 'phone', 'company', 'role', 'tags', '(skip)'];

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'import' ? 'active' : ''}`} onClick={() => setTab('import')}>📥 CSV Import</button>
                <button className={`detail-tab ${tab === 'duplicates' ? 'active' : ''}`} onClick={() => setTab('duplicates')}>
                    🔄 Duplicates {duplicates.length > 0 && `(${duplicates.length})`}
                </button>
                <button className={`detail-tab ${tab === 'enrich' ? 'active' : ''}`} onClick={() => setTab('enrich')}>✨ AI Enrichment</button>
            </div>

            {tab === 'import' && (
                <div>
                    {importData.length === 0 ? (
                        <div className="chart-card" style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                            <h3 style={{ marginBottom: 8 }}>Import Contacts from CSV</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                                Upload a CSV file with contact data. We'll auto-detect columns and let you map them.
                            </p>
                            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
                            <button className="btn btn-primary" onClick={() => fileRef.current.click()}>📂 Choose CSV File</button>
                            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                Supported columns: Name, Email, Phone, Company, Role, Tags
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <h3>{importData.length} records ready to import</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost" onClick={() => { setImportData([]); setHeaders([]); }}>Cancel</button>
                                    <button className="btn btn-primary" onClick={runImport} disabled={importing}>
                                        {importing ? 'Importing…' : `📥 Import ${importData.length} Contacts`}
                                    </button>
                                </div>
                            </div>

                            {/* Column Mapping */}
                            <div className="chart-card" style={{ marginBottom: 16 }}>
                                <div className="chart-card-title">Map Columns</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                                    {headers.map(h => (
                                        <div key={h}>
                                            <label className="form-label" style={{ fontSize: 11 }}>CSV: "{h}"</label>
                                            <select className="form-select" value={mapping[h] || '(skip)'} onChange={e => setMapping(m => ({ ...m, [h]: e.target.value === '(skip)' ? '' : e.target.value }))}>
                                                {CRM_FIELDS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="chart-card">
                                <div className="chart-card-title">Preview (first 5 rows)</div>
                                <div className="data-table-wrap" style={{ border: 'none' }}>
                                    <table className="data-table">
                                        <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {importData.slice(0, 5).map((row, i) => (
                                                <tr key={i}>{headers.map(h => <td key={h}>{row[h]}</td>)}</tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === 'duplicates' && (
                <div>
                    <div className="section-header" style={{ marginBottom: 16 }}>
                        <h3>{duplicates.length} potential duplicates found</h3>
                    </div>
                    {duplicates.length > 0 ? duplicates.map(dupe => (
                        <div className="chart-card" key={dupe.email} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>📧 {dupe.email}</span>
                                    <span style={{ fontSize: 12, color: '#f59e0b', marginLeft: 8 }}>{dupe.contacts.length} matches</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => mergeDuplicates(dupe)}>🔄 Merge All</button>
                            </div>
                            {dupe.contacts.map(c => (
                                <div key={c.id} style={{ display: 'flex', gap: 16, padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
                                    <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                                    <span style={{ flex: 1, color: 'var(--text-muted)' }}>{c.company || '—'}</span>
                                    <span style={{ flex: 1, color: 'var(--text-muted)' }}>{c.phone || '—'}</span>
                                    <span style={{ flex: 1, color: 'var(--text-muted)' }}>{c.role || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )) : (
                        <div className="empty-state"><div className="empty-state-icon">✅</div><h3>No duplicates!</h3><p>All contact emails are unique.</p></div>
                    )}
                </div>
            )}

            {tab === 'enrich' && (
                <div>
                    <div className="section-header" style={{ marginBottom: 16 }}>
                        <h3>AI Contact Enrichment</h3>
                    </div>
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Automatically fill in missing company, role, LinkedIn, and website data from email addresses.
                            Select contacts below to enrich.
                        </p>
                        <div className="automation-list">
                            {contacts.filter(c => c.email && (!c.company || !c.role)).slice(0, 10).map(c => {
                                const enriched = enrichContact(c);
                                const hasChanges = enriched.company !== c.company || enriched.role !== c.role || enriched.linkedinUrl || enriched.website;
                                return (
                                    <div className="automation-card" key={c.id}>
                                        <div className="automation-card-header" style={{ cursor: 'default' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                                                {hasChanges && (
                                                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {enriched.company && enriched.company !== c.company && (
                                                            <span className="tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>🏢 {enriched.company}</span>
                                                        )}
                                                        {enriched.role && enriched.role !== c.role && (
                                                            <span className="tag" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>👤 {enriched.role}</span>
                                                        )}
                                                        {enriched.website && (
                                                            <span className="tag" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>🌐 {enriched.website}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {hasChanges && (
                                                <button className="btn btn-primary btn-sm" onClick={async () => {
                                                    try { await api.saveContact(enriched); await refreshContacts(); toast(`Enriched ${c.name}`); } catch (e) { toast(e.message, 'error'); }
                                                }}>✨ Enrich</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {contacts.filter(c => c.email && (!c.company || !c.role)).length === 0 && (
                                <div className="empty-state"><div className="empty-state-icon">✨</div><h3>All contacts enriched!</h3><p>No contacts are missing company or role data.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
