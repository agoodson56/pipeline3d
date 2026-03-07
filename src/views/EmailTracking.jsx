import { useState } from 'react';

export default function EmailTracking({ emails, toast }) {
    const [filter, setFilter] = useState('all');

    const filtered = emails.filter(e => {
        if (filter === 'opened') return e.opened;
        if (filter === 'clicked') return e.clicked;
        if (filter === 'pending') return !e.opened;
        return true;
    });

    const totalSent = emails.length;
    const opened = emails.filter(e => e.opened).length;
    const clicked = emails.filter(e => e.clicked).length;
    const openRate = totalSent > 0 ? Math.round(opened / totalSent * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round(clicked / totalSent * 100) : 0;

    return (
        <div>
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <div className="kpi-card">
                    <div className="kpi-label">Emails Sent</div>
                    <div className="kpi-value">{totalSent}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Open Rate</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{openRate}%</div>
                    <div className="kpi-sub">{opened} opened</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Click Rate</div>
                    <div className="kpi-value" style={{ color: '#3b82f6' }}>{clickRate}%</div>
                    <div className="kpi-sub">{clicked} clicked</div>
                </div>
            </div>

            <div className="filter-bar">
                {['all', 'opened', 'clicked', 'pending'].map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Subject</th><th>Contact</th><th>Deal</th><th>Type</th><th>Sent</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(e => (
                            <tr key={e.id}>
                                <td>{e.subject || '—'}</td>
                                <td>{e.contact || '—'}</td>
                                <td>{e.dealTitle || '—'}</td>
                                <td><span className="tag tag-accent">{e.type || '—'}</span></td>
                                <td style={{ fontSize: 12, color: '#94a3b8' }}>{e.sentAt || '—'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {e.opened && <span className="tag tag-green">Opened</span>}
                                        {e.clicked && <span className="tag tag-blue">Clicked</span>}
                                        {!e.opened && !e.clicked && <span className="tag" style={{ background: '#1c1f2e', color: '#64748b' }}>Sent</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {filter !== 'all' ? 'No emails match this filter' : 'No emails tracked yet'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
