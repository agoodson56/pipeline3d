import { useState, useMemo } from 'react';
import { fmt } from '../utils.js';
import * as api from '../api.js';

const GEMINI_KEY = 'AIzaSyAlM3SYPTt7iqRCZTjb7axvg_S5se4Q2_8';

async function askGemini(prompt, maxTokens = 2048) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
        }),
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Local scoring engine (instant, no API) ─────────────────
function scoreDeal(deal) {
    let score = 50;
    const reasons = [];
    if (deal.value >= 50000) { score += 12; reasons.push({ text: 'High-value deal', impact: '+' }); }
    else if (deal.value >= 20000) { score += 6; reasons.push({ text: 'Mid-range deal value', impact: '+' }); }
    else if (deal.value < 5000) { score -= 5; reasons.push({ text: 'Low deal value', impact: '-' }); }
    if (deal.probability >= 70) { score += 15; reasons.push({ text: 'High probability (>70%)', impact: '+' }); }
    else if (deal.probability >= 40) { score += 8; reasons.push({ text: 'Moderate probability', impact: '~' }); }
    else { score -= 8; reasons.push({ text: 'Low probability (<40%)', impact: '-' }); }
    const stageRank = { 'Lead In': 1, 'Contact Made': 2, 'Site Survey': 3, 'Proposal': 4, 'Negotiation': 5, 'Won': 6 };
    const rank = stageRank[deal.stage] || 1;
    if (rank >= 4) { score += 10; reasons.push({ text: 'Advanced stage (Proposal+)', impact: '+' }); }
    else if (rank <= 1) { score -= 5; reasons.push({ text: 'Early stage — needs progression', impact: '-' }); }
    if (deal.daysOpen > 60) { score -= 12; reasons.push({ text: `Aging deal (${deal.daysOpen} days)`, impact: '-' }); }
    else if (deal.daysOpen > 30) { score -= 5; reasons.push({ text: 'Approaching stale threshold', impact: '-' }); }
    else if (deal.daysOpen < 14) { score += 5; reasons.push({ text: 'Fresh deal with momentum', impact: '+' }); }
    if (deal.label === 'hot') { score += 8; reasons.push({ text: 'Hot label — buyer is engaged', impact: '+' }); }
    else if (deal.label === 'cold') { score -= 8; reasons.push({ text: 'Cold label — needs re-engagement', impact: '-' }); }
    if (deal.contact) { score += 3; reasons.push({ text: 'Contact identified', impact: '+' }); }
    else { score -= 5; reasons.push({ text: 'No contact assigned', impact: '-' }); }
    if (deal.notes?.length >= 3) { score += 5; reasons.push({ text: 'Well-documented (3+ notes)', impact: '+' }); }
    else if (!deal.notes?.length) { score -= 3; reasons.push({ text: 'No notes — add context', impact: '-' }); }
    score = Math.max(5, Math.min(99, score));
    return { score, reasons, grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D' };
}

export default function AICoach({ deals, contacts, companies, activities, toast }) {
    const [selectedDealId, setSelectedDealId] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [tab, setTab] = useState('coach');

    // AI-powered features state
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [askPrompt, setAskPrompt] = useState('');
    const [askResponse, setAskResponse] = useState('');
    const [proposalDraft, setProposalDraft] = useState('');
    const [winLossAnalysis, setWinLossAnalysis] = useState('');
    const [leadScores, setLeadScores] = useState('');

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
    const gradeColor = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

    // ─── AI Deep Analysis (Gemini Pro) ──────────────────────
    const handleDeepAnalysis = async (deal) => {
        setSelectedDealId(deal.id);
        setAnalyzing(true);
        setAiInsight('');
        try {
            const prompt = `You are a senior sales strategist for 3D Technology Services Inc. (3DTSI), a low-voltage systems integrator. Analyze this deal and provide strategic coaching.

Deal: "${deal.title}"
Company: ${deal.company || 'Unknown'}
Contact: ${deal.contact || 'None'}
Value: $${deal.value?.toLocaleString() || '0'}
Stage: ${deal.stage}
Probability: ${deal.probability || 0}%
Days Open: ${deal.daysOpen || 0}
Label: ${deal.label || 'none'}
AI Score: ${deal.ai.score}/100 (Grade ${deal.ai.grade})
Notes: ${deal.notes?.length || 0} notes recorded

Provide EXACTLY this format (use these headers):

**Strategic Assessment:**
[2-3 sentences on deal health and positioning]

**Key Risks:**
• [Risk 1]
• [Risk 2]

**Action Plan (Next 7 Days):**
1. [Most critical action]
2. [Second action]
3. [Third action]

**Closing Strategy:**
[1-2 sentences on how to move this deal to Won]

**Estimated Win Probability:** [Your assessment]%

Keep it concise, actionable, and specific to low-voltage/systems integration sales.`;

            const result = await askGemini(prompt);
            setAiInsight(result);
        } catch (e) {
            setAiInsight('⚠️ AI analysis unavailable: ' + e.message);
        }
        setAnalyzing(false);
    };

    // ─── Ask AI (free-form coaching) ────────────────────────
    const handleAskAI = async () => {
        if (!askPrompt.trim()) return;
        setAiLoading(true);
        setAskResponse('');
        try {
            const dealContext = selectedDeal ? `\nCurrent deal: "${selectedDeal.title}" — ${selectedDeal.company} — $${selectedDeal.value?.toLocaleString()} — ${selectedDeal.stage} — ${selectedDeal.daysOpen} days open` : '';
            const pipelineContext = `\nPipeline: ${scoredDeals.length} active deals, avg score ${pipeline.avgScore}/100, ${pipeline.atRisk} at risk, total value $${scoredDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}`;

            const prompt = `You are an expert sales coach for 3D Technology Services Inc. (3DTSI), specializing in Structured Cabling, CCTV, DAS, Access Control, Audio Visual, Intrusion, Fire Alarm, and Security Systems.
${pipelineContext}${dealContext}

The sales rep asks: "${askPrompt}"

Give a concise, actionable answer. Use bullet points. Be specific to the low-voltage industry. Max 200 words.`;

            const result = await askGemini(prompt);
            setAskResponse(result);
        } catch (e) {
            setAskResponse('⚠️ ' + e.message);
        }
        setAiLoading(false);
    };

    // ─── Generate Proposal Draft ────────────────────────────
    const handleGenerateProposal = async (deal) => {
        setAiLoading(true);
        setProposalDraft('');
        try {
            const prompt = `You are a proposal writer for 3D Technology Services Inc. (3DTSI), a low-voltage systems integrator. Generate a professional project proposal outline for:

Deal: "${deal.title}"
Company: ${deal.company || 'the client'}
Contact: ${deal.contact || 'N/A'}
Value: $${deal.value?.toLocaleString() || 'TBD'}
Stage: ${deal.stage}

Generate a professional proposal with these sections:
1. **Executive Summary** - 2-3 sentences
2. **Scope of Work** - Detailed bullet points of what 3DTSI will deliver (be specific to the trade — guess from the deal title)
3. **Technical Approach** - How the work will be done, standards followed (NEC, BICSI, NFPA where applicable)
4. **Project Timeline** - Realistic phases with estimated durations
5. **Investment Summary** - Line items with the total matching the deal value
6. **Terms & Conditions** - Standard AIA terms, warranty, change order process
7. **About 3DTSI** - Brief company overview (low-voltage systems integrator, certified team, full service)

Make it professional and ready to be customized by the rep. Use the deal title to infer the trade/scope.`;

            const result = await askGemini(prompt, 3000);
            setProposalDraft(result);
            toast('📄 Proposal draft generated!');
        } catch (e) {
            setProposalDraft('⚠️ ' + e.message);
        }
        setAiLoading(false);
    };

    // ─── Win/Loss Analysis ──────────────────────────────────
    const handleWinLossAnalysis = async () => {
        setAiLoading(true);
        setWinLossAnalysis('');
        try {
            const wonDeals = deals.filter(d => d.stage === 'Won');
            const lostDeals = deals.filter(d => d.stage === 'Lost');
            const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');

            const prompt = `You are a sales analytics expert for 3D Technology Services Inc. (3DTSI). Analyze this pipeline data and provide insights.

WON DEALS (${wonDeals.length}):
${wonDeals.slice(0, 10).map(d => `• "${d.title}" — $${d.value?.toLocaleString()} — ${d.company || 'N/A'}`).join('\n') || 'None yet'}

LOST DEALS (${lostDeals.length}):
${lostDeals.slice(0, 10).map(d => `• "${d.title}" — $${d.value?.toLocaleString()} — ${d.company || 'N/A'}`).join('\n') || 'None yet'}

ACTIVE DEALS (${activeDeals.length}):
${activeDeals.slice(0, 10).map(d => `• "${d.title}" — $${d.value?.toLocaleString()} — ${d.stage} — ${d.daysOpen} days — score ${scoreDeal(d).score}`).join('\n') || 'None'}

Total Pipeline Value: $${activeDeals.reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}
Win Rate: ${wonDeals.length && (wonDeals.length + lostDeals.length) > 0 ? Math.round(wonDeals.length / (wonDeals.length + lostDeals.length) * 100) : 'N/A'}%

Provide:
**Pipeline Health Summary:**
[2-3 sentences]

**Win Pattern Analysis:**
• [What types of deals are you winning? Common traits?]

**Loss Pattern Analysis:**
• [Why are deals being lost? Common traits?]

**Top 3 Deals to Focus On This Week:**
1. [Deal name] — [why and what to do]
2. [Deal name]
3. [Deal name]

**Strategic Recommendations:**
• [3-4 actionable recommendations to improve win rate]

Be specific. Reference actual deal names from the data.`;

            const result = await askGemini(prompt, 2500);
            setWinLossAnalysis(result);
        } catch (e) {
            setWinLossAnalysis('⚠️ ' + e.message);
        }
        setAiLoading(false);
    };

    // ─── AI Lead Scoring ────────────────────────────────────
    const handleLeadScoring = async () => {
        setAiLoading(true);
        setLeadScores('');
        try {
            const earlyDeals = deals.filter(d => ['Lead In', 'Contact Made'].includes(d.stage));

            const prompt = `You are a sales qualification expert for 3D Technology Services Inc. (3DTSI), a low-voltage systems integrator.

Score these early-stage leads and recommend which to prioritize:

${earlyDeals.slice(0, 15).map(d => `• "${d.title}" — $${d.value?.toLocaleString() || '?'} — ${d.company || 'N/A'} — ${d.contact || 'No contact'} — ${d.daysOpen || 0} days — ${d.label || 'no label'} — probability ${d.probability || 0}%`).join('\n') || 'No early-stage leads found'}

For each lead, provide:
1. **Priority Rating**: 🔴 Hot (pursue immediately), 🟡 Warm (nurture), ⚪ Cold (deprioritize)
2. **Reasoning**: Why this rating (1 sentence)
3. **Next Best Action**: Specific step to take

Then provide:
**Overall Lead Quality Assessment:**
[Are these leads well-qualified? What's missing?]

**Qualification Checklist for 3DTSI Reps:**
• [Key questions to ask when qualifying low-voltage leads]

Be specific to the low-voltage/systems integration industry.`;

            const result = await askGemini(prompt, 2500);
            setLeadScores(result);
        } catch (e) {
            setLeadScores('⚠️ ' + e.message);
        }
        setAiLoading(false);
    };

    // ─── Render helpers ─────────────────────────────────────
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, marginTop: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('**')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, marginTop: 10, marginBottom: 2 }}>{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('• ') || line.startsWith('- ')) return <div key={i} style={{ fontSize: 13, paddingLeft: 16, marginBottom: 2, color: 'var(--text-secondary)' }}>• {line.slice(2)}</div>;
            if (/^\d+\.\s/.test(line)) return <div key={i} style={{ fontSize: 13, paddingLeft: 16, marginBottom: 2, color: 'var(--text-secondary)' }}>{line}</div>;
            if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
            return <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>{line.replace(/\*\*/g, '')}</div>;
        });
    };

    return (
        <div>
            {/* Pipeline Health KPIs */}
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

            {/* Feature Tabs */}
            <div className="detail-tabs" style={{ marginBottom: 16 }}>
                <button className={`detail-tab ${tab === 'coach' ? 'active' : ''}`} onClick={() => setTab('coach')}>🧠 Deal Coach</button>
                <button className={`detail-tab ${tab === 'ask' ? 'active' : ''}`} onClick={() => setTab('ask')}>💬 Ask AI</button>
                <button className={`detail-tab ${tab === 'winloss' ? 'active' : ''}`} onClick={() => setTab('winloss')}>📊 Win/Loss Analysis</button>
                <button className={`detail-tab ${tab === 'leads' ? 'active' : ''}`} onClick={() => setTab('leads')}>🎯 Lead Scoring</button>
            </div>

            {/* ═══ DEAL COACH TAB ═══ */}
            {tab === 'coach' && (
                <div className="dashboard-grid">
                    <div className="chart-card">
                        <div className="chart-card-title">AI Deal Scores</div>
                        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                            {scoredDeals.map(deal => (
                                <div key={deal.id} onClick={() => handleDeepAnalysis(deal)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s', background: selectedDealId === deal.id ? 'var(--bg-hover)' : 'transparent' }}
                                    onMouseEnter={e => { if (selectedDealId !== deal.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseLeave={e => { if (selectedDealId !== deal.id) e.currentTarget.style.background = 'transparent'; }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, background: gradeColor[deal.ai.grade] + '22', color: gradeColor[deal.ai.grade] }}>{deal.ai.grade}</div>
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

                    <div>
                        {analyzing && (
                            <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                                <p style={{ color: 'var(--text-muted)' }}>🧠 AI analyzing deal with Gemini Pro…</p>
                            </div>
                        )}

                        {selectedDeal && !analyzing && (
                            <>
                                <div className="chart-card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div className="chart-card-title" style={{ margin: 0 }}>🧠 AI Analysis — {selectedDeal.title}</div>
                                        <button className="btn btn-primary btn-sm" disabled={aiLoading} onClick={() => handleGenerateProposal(selectedDeal)}>
                                            {aiLoading ? '⏳' : '📄'} Generate Proposal
                                        </button>
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, border: `3px solid ${gradeColor[selectedDeal.ai.grade]}`, color: gradeColor[selectedDeal.ai.grade], background: gradeColor[selectedDeal.ai.grade] + '11' }}>
                                            {selectedDeal.ai.score}
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: gradeColor[selectedDeal.ai.grade] }}>Grade {selectedDeal.ai.grade}</div>
                                    </div>

                                    {/* Score factors */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                                        {selectedDeal.ai.reasons.map((r, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                                                <span style={{ width: 20, textAlign: 'center', fontWeight: 700, color: r.impact === '+' ? '#10b981' : r.impact === '-' ? '#ef4444' : '#f59e0b' }}>
                                                    {r.impact === '+' ? '▲' : r.impact === '-' ? '▼' : '●'}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{r.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Gemini Pro Strategic Insight */}
                                    {aiInsight && (
                                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✨ Gemini Pro Strategic Insight</div>
                                            {renderMarkdown(aiInsight)}
                                        </div>
                                    )}
                                </div>

                                {/* Proposal Draft */}
                                {proposalDraft && (
                                    <div className="chart-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div className="chart-card-title" style={{ margin: 0 }}>📄 Proposal Draft — {selectedDeal.title}</div>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(proposalDraft); toast('📋 Proposal copied!'); }}>📋 Copy</button>
                                        </div>
                                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', maxHeight: 500, overflowY: 'auto' }}>
                                            {renderMarkdown(proposalDraft)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!selectedDeal && !analyzing && (
                            <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
                                <h3>AI Deal Coach</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a deal for AI-powered strategic analysis, coaching, and proposal generation.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ ASK AI TAB ═══ */}
            {tab === 'ask' && (
                <div className="chart-card">
                    <div className="chart-card-title">💬 Ask Your AI Sales Coach</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        Ask anything about your deals, sales strategy, objection handling, pricing, or low-voltage industry best practices.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <input className="form-input" style={{ flex: 1 }} placeholder="e.g. How should I handle a price objection on a CCTV project?"
                            value={askPrompt} onChange={e => setAskPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAskAI()} />
                        <button className="btn btn-primary" onClick={handleAskAI} disabled={aiLoading || !askPrompt.trim()}>
                            {aiLoading ? '⏳ Thinking…' : '🧠 Ask'}
                        </button>
                    </div>

                    {/* Quick prompts */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {['How do I follow up after a site survey?', 'Best practices for DAS proposals', 'How to upsell access control on a cabling job', 'Objection: Your price is too high',
                            'How to qualify a fire alarm project', 'Tips for winning GC referrals'].map(q => (
                                <button key={q} className="filter-chip" onClick={() => { setAskPrompt(q); }} style={{ fontSize: 11 }}>{q}</button>
                            ))}
                    </div>

                    {askResponse && (
                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✨ AI Coach Response</div>
                            {renderMarkdown(askResponse)}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ WIN/LOSS ANALYSIS TAB ═══ */}
            {tab === 'winloss' && (
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="chart-card-title" style={{ margin: 0 }}>📊 Win/Loss Analysis</div>
                        <button className="btn btn-primary" onClick={handleWinLossAnalysis} disabled={aiLoading}>
                            {aiLoading ? '⏳ Analyzing pipeline…' : '🧠 Analyze My Pipeline'}
                        </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        AI analyzes your won and lost deals to identify patterns, trends, and strategic recommendations for improving your win rate.
                    </p>

                    {/* Quick stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <div style={{ padding: 14, background: '#065f4622', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{deals.filter(d => d.stage === 'Won').length}</div>
                            <div style={{ fontSize: 11, color: '#6ee7b7' }}>Won</div>
                        </div>
                        <div style={{ padding: 14, background: '#7f1d1d22', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{deals.filter(d => d.stage === 'Lost').length}</div>
                            <div style={{ fontSize: 11, color: '#fca5a5' }}>Lost</div>
                        </div>
                        <div style={{ padding: 14, background: '#1e3a5f22', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length}</div>
                            <div style={{ fontSize: 11, color: '#93c5fd' }}>Active</div>
                        </div>
                        <div style={{ padding: 14, background: '#f59e0b22', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                                {deals.filter(d => d.stage === 'Won').length && (deals.filter(d => d.stage === 'Won').length + deals.filter(d => d.stage === 'Lost').length) > 0
                                    ? Math.round(deals.filter(d => d.stage === 'Won').length / (deals.filter(d => d.stage === 'Won').length + deals.filter(d => d.stage === 'Lost').length) * 100) + '%'
                                    : 'N/A'}
                            </div>
                            <div style={{ fontSize: 11, color: '#fcd34d' }}>Win Rate</div>
                        </div>
                    </div>

                    {winLossAnalysis && (
                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✨ Gemini Pro Analysis</div>
                            {renderMarkdown(winLossAnalysis)}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ LEAD SCORING TAB ═══ */}
            {tab === 'leads' && (
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div className="chart-card-title" style={{ margin: 0 }}>🎯 AI Lead Scoring</div>
                        <button className="btn btn-primary" onClick={handleLeadScoring} disabled={aiLoading}>
                            {aiLoading ? '⏳ Scoring leads…' : '🧠 Score My Leads'}
                        </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        AI evaluates your early-stage leads (Lead In + Contact Made) and tells you which to prioritize, which to nurture, and which to deprioritize.
                    </p>

                    {/* Early stage deal list */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                            {deals.filter(d => ['Lead In', 'Contact Made'].includes(d.stage)).length} early-stage leads
                        </div>
                        {deals.filter(d => ['Lead In', 'Contact Made'].includes(d.stage)).slice(0, 8).map(d => (
                            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: d.stage === 'Lead In' ? '#f59e0b22' : '#3b82f622', color: d.stage === 'Lead In' ? '#f59e0b' : '#3b82f6' }}>{d.stage}</span>
                                <span style={{ flex: 1, fontWeight: 500 }}>{d.title}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(d.value)}</span>
                            </div>
                        ))}
                    </div>

                    {leadScores && (
                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✨ AI Lead Scoring Results</div>
                            {renderMarkdown(leadScores)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
