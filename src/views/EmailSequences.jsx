import { useState } from 'react';

const PRESET_SEQUENCES = [
    {
        id: 1, name: 'New Lead Nurture', status: 'active', enrolled: 12,
        steps: [
            { day: 0, type: 'email', template: 'Introduction', subject: 'Welcome to 3D TSI' },
            { day: 3, type: 'task', action: 'Follow-up call' },
            { day: 7, type: 'email', template: 'Follow-Up', subject: 'Quick check-in' },
            { day: 14, type: 'email', template: 'Proposal', subject: 'Here\'s what we can do for you' },
            { day: 21, type: 'task', action: 'Evaluate engagement — keep or remove' },
        ],
    },
    {
        id: 2, name: 'Post-Proposal Follow-up', status: 'active', enrolled: 5,
        steps: [
            { day: 0, type: 'email', template: 'Proposal Sent', subject: 'Your proposal from 3D TSI' },
            { day: 2, type: 'task', action: 'Check if proposal was opened' },
            { day: 5, type: 'email', template: 'Follow-Up', subject: 'Checking in on our proposal' },
            { day: 10, type: 'email', template: 'Check-In', subject: 'Any questions about the proposal?' },
            { day: 15, type: 'task', action: 'Final decision-maker check' },
        ],
    },
    {
        id: 3, name: 'Re-Engagement (Cold Leads)', status: 'paused', enrolled: 8,
        steps: [
            { day: 0, type: 'email', template: 'Check-In', subject: 'It\'s been a while!' },
            { day: 7, type: 'email', template: 'Follow-Up', subject: 'New solutions from 3D TSI' },
            { day: 14, type: 'task', action: 'Assess response — archive or escalate' },
        ],
    },
];

export default function EmailSequences({ toast }) {
    const [sequences, setSequences] = useState(PRESET_SEQUENCES);
    const [showBuilder, setShowBuilder] = useState(false);
    const [selectedSeq, setSelectedSeq] = useState(null);
    const [newSeq, setNewSeq] = useState({ name: '', steps: [{ day: 0, type: 'email', template: 'Introduction', subject: '', action: '' }] });

    const toggleStatus = (id) => {
        setSequences(ss => ss.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s));
    };

    const deleteSeq = (id) => {
        setSequences(ss => ss.filter(s => s.id !== id));
        toast('Sequence deleted');
    };

    const addStep = () => {
        const lastDay = newSeq.steps.length > 0 ? newSeq.steps[newSeq.steps.length - 1].day + 3 : 0;
        setNewSeq(s => ({ ...s, steps: [...s.steps, { day: lastDay, type: 'email', template: 'Follow-Up', subject: '', action: '' }] }));
    };

    const removeStep = (idx) => {
        setNewSeq(s => ({ ...s, steps: s.steps.filter((_, i) => i !== idx) }));
    };

    const updateStep = (idx, field, value) => {
        setNewSeq(s => ({ ...s, steps: s.steps.map((st, i) => i === idx ? { ...st, [field]: value } : st) }));
    };

    const createSequence = () => {
        if (!newSeq.name.trim() || newSeq.steps.length === 0) return;
        setSequences(ss => [...ss, { id: Date.now(), name: newSeq.name, status: 'active', enrolled: 0, steps: newSeq.steps }]);
        toast('Sequence created!');
        setShowBuilder(false);
        setNewSeq({ name: '', steps: [{ day: 0, type: 'email', template: 'Introduction', subject: '', action: '' }] });
    };

    return (
        <div>
            <div className="section-header" style={{ marginBottom: 16 }}>
                <h3>{sequences.filter(s => s.status === 'active').length} active sequences · {sequences.reduce((s, seq) => s + seq.enrolled, 0)} contacts enrolled</h3>
                <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>+ New Sequence</button>
            </div>

            {sequences.map(seq => (
                <div className="chart-card" key={seq.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`automation-toggle ${seq.status === 'active' ? 'on' : ''}`} onClick={() => toggleStatus(seq.id)}>
                                <div className="automation-toggle-thumb" />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{seq.name}</h4>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seq.steps.length} steps · {seq.enrolled} enrolled · {seq.status === 'active' ? '🟢 Active' : '⏸ Paused'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSeq(selectedSeq === seq.id ? null : seq.id)}>{selectedSeq === seq.id ? 'Hide' : 'View'}</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => deleteSeq(seq.id)}>Delete</button>
                        </div>
                    </div>

                    {selectedSeq === seq.id && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {seq.steps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                                        {/* Timeline */}
                                        <div style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: step.type === 'email' ? 'rgba(13,148,136,0.2)' : 'rgba(245,158,11,0.2)',
                                                color: step.type === 'email' ? '#0D9488' : '#f59e0b', fontSize: 14, zIndex: 1
                                            }}>
                                                {step.type === 'email' ? '✉' : '✅'}
                                            </div>
                                            {i < seq.steps.length - 1 && (
                                                <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 20 }} />
                                            )}
                                        </div>
                                        {/* Content */}
                                        <div style={{ flex: 1, paddingBottom: 12 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                                                DAY {step.day} · {step.type === 'email' ? 'Send Email' : 'Create Task'}
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                                                {step.type === 'email' ? `📧 ${step.subject || step.template}` : `📋 ${step.action}`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {sequences.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">📧</div><h3>No sequences yet</h3><p>Create automated multi-step email campaigns.</p></div>
            )}

            {/* Sequence Builder Modal */}
            {showBuilder && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBuilder(false)}>
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Build Email Sequence</h3>
                            <button className="modal-close" onClick={() => setShowBuilder(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Sequence Name *</label>
                                <input className="form-input" value={newSeq.name} onChange={e => setNewSeq(s => ({ ...s, name: e.target.value }))} placeholder="e.g. New Lead Follow-up" />
                            </div>

                            <div className="form-label" style={{ marginTop: 16 }}>Steps ({newSeq.steps.length})</div>
                            {newSeq.steps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, padding: 10, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40 }}>Day</span>
                                    <input className="form-input" type="number" style={{ width: 50 }} value={step.day} onChange={e => updateStep(i, 'day', parseInt(e.target.value) || 0)} />
                                    <select className="form-select" style={{ width: 90 }} value={step.type} onChange={e => updateStep(i, 'type', e.target.value)}>
                                        <option value="email">Email</option>
                                        <option value="task">Task</option>
                                    </select>
                                    {step.type === 'email' ? (
                                        <>
                                            <select className="form-select" style={{ width: 120 }} value={step.template} onChange={e => updateStep(i, 'template', e.target.value)}>
                                                <option>Introduction</option><option>Follow-Up</option><option>Proposal</option><option>Thank You</option><option>Check-In</option>
                                            </select>
                                            <input className="form-input" style={{ flex: 1 }} placeholder="Subject line" value={step.subject} onChange={e => updateStep(i, 'subject', e.target.value)} />
                                        </>
                                    ) : (
                                        <input className="form-input" style={{ flex: 1 }} placeholder="Task description" value={step.action} onChange={e => updateStep(i, 'action', e.target.value)} />
                                    )}
                                    <button className="btn-icon" onClick={() => removeStep(i)}>🗑</button>
                                </div>
                            ))}
                            <button className="btn btn-ghost btn-sm" onClick={addStep} style={{ marginTop: 4 }}>+ Add Step</button>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowBuilder(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createSequence}>Create Sequence</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
