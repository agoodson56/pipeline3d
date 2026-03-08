import { useMemo } from 'react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function Dashboard({ deals, contacts, companies, activities }) {
    const stats = useMemo(() => {
        const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
        const won = deals.filter(d => d.stage === 'Won');
        const lost = deals.filter(d => d.stage === 'Lost');
        const closed = won.length + lost.length;
        const totalValue = open.reduce((s, d) => s + (d.value || 0), 0);
        const wonValue = won.reduce((s, d) => s + (d.value || 0), 0);
        const weighted = open.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0);
        const winRate = closed > 0 ? Math.round(won.length / closed * 100) : 0;
        const pendingActs = activities.filter(a => !a.done).length;
        const overdueActs = activities.filter(a => !a.done && a.dueDate && new Date(a.dueDate) < new Date()).length;
        const avgDeal = open.length > 0 ? open.reduce((s, d) => s + d.value, 0) / open.length : 0;
        const avgDays = open.length > 0 ? Math.round(open.reduce((s, d) => s + (d.daysOpen || 0), 0) / open.length) : 0;
        const velocity = avgDays > 0 ? Math.round(avgDeal * (winRate / 100) * open.length / avgDays) : 0;
        const hottDeals = deals.filter(d => d.label === 'hot' && d.stage !== 'Won' && d.stage !== 'Lost').length;
        const rottingDeals = open.filter(d => (d.daysOpen || 0) > 30).length;
        const quota = 100000;
        const quotaPct = Math.min(100, Math.round(wonValue / quota * 100));
        return { open, won, lost, closed, totalValue, wonValue, weighted, winRate, pendingActs, overdueActs, avgDeal, avgDays, velocity, hottDeals, rottingDeals, quota, quotaPct };
    }, [deals, activities]);

    const stageDist = useMemo(() => {
        const map = {};
        deals.forEach(d => { map[d.stage] = (map[d.stage] || 0) + 1; });
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
        const max = Math.max(...entries.map(e => e[1]), 1);
        return entries.map(([stage, count]) => ({ stage, count, pct: (count / max) * 100 }));
    }, [deals]);

    const stageValueDist = useMemo(() => {
        const map = {};
        deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').forEach(d => {
            if (!map[d.stage]) map[d.stage] = 0;
            map[d.stage] += d.value || 0;
        });
        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
        const max = Math.max(...entries.map(e => e[1]), 1);
        return entries.map(([stage, value]) => ({ stage, value, pct: (value / max) * 100 }));
    }, [deals]);

    const recentDeals = useMemo(() =>
        [...deals].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5)
        , [deals]);

    const upcomingActs = useMemo(() =>
        activities.filter(a => !a.done).sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)).slice(0, 5)
        , [activities]);

    const colors = ['#0D9488', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

    return (
        <div>
            {/* KPI Row 1 — Primary */}
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
                    <div className="kpi-value" style={{ color: '#5EEAD4' }}>{fmt(stats.weighted)}</div>
                    <div className="kpi-sub">Probability-adjusted</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Win Rate</div>
                    <div className="kpi-value">{stats.winRate}%</div>
                    <div className="kpi-sub"><span className={stats.winRate >= 30 ? 'up' : 'down'}>{stats.winRate >= 30 ? '▲ Above' : '▼ Below'} avg</span></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Pipeline Velocity</div>
                    <div className="kpi-value" style={{ color: '#8b5cf6' }}>{fmt(stats.velocity)}</div>
                    <div className="kpi-sub">Rev / day potential</div>
                </div>
            </div>

            {/* KPI Row 2 — Secondary */}
            <div className="kpi-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>Avg Deal</div>
                    <div className="kpi-value" style={{ fontSize: 18 }}>{fmt(stats.avgDeal)}</div>
                </div>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>Avg Days</div>
                    <div className="kpi-value" style={{ fontSize: 18 }}>{stats.avgDays}</div>
                </div>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>🔥 Hot</div>
                    <div className="kpi-value" style={{ fontSize: 18, color: '#ef4444' }}>{stats.hottDeals}</div>
                </div>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>⚠️ Rotting</div>
                    <div className="kpi-value" style={{ fontSize: 18, color: stats.rottingDeals > 0 ? '#f97316' : '#10b981' }}>{stats.rottingDeals}</div>
                </div>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>Pending</div>
                    <div className="kpi-value" style={{ fontSize: 18, color: stats.pendingActs > 5 ? '#f59e0b' : 'inherit' }}>{stats.pendingActs}</div>
                </div>
                <div className="kpi-card" style={{ padding: '12px 16px' }}>
                    <div className="kpi-label" style={{ fontSize: 10 }}>Overdue</div>
                    <div className="kpi-value" style={{ fontSize: 18, color: stats.overdueActs > 0 ? '#ef4444' : '#10b981' }}>{stats.overdueActs}</div>
                </div>
            </div>

            {/* Quota Progress */}
            <div className="chart-card" style={{ marginTop: 16, padding: '12px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>🎯 Monthly Quota Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: stats.quotaPct >= 100 ? '#10b981' : '#5EEAD4' }}>
                        {fmt(stats.wonValue)} / {fmt(stats.quota)} ({stats.quotaPct}%)
                    </span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-bar-fill" style={{
                        width: `${stats.quotaPct}%`,
                        background: stats.quotaPct >= 100 ? '#10b981' : stats.quotaPct >= 70 ? '#3b82f6' : stats.quotaPct >= 40 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.5s ease'
                    }} />
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: 16 }}>
                {/* Stage Distribution */}
                <div className="chart-card">
                    <div className="chart-card-title">Stage Distribution</div>
                    <div className="bar-chart">
                        {stageDist.map((s, i) => (
                            <div className="bar-row" key={s.stage}>
                                <div className="bar-row-label">{s.stage}</div>
                                <div className="bar-row-track">
                                    <div className="bar-row-fill" style={{ width: `${s.pct}%`, background: colors[i % colors.length] }} />
                                </div>
                                <div className="bar-row-value">{s.count}</div>
                            </div>
                        ))}
                        {stageDist.length === 0 && <div className="empty-state"><p>No deals yet</p></div>}
                    </div>
                </div>

                <div>
                    {/* Quick Stats */}
                    <div className="chart-card" style={{ marginBottom: 12 }}>
                        <div className="chart-card-title">Quick Stats</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div className="deal-detail-item"><div className="label">Contacts</div><div className="value">{contacts.length}</div></div>
                            <div className="deal-detail-item"><div className="label">Companies</div><div className="value">{companies.length}</div></div>
                            <div className="deal-detail-item"><div className="label">Total Deals</div><div className="value">{deals.length}</div></div>
                            <div className="deal-detail-item"><div className="label">Lost</div><div className="value" style={{ color: '#ef4444' }}>{stats.lost.length}</div></div>
                        </div>
                    </div>

                    {/* Pipeline Value by Stage */}
                    <div className="chart-card">
                        <div className="chart-card-title">Value by Stage</div>
                        {stageValueDist.length > 0 ? stageValueDist.map((s, i) => (
                            <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ width: 70, fontSize: 11, color: 'var(--text-muted)' }}>{s.stage}</span>
                                <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                                    <div className="progress-bar-fill" style={{ width: `${s.pct}%`, background: colors[i % colors.length] }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>{fmt(s.value)}</span>
                            </div>
                        )) : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No open deals</div>}
                    </div>
                </div>
            </div>

            {/* Bottom: Recent Deals + Upcoming Activities */}
            <div className="dashboard-grid" style={{ marginTop: 16 }}>
                <div className="chart-card">
                    <div className="chart-card-title">Recent Deals</div>
                    <div className="data-table-wrap" style={{ border: 'none' }}>
                        <table className="data-table">
                            <thead><tr><th>Deal</th><th>Company</th><th>Stage</th><th>Value</th><th>Label</th></tr></thead>
                            <tbody>
                                {recentDeals.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 500 }}>{d.title}</td>
                                        <td>{d.company || '—'}</td>
                                        <td><span className="tag tag-accent">{d.stage}</span></td>
                                        <td style={{ fontWeight: 600, color: '#10b981' }}>{fmt(d.value)}</td>
                                        <td><span className={`kanban-card-label label-${d.label}`}>{d.label}</span></td>
                                    </tr>
                                ))}
                                {recentDeals.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No deals found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card-title">Upcoming Activities</div>
                    {upcomingActs.length > 0 ? upcomingActs.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 16 }}>{a.type === 'call' ? '📞' : a.type === 'email' ? '📧' : a.type === 'meeting' ? '🤝' : a.type === 'deadline' ? '⏰' : '📋'}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.dueDate || 'No date'}{a.priority === 'high' ? ' · 🔴 High' : ''}</div>
                            </div>
                        </div>
                    )) : <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 12 }}>No pending activities</div>}
                </div>
            </div>
        </div>
    );
}
