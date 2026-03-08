import { useState, useRef, useMemo } from 'react';
import * as api from '../api.js';

export default function DataImport({ contacts, toast, refreshContacts, refreshDeals }) {
    const [tab, setTab] = useState('import');
    const [importData, setImportData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
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

    // Smart CSV parser that handles quoted fields with commas
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Auto-map CSV headers to CRM fields — supports Outlook, Google, and generic exports
    const autoMapHeaders = (hdrs) => {
        const autoMap = {};
        // Track if we see separate first/last name columns
        let hasFirst = false, hasLast = false;

        hdrs.forEach(h => {
            const lower = h.toLowerCase().trim();

            // ── Name mapping ──
            if (lower === 'first name' || lower === 'first') { autoMap[h] = 'firstName'; hasFirst = true; }
            else if (lower === 'last name' || lower === 'last') { autoMap[h] = 'lastName'; hasLast = true; }
            else if (lower === 'middle name' || lower === 'middle') autoMap[h] = 'middleName';
            else if ((lower.includes('name') && !lower.includes('company') && !lower.includes('first') && !lower.includes('last') && !lower.includes('middle') && !lower.includes('nick'))
                || lower === 'full name' || lower === 'display name') autoMap[h] = 'name';

            // ── Email mapping ──
            else if (lower === 'e-mail address' || lower === 'email address' || lower === 'email'
                || lower === 'e-mail' || lower === 'email 1 - value' || lower === 'primary email') autoMap[h] = 'email';

            // ── Phone mapping ──
            else if (lower === 'business phone' || lower === 'work phone' || lower === 'office phone'
                || lower === 'phone 1 - value' || lower === 'primary phone') autoMap[h] = 'phone';
            else if (lower === 'mobile phone' || lower === 'mobile' || lower === 'cell phone'
                || lower === 'cell' || lower === 'phone 2 - value') autoMap[h] = 'mobile';
            else if (lower === 'home phone') autoMap[h] = '(skip)';
            else if (lower === 'phone' || lower === 'phone number' || lower === 'telephone') autoMap[h] = 'phone';

            // ── Company mapping ──
            else if (lower === 'company' || lower === 'company name' || lower === 'organization'
                || lower === 'organization 1 - name' || lower === 'account name') autoMap[h] = 'company';

            // ── Role/Title mapping ──
            else if (lower === 'job title' || lower === 'title' || lower === 'role'
                || lower === 'position' || lower === 'organization 1 - title') autoMap[h] = 'role';

            // ── Tags ──
            else if (lower === 'categories' || lower === 'tags' || lower === 'labels' || lower === 'groups') autoMap[h] = 'tags';
        });

        return { autoMap, hasFirst, hasLast };
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportResult(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { toast('File needs at least 2 rows (header + data)', 'error'); return; }

            const hdrs = parseCSVLine(lines[0]);
            setHeaders(hdrs);

            const rows = lines.slice(1).map(line => {
                const vals = parseCSVLine(line);
                const row = {};
                hdrs.forEach((h, i) => { row[h] = vals[i] || ''; });
                return row;
            });
            setImportData(rows);

            const { autoMap } = autoMapHeaders(hdrs);
            setMapping(autoMap);
            toast(`Loaded ${rows.length} rows from "${file.name}"`);
        };
        reader.readAsText(file);
    };

    const runImport = async () => {
        if (importData.length === 0) return;
        setImporting(true);
        let imported = 0;
        let skipped = 0;
        const existingEmails = new Set(contacts.map(c => (c.email || '').toLowerCase().trim()));

        for (const row of importData) {
            const record = { id: Date.now() + imported + skipped };

            // Build the record from mapped columns
            let firstName = '', lastName = '', middleName = '';
            Object.entries(mapping).forEach(([csvCol, crmField]) => {
                if (!crmField || crmField === '(skip)' || !row[csvCol]) return;
                if (crmField === 'firstName') firstName = row[csvCol];
                else if (crmField === 'lastName') lastName = row[csvCol];
                else if (crmField === 'middleName') middleName = row[csvCol];
                else record[crmField] = row[csvCol];
            });

            // Combine first + last name if no 'name' was directly mapped
            if (!record.name && (firstName || lastName)) {
                record.name = [firstName, middleName, lastName].filter(Boolean).join(' ');
            }

            // Parse tags if it's a string
            if (typeof record.tags === 'string') {
                record.tags = record.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean);
            }

            // Skip if no name and no email
            if (!record.name && !record.email) { skipped++; continue; }

            // Skip duplicate emails
            if (record.email && existingEmails.has(record.email.toLowerCase().trim())) {
                skipped++;
                continue;
            }

            try {
                await api.saveContact(record);
                if (record.email) existingEmails.add(record.email.toLowerCase().trim());
                imported++;
            } catch (e) { skipped++; }
        }

        await refreshContacts();
        setImportResult({ imported, skipped });
        toast(`Imported ${imported} contacts${skipped > 0 ? ` (${skipped} skipped)` : ''}!`);
        setImporting(false);
    };

    const resetImport = () => {
        setImportData([]);
        setHeaders([]);
        setMapping({});
        setImportResult(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const mergeDuplicates = async (dupe) => {
        const [keep, ...remove] = dupe.contacts;
        for (const c of remove) {
            if (!keep.phone && c.phone) keep.phone = c.phone;
            if (!keep.mobile && c.mobile) keep.mobile = c.mobile;
            if (!keep.company && c.company) keep.company = c.company;
            if (!keep.role && c.role) keep.role = c.role;
            try { await api.deleteContact(c.id); } catch (e) { }
        }
        try { await api.saveContact(keep); } catch (e) { }
        await refreshContacts();
        toast(`Merged ${remove.length + 1} contacts into "${keep.name}"`);
    };

    const CRM_FIELDS = ['name', 'firstName', 'lastName', 'middleName', 'email', 'phone', 'mobile', 'company', 'role', 'tags', '(skip)'];
    const FIELD_LABELS = {
        name: '👤 Full Name', firstName: '👤 First Name', lastName: '👤 Last Name', middleName: '👤 Middle Name',
        email: '📧 Email', phone: '📞 Phone (Office)', mobile: '📱 Mobile Phone',
        company: '🏢 Company', role: '💼 Role/Title', tags: '🏷️ Tags', '(skip)': '⏭️ Skip',
    };

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'import' ? 'active' : ''}`} onClick={() => setTab('import')}>📥 Import Contacts</button>
                <button className={`detail-tab ${tab === 'duplicates' ? 'active' : ''}`} onClick={() => setTab('duplicates')}>
                    🔄 Duplicates {duplicates.length > 0 && `(${duplicates.length})`}
                </button>
                <button className={`detail-tab ${tab === 'enrich' ? 'active' : ''}`} onClick={() => setTab('enrich')}>✨ AI Enrichment</button>
            </div>

            {tab === 'import' && (
                <div>
                    {importData.length === 0 ? (
                        <div>
                            {/* Import result banner */}
                            {importResult && (
                                <div className="chart-card" style={{ marginBottom: 16, background: 'rgba(5,150,105,0.06)', borderColor: '#059669' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 32 }}>✅</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>Import Complete!</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {importResult.imported} contacts imported{importResult.skipped > 0 ? `, ${importResult.skipped} skipped (duplicates or empty)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="chart-card" style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                                <h3 style={{ marginBottom: 8 }}>Import Contacts from CSV</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
                                    Upload a CSV file exported from <strong>Outlook</strong>, <strong>Google Contacts</strong>, <strong>Excel</strong>, or any spreadsheet.
                                    We'll auto-detect columns and let you map them.
                                </p>
                                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
                                <button className="btn btn-primary" style={{ fontSize: 15, padding: '14px 28px' }} onClick={() => fileRef.current.click()}>📂 Choose CSV File</button>
                                <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                    <strong>Supported formats:</strong><br />
                                    Outlook Export CSV • Google Contacts CSV • Excel/Sheets CSV<br />
                                    <strong>Auto-detected columns:</strong> Name, First/Last Name, Email, Phone, Mobile, Company, Job Title, Tags
                                </div>
                            </div>

                            {/* How-to guide */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
                                <div className="chart-card">
                                    <div className="chart-card-title">📧 From Outlook</div>
                                    <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 18 }}>
                                        <li>Open Outlook → File → Open & Export</li>
                                        <li>Click "Import/Export"</li>
                                        <li>Select "Export to a file" → CSV</li>
                                        <li>Choose your Contacts folder</li>
                                        <li>Save the .csv file</li>
                                        <li>Upload it here!</li>
                                    </ol>
                                </div>
                                <div className="chart-card">
                                    <div className="chart-card-title">📊 From Excel / Sheets</div>
                                    <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 18 }}>
                                        <li>Open your spreadsheet</li>
                                        <li>Make sure row 1 has column headers</li>
                                        <li>File → Save As → CSV format</li>
                                        <li>Upload the .csv file here!</li>
                                    </ol>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        💡 Tip: Include columns named "Name", "Email", "Phone", "Mobile", "Company" for best results.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <h3>{importData.length} records ready to import</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost" onClick={resetImport}>Cancel</button>
                                    <button className="btn btn-primary" onClick={runImport} disabled={importing}>
                                        {importing ? '⏳ Importing…' : `📥 Import ${importData.length} Contacts`}
                                    </button>
                                </div>
                            </div>

                            {/* Column Mapping */}
                            <div className="chart-card" style={{ marginBottom: 16 }}>
                                <div className="chart-card-title">Map Your Columns → Pipeline3D Fields</div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                    We auto-detected most columns. Review and adjust the mapping below if needed.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                                    {headers.map(h => (
                                        <div key={h}>
                                            <label className="form-label" style={{ fontSize: 11 }}>CSV: "{h}"</label>
                                            <select className="form-select" value={mapping[h] || '(skip)'} onChange={e => setMapping(m => ({ ...m, [h]: e.target.value === '(skip)' ? '' : e.target.value }))}>
                                                {CRM_FIELDS.map(f => <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>)}
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
                                    <span style={{ flex: 1, color: 'var(--text-muted)' }}>{c.mobile || '—'}</span>
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
                                                            <span className="tag" style={{ background: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>👤 {enriched.role}</span>
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
