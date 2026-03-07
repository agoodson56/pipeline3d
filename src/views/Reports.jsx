import { useState, useMemo } from 'react';
import { fmt } from '../utils.js';

const STAGES_ORDER = ['Lead In', 'Contact Made', 'Needs Analysis', 'Proposal', 'Negotiation', 'Won'];

export default function Reports({ deals, contacts, companies, activities, pipelines }) {
    const [tab, setTab] = useState('overview');

    const stats = useMemo(() => {
        const won = deals.filter(d => d.stage === 'Won');
        const lost = deals.filter(d => d.stage === 'Lost');
        const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
        const total = deals.length;
        const closed = won.length + lost.length;
        const winRate = closed > 0 ? Math.round(won.length / closed * 100) : 0;
        const avgDeal = open.length > 0 ? open.reduce((s, d) => s + d.value, 0) / open.length : 0;
        const avgWonDeal = won.length > 0 ? won.reduce((s, d) => s + d.value, 0) / won.length : 0;
        const avgDaysOpen = open.length > 0 ? Math.round(open.reduce((s, d) => s + (d.daysOpen || 0), 0) / open.length) : 0;
        const pipelineVelocity = avgDaysOpen > 0 ? Math.round(avgDeal * (winRate / 100) * open.length / avgDaysOpen) : 0;
        const completedActs = activities.filter(a => a.done).length;
        const totalActs = activities.length;
        const actCompRate = totalActs > 0 ? Math.round(completedActs / totalActs * 100) : 0;
        const totalPipelineValue = open.reduce((s, d) => s + d.value, 0);
        const weightedPipeline = open.reduce((s, d) => s + d.value * (d.probability || 0) / 100, 0);
        const wonRevenue = won.reduce((s, d) => s + d.value, 0);
        const lostRevenue = lost.reduce((s, d) => s + d.value, 0);

        return {
            won, lost, open, total, closed, winRate, avgDeal, avgWonDeal, avgDaysOpen,
            pipelineVelocity, completedActs, totalActs, actCompRate, totalPipelineValue, weightedPipeline, wonRevenue, lostRevenue
        };
    }, [deals, activities]);

    // Conversion funnel data
    const funnelData = useMemo(() => {
        const stageMap = {};
        deals.forEach(d => { stageMap[d.stage] = (stageMap[d.stage] || 0) + 1; });
        // Create running totals: deals that reached each stage or beyond
        const result = [];
        let prevCount = deals.length;
        STAGES_ORDER.forEach((stage, i) => {
            // Count deals at this stage or any later stage
            const atOrBeyond = STAGES_ORDER.slice(i).reduce((s, st) => s + (stageMap[st] || 0), 0);
            const convRate = prevCount > 0 ? Math.round(atOrBeyond / prevCount * 100) : 0;
            result.push({ stage, count: atOrBeyond, convRate, dropoff: prevCount - atOrBeyond });
            prevCount = atOrBeyond || 1;
        });
        return result;
    }, [deals]);

    // Value by stage
    const stageValues = useMemo(() => {
        const map = {};
        deals.forEach(d => {
            if (!map[d.stage]) map[d.stage] = { count: 0, value: 0 };
            map[d.stage].count++;
            map[d.stage].value += d.value || 0;
        });
        return Object.entries(map).sort((a, b) => b[1].value - a[1].value).map(([stage, data]) => ({ stage, ...data }));
    }, [deals]);

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

    // Deal age distribution
    const ageDistro = useMemo(() => {
        const buckets = { '0-7d': 0, '8-14d': 0, '15-30d': 0, '31-60d': 0, '60d+': 0 };
        deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').forEach(d => {
            const days = d.daysOpen || 0;
            if (days <= 7) buckets['0-7d']++;
            else if (days <= 14) buckets['8-14d']++;
            else if (days <= 30) buckets['15-30d']++;
            else if (days <= 60) buckets['31-60d']++;
            else buckets['60d+']++;
        });
        return buckets;
    }, [deals]);

    // Lead sources (from custom fields or label)
    const leadSources = useMemo(() => {
        const map = {};
        deals.forEach(d => {
            const src = d.customFields?.leadSource || 'Unknown';
            if (!map[src]) map[src] = { count: 0, value: 0, won: 0 };
            map[src].count++;
            map[src].value += d.value || 0;
            if (d.stage === 'Won') map[src].won++;
        });
        return Object.entries(map).sort((a, b) => b[1].value - a[1].value);
    }, [deals]);

    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
    const maxValue = Math.max(...stageValues.map(s => s.value), 1);
    const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

    return (
        <div>
            <div className="detail-tabs" style={{ marginBottom: 20 }}>
                <button className={`detail-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📊 Overview</button>
                <button className={`detail-tab ${tab === 'funnel' ? 'active' : ''}`} onClick={() => setTab('funnel')}>🔻 Conversion Funnel</button>
                <button className={`detail-tab ${tab === 'goals' ? 'active' : ''}`} onClick={() => setTab('goals')}>🎯 Goals & Quotas</button>
                <button className={`detail-tab ${tab === 'sources' ? 'active' : ''}`} onClick={() => setTab('sources')}>📡 Lead Sources</button>
            </div>

            {tab === 'overview' && (
                <div>
                    {/* KPI Row */}
                    <div className="kpi-grid">
                        <div className="kpi-card"><div className="kpi-label">Win Rate</div><div className="kpi-value" style={{ color: stats.winRate >= 30 ? '#10b981' : '#ef4444' }}>{stats.winRate}%</div><div className="kpi-sub">{stats.won.length} won / {stats.closed} closed</div></div>
                        <div className="kpi-card"><div className="kpi-label">Avg Deal Size</div><div className="kpi-value">{fmt(stats.avgDeal)}</div><div className="kpi-sub">{stats.open.length} open deals</div></div>
                        <div className="kpi-card"><div className="kpi-label">Avg Days Open</div><div className="kpi-value">{stats.avgDaysOpen}</div><div className="kpi-sub">Sales cycle length</div></div>
                        <div className="kpi-card"><div className="kpi-label">Pipeline Velocity</div><div className="kpi-value" style={{ color: '#a5b4fc' }}>{fmt(stats.pipelineVelocity)}</div><div className="kpi-sub">Revenue per day potential</div></div>
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
                                        <div className="bar-row-value">{fmt(s.value)} ({s.count})</div>
                                    </div>
                                ))}
                                {stageValues.length === 0 && <div className="empty-state"><p>No data</p></div>}
                            </div>
                        </div>

                        <div>
                            {/* Deal Temperature */}
                            <div className="chart-card" style={{ marginBottom: 16 }}>
                                <div className="chart-card-title">Deal Temperature</div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}><div className="label">🔥 Hot</div><div className="value" style={{ color: '#ef4444', fontSize: 24 }}>{labelDist.hot}</div></div>
                                    <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}><div className="label">☀️ Warm</div><div className="value" style={{ color: '#f59e0b', fontSize: 24 }}>{labelDist.warm}</div></div>
                                    <div className="deal-detail-item" style={{ flex: 1, textAlign: 'center' }}><div className="label">❄️ Cold</div><div className="value" style={{ color: '#3b82f6', fontSize: 24 }}>{labelDist.cold}</div></div>
                                </div>
                            </div>

                            {/* Activity Completion */}
                            <div className="chart-card" style={{ marginBottom: 16 }}>
                                <div className="chart-card-title">Activity Completion</div>
                                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: stats.actCompRate >= 50 ? '#10b981' : '#f59e0b' }}>{stats.actCompRate}%</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{stats.completedActs} of {stats.totalActs} completed</div>
                                </div>
                                <div className="progress-bar" style={{ height: 8 }}>
                                    <div className="progress-bar-fill" style={{ width: `${stats.actCompRate}%`, background: stats.actCompRate >= 50 ? '#10b981' : '#f59e0b' }} />
                                </div>
                            </div>

                            {/* Deal Age */}
                            <div className="chart-card">
                                <div className="chart-card-title">Deal Age Distribution</div>
                                {Object.entries(ageDistro).map(([bucket, count]) => (
                                    <div key={bucket} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ width: 50, fontSize: 11, color: 'var(--text-muted)' }}>{bucket}</span>
                                        <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${stats.open.length > 0 ? (count / stats.open.length * 100) : 0}%`,
                                                background: bucket === '60d+' ? '#ef4444' : bucket === '31-60d' ? '#f97316' : '#6366f1'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 20, textAlign: 'right' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Deals + Revenue Summary */}
                    <div className="dashboard-grid" style={{ marginTop: 16 }}>
                        <div className="chart-card">
                            <div className="chart-card-title">Top Open Deals</div>
                            <div className="data-table-wrap" style={{ border: 'none' }}>
                                <table className="data-table">
                                    <thead><tr><th>Deal</th><th>Company</th><th>Stage</th><th>Value</th><th>Weighted</th></tr></thead>
                                    <tbody>
                                        {topDeals.map(d => (
                                            <tr key={d.id}>
                                                <td style={{ fontWeight: 500 }}>{d.title}</td>
                                                <td>{d.company || '—'}</td>
                                                <td><span className="tag tag-accent">{d.stage}</span></td>
                                                <td style={{ color: '#10b981', fontWeight: 700 }}>{fmt(d.value)}</td>
                                                <td style={{ color: '#a5b4fc' }}>{fmt(d.value * d.probability / 100)}</td>
                                            </tr>
                                        ))}
                                        {topDeals.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No deals</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <div className="chart-card" style={{ marginBottom: 12 }}>
                                <div className="chart-card-title">Revenue Summary</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Open Pipeline</span><span style={{ fontWeight: 700 }}>{fmt(stats.totalPipelineValue)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Weighted Pipeline</span><span style={{ fontWeight: 700, color: '#a5b4fc' }}>{fmt(stats.weightedPipeline)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Won Revenue</span><span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(stats.wonRevenue)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Lost Revenue</span><span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(stats.lostRevenue)}</span></div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                                        <span>Avg Won Deal</span><span style={{ color: '#10b981' }}>{fmt(stats.avgWonDeal)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="kpi-card"><div className="kpi-label">Contacts</div><div className="kpi-value">{contacts.length}</div></div>
                                <div className="kpi-card"><div className="kpi-label">Companies</div><div className="kpi-value">{companies.length}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'funnel' && (
                <div>
                    <h3 style={{ marginBottom: 16 }}>Stage-to-Stage Conversion Funnel</h3>
                    <div className="chart-card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {funnelData.map((stage, i) => {
                                const widthPct = maxFunnel > 0 ? Math.max(12, (stage.count / maxFunnel) * 100) : 12;
                                return (
                                    <div key={stage.stage}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{
                                                width: `${widthPct}%`, padding: '14px 16px',
                                                background: `linear-gradient(135deg, ${colors[i % colors.length]}33, ${colors[i % colors.length]}11)`,
                                                border: `1px solid ${colors[i % colors.length]}44`,
                                                borderRadius: 'var(--radius-md)', textAlign: 'center',
                                                margin: '2px auto', transition: 'all 0.3s',
                                            }}>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>{stage.stage}</div>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: colors[i % colors.length] }}>{stage.count}</div>
                                            </div>
                                        </div>
                                        {i < funnelData.length - 1 && (
                                            <div style={{ textAlign: 'center', padding: '4px 0', fontSize: 11, color: 'var(--text-muted)' }}>
                                                ▼ {funnelData[i + 1].convRate}% conversion · {stage.dropoff} dropped
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="kpi-grid" style={{ marginTop: 16 }}>
                        <div className="kpi-card"><div className="kpi-label">Overall Conversion</div><div className="kpi-value" style={{ color: '#10b981' }}>{stats.total > 0 ? Math.round(stats.won.length / stats.total * 100) : 0}%</div><div className="kpi-sub">Lead → Won</div></div>
                        <div className="kpi-card"><div className="kpi-label">Biggest Dropoff</div><div className="kpi-value" style={{ color: '#f59e0b' }}>{funnelData.length > 0 ? funnelData.reduce((max, s) => s.dropoff > max.dropoff ? s : max, funnelData[0]).stage : '—'}</div><div className="kpi-sub">Most deals lost at this stage</div></div>
                        <div className="kpi-card"><div className="kpi-label">Avg Days to Close</div><div className="kpi-value">{stats.avgDaysOpen}</div><div className="kpi-sub">From lead to won</div></div>
                        <div className="kpi-card"><div className="kpi-label">Deals Lost</div><div className="kpi-value" style={{ color: '#ef4444' }}>{stats.lost.length}</div><div className="kpi-sub">{fmt(stats.lostRevenue)} lost revenue</div></div>
                    </div>
                </div>
            )}

            {tab === 'goals' && (
                <div>
                    <h3 style={{ marginBottom: 16 }}>Sales Goals & Quota Tracking</h3>
                    <div className="dashboard-grid">
                        <div className="chart-card">
                            <div className="chart-card-title">Monthly Revenue Goal</div>
                            {[
                                { label: 'Monthly Quota', target: 100000, actual: stats.wonRevenue, color: '#6366f1' },
                                { label: 'Pipeline Target', target: 300000, actual: stats.totalPipelineValue, color: '#3b82f6' },
                                { label: 'Deals Won Target', target: 5, actual: stats.won.length, color: '#10b981' },
                                { label: 'Activities Target', target: 50, actual: stats.completedActs, color: '#f59e0b' },
                            ].map(goal => {
                                const pct = Math.min(100, Math.round((goal.actual / goal.target) * 100));
                                return (
                                    <div key={goal.label} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                            <span>{goal.label}</span>
                                            <span style={{ fontWeight: 600 }}>{typeof goal.actual === 'number' && goal.target > 100 ? fmt(goal.actual) : goal.actual} / {goal.target > 100 ? fmt(goal.target) : goal.target}</span>
                                        </div>
                                        <div className="progress-bar" style={{ height: 12 }}>
                                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : goal.color }} />
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 11, color: pct >= 100 ? '#10b981' : 'var(--text-muted)', marginTop: 2 }}>
                                            {pct}% {pct >= 100 ? '✓ Goal Met!' : 'to target'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <div className="chart-card" style={{ marginBottom: 12 }}>
                                <div className="chart-card-title">Win/Loss Ratio</div>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, padding: 12 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{stats.won.length}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>WON</div>
                                    </div>
                                    <div style={{ fontSize: 24, color: '#64748b' }}>vs</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, fontWeight: 800, color: '#ef4444' }}>{stats.lost.length}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>LOST</div>
                                    </div>
                                </div>
                                <div className="progress-bar" style={{ height: 10 }}>
                                    <div style={{ display: 'flex', height: '100%', borderRadius: 5, overflow: 'hidden' }}>
                                        <div style={{ width: `${stats.winRate}%`, background: '#10b981', transition: 'width 0.5s' }} />
                                        <div style={{ flex: 1, background: '#ef4444' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="chart-card">
                                <div className="chart-card-title">Activity Types</div>
                                {actTypes.length > 0 ? actTypes.map(([type, count]) => (
                                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 80, fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type}s</span>
                                        <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                                            <div className="progress-bar-fill" style={{ width: `${(count / Math.max(...actTypes.map(a => a[1]))) * 100}%`, background: '#8b5cf6' }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 20, textAlign: 'right' }}>{count}</span>
                                    </div>
                                )) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activities yet</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'sources' && (
                <div>
                    <h3 style={{ marginBottom: 16 }}>Lead Source Performance</h3>
                    <div className="chart-card">
                        <div className="data-table-wrap" style={{ border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Source</th><th>Deals</th><th>Pipeline Value</th><th>Won</th><th>Win Rate</th></tr></thead>
                                <tbody>
                                    {leadSources.map(([src, data]) => (
                                        <tr key={src}>
                                            <td style={{ fontWeight: 600 }}>{src}</td>
                                            <td>{data.count}</td>
                                            <td style={{ color: '#10b981', fontWeight: 600 }}>{fmt(data.value)}</td>
                                            <td>{data.won}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                                        <div className="progress-bar-fill" style={{ width: `${data.count > 0 ? (data.won / data.count * 100) : 0}%`, background: '#10b981' }} />
                                                    </div>
                                                    <span style={{ fontSize: 12 }}>{data.count > 0 ? Math.round(data.won / data.count * 100) : 0}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {leadSources.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No data — deals need a Lead Source custom field</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
