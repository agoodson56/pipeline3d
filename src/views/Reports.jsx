import { useMemo } from 'react';
import { fmt } from '../utils.js';

export default function Reports({ deals, contacts, companies, activities }) {
    const stats = useMemo(() => {
        const won = deals.filter(d => d.stage === 'Won');
        const lost = deals.filter(d => d.stage === 'Lost');
        const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
        const total = deals.length;
        const winRate = total > 0 ? Math.round(won.length / total * 100) : 0;
        const avgDeal = open.length > 0 ? open.reduce((s, d) => s + d.value, 0) / open.length : 0;
        const avgDaysOpen = open.length > 0 ? Math.round(open.reduce((s, d) => s + (d.daysOpen || 0), 0) / open.length) : 0;
        const pipelineVelocity = avgDaysOpen > 0 ? Math.round(avgDeal * (winRate / 100) * open.length / avgDaysOpen) : 0;
        const completedActs = activities.filter(a => a.done).length;
        const totalActs = activities.length;
        const actCompRate = totalActs > 0 ? Math.round(completedActs / totalActs * 100) : 0;

        return { won, lost, open, total, winRate, avgDeal, avgDaysOpen, pipelineVelocity, completedActs, totalActs, actCompRate };
    }, [deals, activities]);

    // Value by stage
    const stageValues = useMemo(() => {
        const map = {};
        deals.forEach(d => {
            if (!map[d.stage]) map[d.stage] = { count: 0, value: 0 };
            map[d.stage].count++;
            map[d.stage].value += d.value || 0;
        });
        return Object.entries(map)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([stage, data]) => ({ stage, ...data }));
    }, [deals]);

    const maxValue = Math.max(...stageValues.map(s => s.value), 1);

    // Label distribution
    const labelDist = useMemo(() => {
        const map = { hot: 0, warm: 0, cold: 0 };
        deals.forEach(d => { if (map[d.label] !== undefined) map[d.label]++; });
        return map;
    }, [deals]);

    // Top deals
    const topDeals = useMemo(() =>
        [...deals].filter(d => d.stage !== 'Won' && d.stage !== 'Lost').sort((a, b) => b.value - a.value).slice(0, 5)
        , [deals]);

    // Activity type breakdown
    const actTypes = useMemo(() => {
        const map = {};
        activities.forEach(a => { map[a.type] = (map[a.type] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [activities]);

    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

    return (
        <div>
            {/* KPI Row */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Win Rate</div>
                    <div className="kpi-value" style={{ color: stats.winRate >= 30 ? '#10b981' : '#ef4444' }}>{stats.winRate}%</div>
                    <div className="kpi-sub">{stats.won.length} won / {stats.total} total</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Avg Deal Size</div>
                    <div className="kpi-value">{fmt(stats.avgDeal)}</div>
                    <div className="kpi-sub">{stats.open.length} open deals</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Avg Days Open</div>
                    <div className="kpi-value">{stats.avgDaysOpen}</div>
                    <div className="kpi-sub">Sales cycle length</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Pipeline Velocity</div>
                    <div className="kpi-value" style={{ color: '#a5b4fc' }}>{fmt(stats.pipelineVelocity)}</div>
                    <div className="kpi-sub">Revenue per day potential</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Value by Stage */}
                <div className="chart-card">
                    <div className="chart-card-title">Value by Stage</div>
                    <div className="bar-chart">
                        {stageValues.map((s, i) => (
                            <div className="bar-row" key={s.stage}>
                                <div className="bar-row-label">{s.stage}</div>
                                <div className="bar-row-track">
                                    <div className="bar-row-fill" style={{ width: `${(s.value / maxValue) * 100}%`, background: colors[i % colors.length] }} />
                                </div>
                                <div className="bar-row-value">{fmt(s.value)}</div>
                            </div>
                        ))}
                        {stageValues.length === 0 && <div className="empty-state"><p>No data</p></div>}
                    </div>
                </div>

                {/* Right Column Stats */}
                <div>
                    {/* Label Distribution */}
                    <div className="chart-card" style={{ marginBottom: 16 }}>
                        <div className="chart-card-title">Deal Temperature</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}>
                                <div className="label">🔥 Hot</div>
                                <div className="value" style={{ color: '#ef4444', fontSize: 24 }}>{labelDist.hot}</div>
                            </div>
                            <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}>
                                <div className="label">☀️ Warm</div>
                                <div className="value" style={{ color: '#f59e0b', fontSize: 24 }}>{labelDist.warm}</div>
                            </div>
                            <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}>
                                <div className="label">❄️ Cold</div>
                                <div className="value" style={{ color: '#3b82f6', fontSize: 24 }}>{labelDist.cold}</div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Completion */}
                    <div className="chart-card">
                        <div className="chart-card-title">Activity Completion</div>
                        <div style={{ textAlign: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: stats.actCompRate >= 50 ? '#10b981' : '#f59e0b' }}>
                                {stats.actCompRate}%
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{stats.completedActs} of {stats.totalActs} completed</div>
                        </div>
                        <div className="progress-bar" style={{ height: 10 }}>
                            <div className="progress-bar-fill"
                                style={{ width: `${stats.actCompRate}%`, background: stats.actCompRate >= 50 ? '#10b981' : '#f59e0b' }} />
                        </div>
                        {actTypes.length > 0 && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {actTypes.map(([type, count]) => (
                                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{type}s</span>
                                        <span style={{ fontWeight: 600 }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Deals Table */}
            <div className="chart-card">
                <div className="chart-card-title">Top Open Deals by Value</div>
                <div className="data-table-wrap" style={{ border: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Deal</th><th>Company</th><th>Stage</th><th>Value</th><th>Probability</th><th>Weighted</th></tr>
                        </thead>
                        <tbody>
                            {topDeals.map(d => (
                                <tr key={d.id}>
                                    <td>{d.title}</td>
                                    <td>{d.company || '—'}</td>
                                    <td><span className="tag tag-accent">{d.stage}</span></td>
                                    <td style={{ fontWeight: 700, color: '#10b981' }}>{fmt(d.value)}</td>
                                    <td>{d.probability}%</td>
                                    <td style={{ fontWeight: 600, color: '#a5b4fc' }}>{fmt(d.value * (d.probability || 0) / 100)}</td>
                                </tr>
                            ))}
                            {topDeals.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>No open deals</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="kpi-grid" style={{ marginTop: 20 }}>
                <div className="kpi-card">
                    <div className="kpi-label">Total Contacts</div>
                    <div className="kpi-value">{contacts.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Companies</div>
                    <div className="kpi-value">{companies.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Total Deals</div>
                    <div className="kpi-value">{deals.length}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Pipeline Coverage</div>
                    <div className="kpi-value">{deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.value, 0) / 100000 * 100) : 0}%</div>
                    <div className="kpi-sub">vs $100K quota</div>
                </div>
            </div>
        </div>
    );
}
