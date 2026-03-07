import { useMemo } from 'react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Forecast({ deals }) {
    const quota = 100000; // monthly quota

    const forecast = useMemo(() => {
        return MONTHS.map((name, i) => {
            const monthDeals = deals.filter(d => {
                const ec = (d.expectedClose || '').toLowerCase();
                return ec.includes(name.toLowerCase()) || ec === MONTHS[i].toLowerCase();
            });
            const total = monthDeals.reduce((s, d) => s + (d.value || 0), 0);
            const weighted = monthDeals.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0);
            const pct = Math.min(100, Math.round((total / quota) * 100));
            return { name, total, weighted, pct, count: monthDeals.length };
        });
    }, [deals]);

    const totalPipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
    const weightedTotal = deals.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0);

    return (
        <div>
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <div className="kpi-card">
                    <div className="kpi-label">Annual Quota</div>
                    <div className="kpi-value">{fmt(quota * 12)}</div>
                    <div className="kpi-sub">{fmt(quota)} / month</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Total Pipeline</div>
                    <div className="kpi-value" style={{ color: '#a5b4fc' }}>{fmt(totalPipeline)}</div>
                    <div className="kpi-sub">{deals.length} deals</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Weighted Forecast</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{fmt(weightedTotal)}</div>
                    <div className="kpi-sub">Probability-adjusted</div>
                </div>
            </div>

            <div className="forecast-grid">
                {forecast.map(m => (
                    <div className="forecast-month" key={m.name}>
                        <h4>{m.name}</h4>
                        <div className="forecast-bar">
                            <div className="forecast-bar-fill" style={{ width: `${m.pct}%` }} />
                        </div>
                        <div className="forecast-stat">
                            <span>Pipeline: {fmt(m.total)}</span>
                            <span>{m.count} deals</span>
                        </div>
                        <div className="forecast-stat" style={{ marginTop: 4 }}>
                            <span>Weighted: {fmt(m.weighted)}</span>
                            <span>{m.pct}% of quota</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
