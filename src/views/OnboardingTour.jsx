import { useState } from 'react';

const TOUR_STEPS = [
    { icon: '👋', title: 'Welcome to Pipeline3D!', desc: 'Your AI-powered sales CRM. Let\'s take a quick tour of the key features.', area: 'intro' },
    { icon: '📊', title: 'Dashboard', desc: 'Your home base. See all KPIs at a glance — pipeline value, revenue, win rate, and forecasts.', area: 'dashboard' },
    { icon: '🔀', title: 'Visual Pipeline', desc: 'Drag and drop deals between stages. Each deal card shows value, label, and rotting indicators. Add products/line items to build quotes.', area: 'pipeline' },
    { icon: '👥', title: 'Contacts & Companies', desc: 'Track everyone you\'re selling to. Import contacts via CSV, detect duplicates, and auto-enrich with AI.', area: 'contacts' },
    { icon: '✅', title: 'Activities', desc: 'Your to-do list. Create tasks, calls, meetings, and deadlines. The sidebar badge shows pending items.', area: 'activities' },
    { icon: '📧', title: 'Email Sequences', desc: 'Build multi-step drip campaigns. Automatically nurture leads with timed emails and follow-up tasks.', area: 'sequences' },
    { icon: '🧠', title: 'AI Coach', desc: 'Every deal gets an AI score (A-D). Get specific recommendations to close more deals faster.', area: 'ai' },
    { icon: '📉', title: 'Reports & Funnel', desc: 'Conversion funnel analytics, goal tracking, lead source performance, and deal age distribution.', area: 'reports' },
    { icon: '⚡', title: 'Automations', desc: 'Set up "when this, then that" rules. Auto-create tasks, send emails, and move deals when triggers fire.', area: 'automations' },
    { icon: '📱', title: 'Mobile App', desc: 'Install Pipeline3D on your phone! It works as a native app on both Android and iPhone.', area: 'mobile' },
    { icon: '🚀', title: 'You\'re All Set!', desc: 'Start by adding your first deal in the Pipeline view. Need help? Hit Ctrl+K to search anything.', area: 'done' },
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
