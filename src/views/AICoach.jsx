import { useState, useMemo } from 'react';
import { fmt } from '../utils.js';

// AI scoring engine — runs locally, no API key needed
function scoreDeal(deal) {
    let score = 50;
    const reasons = [];

    // Value scoring
    if (deal.value >= 50000) { score += 12; reasons.push({ text: 'High-value deal', impact: '+' }); }
    else if (deal.value >= 20000) { score += 6; reasons.push({ text: 'Mid-range deal value', impact: '+' }); }
    else if (deal.value < 5000) { score -= 5; reasons.push({ text: 'Low deal value', impact: '-' }); }

    // Probability
    if (deal.probability >= 70) { score += 15; reasons.push({ text: 'High probability (>70%)', impact: '+' }); }
    else if (deal.probability >= 40) { score += 8; reasons.push({ text: 'Moderate probability', impact: '~' }); }
    else { score -= 8; reasons.push({ text: 'Low probability (<40%)', impact: '-' }); }

    // Stage progression
    const stageRank = { 'Lead In': 1, 'Contact Made': 2, 'Needs Analysis': 3, 'Proposal': 4, 'Negotiation': 5, 'Won': 6 };
    const rank = stageRank[deal.stage] || 1;
    if (rank >= 4) { score += 10; reasons.push({ text: 'Advanced stage (Proposal+)', impact: '+' }); }
    else if (rank <= 1) { score -= 5; reasons.push({ text: 'Early stage — needs progression', impact: '-' }); }

    // Days open
    if (deal.daysOpen > 60) { score -= 12; reasons.push({ text: `Aging deal (${deal.daysOpen} days)`, impact: '-' }); }
    else if (deal.daysOpen > 30) { score -= 5; reasons.push({ text: 'Approaching stale threshold', impact: '-' }); }
    else if (deal.daysOpen < 14) { score += 5; reasons.push({ text: 'Fresh deal with momentum', impact: '+' }); }

    // Label
    if (deal.label === 'hot') { score += 8; reasons.push({ text: 'Hot label — buyer is engaged', impact: '+' }); }
    else if (deal.label === 'cold') { score -= 8; reasons.push({ text: 'Cold label — needs re-engagement', impact: '-' }); }

    // Contact info
    if (deal.contact) { score += 3; reasons.push({ text: 'Contact identified', impact: '+' }); }
    else { score -= 5; reasons.push({ text: 'No contact assigned', impact: '-' }); }

    // Notes
    if (deal.notes?.length >= 3) { score += 5; reasons.push({ text: 'Well-documented (3+ notes)', impact: '+' }); }
    else if (!deal.notes?.length) { score -= 3; reasons.push({ text: 'No notes — add context', impact: '-' }); }

    score = Math.max(5, Math.min(99, score));
    return { score, reasons, grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D' };
}

function generateRecommendations(deal, scoreData) {
    const recs = [];
    if (deal.daysOpen > 30) recs.push({ icon: '⏰', text: 'Schedule a check-in call — this deal is aging', priority: 'high' });
    if (!deal.contact) recs.push({ icon: '👤', text: 'Identify and assign a primary contact', priority: 'high' });
    if (deal.probability < 40) recs.push({ icon: '📊', text: 'Reassess qualification — probability is low', priority: 'medium' });
    if (deal.label === 'cold') recs.push({ icon: '🔥', text: 'Send a re-engagement email to warm this deal up', priority: 'high' });
    if (!deal.notes?.length) recs.push({ icon: '📝', text: 'Add deal notes to track conversation history', priority: 'medium' });
    if (deal.value > 30000 && deal.probability < 50) recs.push({ icon: '🤝', text: 'High-value deal needs executive sponsor involvement', priority: 'high' });
    if (scoreData.grade === 'A') recs.push({ icon: '🎯', text: 'Strong deal — push for close this week', priority: 'low' });
    const stageRank = { 'Lead In': 1, 'Contact Made': 2, 'Needs Analysis': 3, 'Proposal': 4, 'Negotiation': 5 };
    if ((stageRank[deal.stage] || 0) === 3) recs.push({ icon: '📄', text: 'Needs analysis complete? Prepare & send proposal', priority: 'medium' });
    if ((stageRank[deal.stage] || 0) >= 4) recs.push({ icon: '💰', text: 'Late stage — discuss pricing and timeline for close', priority: 'medium' });
    return recs.slice(0, 5);
}

export default function AICoach({ deals }) {
    const [selectedDealId, setSelectedDealId] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const scoredDeals = useMemo(() =>
        deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost')
            .map(d => ({ ...d, ai: scoreDeal(d) }))
            .sort((a, b) => b.ai.score - a.ai.score)
        , [deals]);

    const pipeline = useMemo(() => {
        const total = scoredDeals.length || 1;
        const avgScore = Math.round(scoredDeals.reduce((s, d) => s + d.ai.score, 0) / total);
        const atRisk = scoredDeals.filter(d => d.ai.grade === 'C' || d.ai.grade === 'D').length;
        const strong = scoredDeals.filter(d => d.ai.grade === 'A').length;
        return { avgScore, atRisk, strong, total: scoredDeals.length };
    }, [scoredDeals]);

    const selectedDeal = scoredDeals.find(d => d.id === selectedDealId);
    const recommendations = selectedDeal ? generateRecommendations(selectedDeal, selectedDeal.ai) : [];

    const handleAnalyze = (dealId) => {
        setAnalyzing(true);
        setTimeout(() => { setSelectedDealId(dealId); setAnalyzing(false); }, 800);
    };

    const gradeColor = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

    return (
        <div>
            {/* Pipeline Health */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">🧠 Pipeline Health Score</div>
                    <div className="kpi-value" style={{ color: pipeline.avgScore >= 60 ? '#10b981' : '#f59e0b' }}>{pipeline.avgScore}/100</div>
                    <div className="kpi-sub">AI-calculated average</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">🟢 Strong Deals (A)</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{pipeline.strong}</div>
                    <div className="kpi-sub">Ready to close</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">🔴 At Risk (C/D)</div>
                    <div className="kpi-value" style={{ color: '#ef4444' }}>{pipeline.atRisk}</div>
                    <div className="kpi-sub">Need attention</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">📊 Active Deals</div>
                    <div className="kpi-value">{pipeline.total}</div>
                    <div className="kpi-sub">Being scored</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Scored Deal List */}
                <div className="chart-card">
                    <div className="chart-card-title">AI Deal Scores</div>
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                        {scoredDeals.map(deal => (
                            <div key={deal.id}
                                onClick={() => handleAnalyze(deal.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)', transition: 'background 0.15s',
                                    background: selectedDealId === deal.id ? 'var(--bg-hover)' : 'transparent'
                                }}
                                onMouseEnter={e => { if (selectedDealId !== deal.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => { if (selectedDealId !== deal.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 14, background: gradeColor[deal.ai.grade] + '22', color: gradeColor[deal.ai.grade]
                                }}>
                                    {deal.ai.grade}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{deal.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deal.company || deal.contact || '—'} · {deal.stage}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: gradeColor[deal.ai.grade] }}>{deal.ai.score}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(deal.value)}</div>
                                </div>
                            </div>
                        ))}
                        {scoredDeals.length === 0 && <div className="empty-state"><p>No active deals to analyze</p></div>}
                    </div>
                </div>

                {/* Analysis Panel */}
                <div>
                    {analyzing && (
                        <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Analyzing deal…</p>
                        </div>
                    )}

                    {selectedDeal && !analyzing && (
                        <>
                            <div className="chart-card" style={{ marginBottom: 16 }}>
                                <div className="chart-card-title">🧠 AI Analysis — {selectedDeal.title}</div>
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 28, fontWeight: 800, border: `3px solid ${gradeColor[selectedDeal.ai.grade]}`,
                                        color: gradeColor[selectedDeal.ai.grade], background: gradeColor[selectedDeal.ai.grade] + '11'
                                    }}>
                                        {selectedDeal.ai.score}
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: gradeColor[selectedDeal.ai.grade] }}>
                                        Grade {selectedDeal.ai.grade}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {selectedDeal.ai.reasons.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                                            <span style={{
                                                width: 20, textAlign: 'center', fontWeight: 700,
                                                color: r.impact === '+' ? '#10b981' : r.impact === '-' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {r.impact === '+' ? '▲' : r.impact === '-' ? '▼' : '●'}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{r.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-card-title">💡 AI Recommendations</div>
                                {recommendations.map((rec, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                                        borderBottom: i < recommendations.length - 1 ? '1px solid var(--border)' : 'none'
                                    }}>
                                        <span style={{ fontSize: 18 }}>{rec.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{rec.text}</div>
                                            <span className={`tag ${rec.priority === 'high' ? 'tag-red' : rec.priority === 'medium' ? 'tag-accent' : 'tag-green'}`}
                                                style={{ marginTop: 4, fontSize: 10 }}>{rec.priority}</span>
                                        </div>
                                    </div>
                                ))}
                                {recommendations.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recommendations — deal looks solid!</p>}
                            </div>
                        </>
                    )}

                    {!selectedDeal && !analyzing && (
                        <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
                            <h3>AI Deal Coach</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a deal to get AI-powered scoring, analysis, and action recommendations.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
