import { useMemo } from 'react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function Dashboard({ deals, contacts, companies, activities }) {
    const stats = useMemo(() => {
        const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
        const won = deals.filter(d => d.stage === 'Won');
        const totalValue = open.reduce((s, d) => s + (d.value || 0), 0);
        const wonValue = won.reduce((s, d) => s + (d.value || 0), 0);
        const weighted = open.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0);
        const winRate = deals.length > 0 ? Math.round(won.length / deals.length * 100) : 0;
        const pendingActs = activities.filter(a => !a.done).length;
        return { open, won, totalValue, wonValue, weighted, winRate, pendingActs };
    }, [deals, activities]);

    // Stage distribution for bar chart
    const stageDist = useMemo(() => {
        const map = {};
        deals.forEach(d => { map[d.stage] = (map[d.stage] || 0) + 1; });
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
        const max = Math.max(...entries.map(e => e[1]), 1);
        return entries.map(([stage, count]) => ({ stage, count, pct: (count / max) * 100 }));
    }, [deals]);

    const recentDeals = useMemo(() =>
        [...deals].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5)
        , [deals]);

    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

    return (
        <div>
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Pipeline Value</div>
                    <div className="kpi-value">{fmt(stats.totalValue)}</div>
                    <div className="kpi-sub">{stats.open.length} open deals</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Won Revenue</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{fmt(stats.wonValue)}</div>
                    <div className="kpi-sub">{stats.won.length} closed won</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Weighted Forecast</div>
                    <div className="kpi-value" style={{ color: '#a5b4fc' }}>{fmt(stats.weighted)}</div>
                    <div className="kpi-sub">Probability-adjusted</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Win Rate</div>
                    <div className="kpi-value">{stats.winRate}%</div>
                    <div className="kpi-sub">
                        <span className={stats.winRate >= 30 ? 'up' : 'down'}>
                            {stats.winRate >= 30 ? '▲' : '▼'} {stats.winRate >= 30 ? 'Above' : 'Below'} avg
                        </span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="chart-card">
                    <div className="chart-card-title">Stage Distribution</div>
                    <div className="bar-chart">
                        {stageDist.map((s, i) => (
                            <div className="bar-row" key={s.stage}>
                                <div className="bar-row-label">{s.stage}</div>
                                <div className="bar-row-track">
                                    <div className="bar-row-fill" style={{ width: `${s.pct}%`, background: colors[i % colors.length] }} />
                                </div>
                                <div className="bar-row-value">{s.count} deals</div>
                            </div>
                        ))}
                        {stageDist.length === 0 && (
                            <div className="empty-state"><p>No deals yet</p></div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card-title">Quick Stats</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="deal-detail-item">
                            <div className="label">Total Contacts</div>
                            <div className="value">{contacts.length}</div>
                        </div>
                        <div className="deal-detail-item">
                            <div className="label">Companies</div>
                            <div className="value">{companies.length}</div>
                        </div>
                        <div className="deal-detail-item">
                            <div className="label">Pending Tasks</div>
                            <div className="value" style={{ color: stats.pendingActs > 3 ? '#f59e0b' : '#10b981' }}>
                                {stats.pendingActs}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-card-title">Recent Deals</div>
                <div className="data-table-wrap" style={{ border: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Deal</th><th>Company</th><th>Stage</th><th>Value</th><th>Label</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentDeals.map(d => (
                                <tr key={d.id}>
                                    <td>{d.title}</td>
                                    <td>{d.company || '—'}</td>
                                    <td><span className="tag tag-accent">{d.stage}</span></td>
                                    <td style={{ fontWeight: 600, color: '#10b981' }}>{fmt(d.value)}</td>
                                    <td><span className={`kanban-card-label label-${d.label}`}>{d.label}</span></td>
                                </tr>
                            ))}
                            {recentDeals.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No deals found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
