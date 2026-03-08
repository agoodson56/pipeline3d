import { useState } from 'react';

const TOUR_STEPS = [
    { icon: '👋', title: 'Welcome to Pipeline3D!', desc: 'Your AI-powered CRM built for 3D Technology Services Inc. Let\'s take a quick tour of the key features.', area: 'intro' },
    { icon: '📊', title: 'Dashboard', desc: 'Your home base. See all KPIs at a glance — pipeline value by service line, revenue, win rate, and forecasts.', area: 'dashboard' },
    { icon: '🔀', title: 'Visual Pipeline', desc: 'Drag deals through stages: Lead In → Contact Made → Site Survey → Proposal → Negotiation → Won. Add products/line items to build scope of work & quotes.', area: 'pipeline' },
    { icon: '👥', title: 'Contacts & Companies', desc: 'Track GCs, facilities managers, architects, and end-users. Import via CSV, detect duplicates, and auto-enrich with AI.', area: 'contacts' },
    { icon: '✅', title: 'Activities', desc: 'Your to-do list. Create tasks, calls, site surveys, and deadlines. The sidebar badge shows pending items.', area: 'activities' },
    { icon: '📧', title: 'Email Sequences', desc: 'Build multi-step drip campaigns. Automatically nurture leads with timed emails and follow-up tasks.', area: 'sequences' },
    { icon: '🧠', title: 'AI Coach', desc: 'Every deal gets an AI score (A-D). Get specific recommendations — like scheduling a site survey or sending a proposal.', area: 'ai' },
    { icon: '📉', title: 'Reports & Funnel', desc: 'Conversion funnel analytics, service line performance, lead source tracking, and deal age distribution.', area: 'reports' },
    { icon: '⚡', title: 'Automations', desc: 'Set up "when this, then that" rules. Auto-create site survey tasks, send emails, and notify your team when deals move.', area: 'automations' },
    { icon: '📱', title: 'Mobile App', desc: 'Install Pipeline3D on your phone! Access deals and contacts on-site. Works as a native app on both Android and iPhone.', area: 'mobile' },
    { icon: '🚀', title: 'You\'re All Set!', desc: 'Start by adding your first deal in the Pipeline view. Use the naming convention: [Customer] — [Service Line]. Need help? Hit Ctrl+K to search anything.', area: 'done' },
];

export default function OnboardingTour({ onClose, onNavigate }) {
    const [step, setStep] = useState(0);
    const current = TOUR_STEPS[step];
    const pct = ((step + 1) / TOUR_STEPS.length) * 100;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: 440 }}>
                <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                    {/* Progress */}
                    <div className="progress-bar" style={{ height: 4, marginBottom: 24, borderRadius: 2 }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                    </div>

                    <div style={{ fontSize: 56, marginBottom: 12 }}>{current.icon}</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{current.title}</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{current.desc}</p>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {step > 0 && (
                            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
                        )}
                        {step < TOUR_STEPS.length - 1 ? (
                            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                                Next →
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={onClose} style={{ background: '#10b981' }}>
                                🚀 Start Using Pipeline3D
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Skip Tour
                        </button>
                    </div>

                    {/* Step dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} style={{
                                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                                background: i === step ? 'var(--accent)' : i < step ? '#10b981' : 'var(--border)',
                                transition: 'all 0.3s ease', cursor: 'pointer',
                            }} onClick={() => setStep(i)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
