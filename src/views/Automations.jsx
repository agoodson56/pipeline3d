import { useState } from 'react';

const TRIGGER_TYPES = [
    { id: 'deal_stage', label: 'Deal moves to stage', icon: '📦' },
    { id: 'deal_created', label: 'New deal created', icon: '✨' },
    { id: 'deal_value', label: 'Deal value exceeds', icon: '💰' },
    { id: 'activity_due', label: 'Activity due today', icon: '⏰' },
    { id: 'deal_inactive', label: 'Deal inactive for X days', icon: '💤' },
    { id: 'deal_won', label: 'Deal marked as Won', icon: '🏆' },
    { id: 'deal_lost', label: 'Deal marked as Lost', icon: '❌' },
    { id: 'contact_created', label: 'New contact created', icon: '👤' },
    { id: 'email_opened', label: 'Email opened', icon: '📬' },
    { id: 'form_submitted', label: 'Lead form submitted', icon: '📝' },
];

const CONDITION_TYPES = [
    { id: 'deal_label', label: 'Deal label is', icon: '🏷️', options: ['hot', 'warm', 'cold'] },
    { id: 'deal_value_gt', label: 'Deal value > amount', icon: '💲' },
    { id: 'deal_value_lt', label: 'Deal value < amount', icon: '💲' },
    { id: 'has_contact', label: 'Deal has contact assigned', icon: '👤' },
    { id: 'has_company', label: 'Deal has company linked', icon: '🏢' },
    { id: 'days_open_gt', label: 'Days open > X', icon: '📅' },
    { id: 'probability_gt', label: 'Probability > X%', icon: '📊' },
    { id: 'contact_has_email', label: 'Contact has email', icon: '📧' },
];

const ACTION_TYPES = [
    { id: 'create_activity', label: 'Create follow-up activity', icon: '✅' },
    { id: 'send_email', label: 'Send email template', icon: '📧' },
    { id: 'move_stage', label: 'Move deal to stage', icon: '➡️' },
    { id: 'notify_slack', label: 'Send Slack notification', icon: '💬' },
    { id: 'notify_teams', label: 'Send Teams notification', icon: '👥' },
    { id: 'update_label', label: 'Update deal label', icon: '🏷️' },
    { id: 'update_probability', label: 'Set probability', icon: '📊' },
    { id: 'add_note', label: 'Add note to deal', icon: '📝' },
    { id: 'assign_owner', label: 'Assign deal owner', icon: '👤' },
    { id: 'webhook', label: 'Fire webhook', icon: '🔗' },
    { id: 'wait', label: 'Wait / delay', icon: '⏳' },
    { id: 'send_sms', label: 'Send SMS (Twilio)', icon: '📱' },
];

const SAMPLE_RULES = [
    {
        id: 1, name: 'Follow-up on new deals', trigger: 'deal_created', active: true,
        steps: [
            { type: 'action', actionId: 'create_activity', config: { title: 'Follow up call', activityType: 'call' } },
        ]
    },
    {
        id: 2, name: 'Won deal celebration', trigger: 'deal_won', active: true,
        steps: [
            { type: 'action', actionId: 'notify_slack', config: { message: '🏆 Deal won!' } },
            { type: 'action', actionId: 'send_email', config: { template: 'Thank You' } },
        ]
    },
    {
        id: 3, name: 'Hot deal fast-track', trigger: 'deal_created', triggerValue: '', active: true,
        steps: [
            { type: 'condition', conditionId: 'deal_value_gt', value: '25000' },
            { type: 'action', actionId: 'update_label', config: { label: 'hot' } },
            { type: 'action', actionId: 'create_activity', config: { title: 'Priority: schedule meeting', activityType: 'meeting' } },
            { type: 'action', actionId: 'notify_slack', config: { message: '🔥 High-value deal created!' } },
        ]
    },
    {
        id: 4, name: 'Proposal follow-up sequence', trigger: 'deal_stage', triggerValue: 'Proposal', active: true,
        steps: [
            { type: 'action', actionId: 'send_email', config: { template: 'Proposal' } },
            { type: 'action', actionId: 'wait', config: { days: 3 } },
            { type: 'condition', conditionId: 'deal_label', value: 'cold' },
            { type: 'action', actionId: 'create_activity', config: { title: 'Re-engage cold proposal', activityType: 'call' } },
        ]
    },
    {
        id: 5, name: 'Stale deal alert & re-engage', trigger: 'deal_inactive', triggerValue: '14', active: true,
        steps: [
            { type: 'condition', conditionId: 'deal_value_gt', value: '10000' },
            { type: 'action', actionId: 'update_label', config: { label: 'cold' } },
            { type: 'action', actionId: 'create_activity', config: { title: 'Re-engage stale deal', activityType: 'call' } },
            { type: 'action', actionId: 'send_email', config: { template: 'Check-In' } },
        ]
    },
    {
        id: 6, name: 'Lost deal feedback loop', trigger: 'deal_lost', active: false,
        steps: [
            { type: 'action', actionId: 'send_email', config: { template: 'Follow-Up' } },
            { type: 'action', actionId: 'add_note', config: { text: 'Auto: Lost deal — feedback email sent' } },
            { type: 'action', actionId: 'webhook', config: { url: 'https://analytics.example.com/lost-deals' } },
        ]
    },
    {
        id: 7, name: 'New lead form auto-setup', trigger: 'form_submitted', active: true,
        steps: [
            { type: 'action', actionId: 'send_email', config: { template: 'Introduction' } },
            { type: 'action', actionId: 'create_activity', config: { title: 'Call new lead', activityType: 'call' } },
            { type: 'action', actionId: 'notify_slack', config: { message: '📝 New lead from website form!' } },
        ]
    },
];

export default function Automations({ toast }) {
    const [rules, setRules] = useState(SAMPLE_RULES);
    const [showAdd, setShowAdd] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', trigger: '', triggerValue: '', steps: [], active: true });
    const [expandedId, setExpandedId] = useState(null);

    const toggleRule = (id) => { setRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r)); toast('Updated'); };
    const deleteRule = (id) => { setRules(rs => rs.filter(r => r.id !== id)); toast('Removed'); };

    const addStep = (type) => {
        const step = type === 'condition'
            ? { type: 'condition', conditionId: CONDITION_TYPES[0].id, value: '' }
            : { type: 'action', actionId: ACTION_TYPES[0].id, config: {} };
        setNewRule(r => ({ ...r, steps: [...r.steps, step] }));
    };

    const updateStep = (idx, updates) => {
        setNewRule(r => ({ ...r, steps: r.steps.map((s, i) => i === idx ? { ...s, ...updates } : s) }));
    };

    const removeStep = (idx) => {
        setNewRule(r => ({ ...r, steps: r.steps.filter((_, i) => i !== idx) }));
    };

    const createRule = () => {
        if (!newRule.name || !newRule.trigger || newRule.steps.length === 0) return;
        setRules(rs => [...rs, { ...newRule, id: Date.now() }]);
        toast('Automation created!');
        setShowAdd(false);
        setNewRule({ name: '', trigger: '', triggerValue: '', steps: [], active: true });
    };

    const activeCount = rules.filter(r => r.active).length;

    const renderStepNode = (step, i, total) => {
        const isCondition = step.type === 'condition';
        const condDef = isCondition ? CONDITION_TYPES.find(c => c.id === step.conditionId) : null;
        const actDef = !isCondition ? ACTION_TYPES.find(a => a.id === step.actionId) : null;

        return (
            <div key={i}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                    background: isCondition ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                    border: `1px solid ${isCondition ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${isCondition ? '#f59e0b' : '#6366f1'}`,
                }}>
                    <span style={{ fontSize: 16 }}>{isCondition ? condDef?.icon || '❓' : actDef?.icon || '⚡'}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isCondition ? '#f59e0b' : '#6366f1', letterSpacing: 0.5 }}>
                            {isCondition ? `IF / CONDITION #${i + 1}` : `ACTION #${i + 1}`}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 1 }}>
                            {isCondition ? `${condDef?.label || step.conditionId}${step.value ? `: ${step.value}` : ''}` : `${actDef?.label || step.actionId}`}
                        </div>
                        {!isCondition && step.config && Object.keys(step.config).length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {Object.entries(step.config).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </div>
                        )}
                    </div>
                </div>
                {i < total - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                        <div style={{ width: 2, height: 16, background: 'var(--border)' }} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h3>⚡ {activeCount} active automations · {rules.reduce((s, r) => s + (r.steps?.length || 1), 0)} total steps</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {TRIGGER_TYPES.length} triggers · {CONDITION_TYPES.length} conditions · {ACTION_TYPES.length} actions — multi-step conditional workflows
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Automation</button>
            </div>

            <div className="automation-list">
                {rules.map(rule => {
                    const trigger = TRIGGER_TYPES.find(t => t.id === rule.trigger);
                    const expanded = expandedId === rule.id;
                    const stepCount = rule.steps?.length || 0;
                    const condCount = rule.steps?.filter(s => s.type === 'condition').length || 0;
                    return (
                        <div className={`automation-card ${rule.active ? '' : 'inactive'}`} key={rule.id}>
                            <div className="automation-card-header" onClick={() => setExpandedId(expanded ? null : rule.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <div className={`automation-toggle ${rule.active ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}>
                                        <div className="automation-toggle-thumb" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {trigger?.icon} {trigger?.label}{rule.triggerValue ? `: ${rule.triggerValue}` : ''} → {stepCount} step{stepCount !== 1 ? 's' : ''}
                                            {condCount > 0 && <span style={{ color: '#f59e0b' }}> · {condCount} condition{condCount !== 1 ? 's' : ''}</span>}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
                            </div>
                            {expanded && (
                                <div className="automation-card-body">
                                    {/* Trigger */}
                                    <div style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #10b981', marginBottom: 4 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#10b981', letterSpacing: 0.5 }}>WHEN / TRIGGER</div>
                                        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 1 }}>
                                            {trigger?.icon} {trigger?.label}{rule.triggerValue ? ` = "${rule.triggerValue}"` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}><div style={{ width: 2, height: 16, background: 'var(--border)' }} /></div>
                                    {/* Steps */}
                                    {rule.steps?.map((step, i) => renderStepNode(step, i, rule.steps.length))}
                                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteRule(rule.id)}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showAdd && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>New Multi-Step Automation</h3>
                            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Rule Name *</label>
                                <input className="form-input" value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="e.g. High-value deal fast-track" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">When (Trigger) *</label>
                                <div className="automation-option-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                    {TRIGGER_TYPES.map(t => (
                                        <div key={t.id} className={`automation-option ${newRule.trigger === t.id ? 'selected' : ''}`}
                                            onClick={() => setNewRule(r => ({ ...r, trigger: t.id }))}>
                                            <span style={{ fontSize: 18 }}>{t.icon}</span>
                                            <span style={{ fontSize: 11 }}>{t.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {newRule.trigger && (
                                <div className="form-group">
                                    <label className="form-label">Trigger Value (optional)</label>
                                    <input className="form-input" value={newRule.triggerValue} onChange={e => setNewRule(r => ({ ...r, triggerValue: e.target.value }))}
                                        placeholder={newRule.trigger === 'deal_stage' ? 'e.g. Proposal' : newRule.trigger === 'deal_value' ? '50000' : 'Value'} />
                                </div>
                            )}

                            {/* Steps Builder */}
                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label className="form-label">Workflow Steps ({newRule.steps.length})</label>
                                {newRule.steps.map((step, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, padding: 8, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                        borderLeft: `3px solid ${step.type === 'condition' ? '#f59e0b' : '#6366f1'}`
                                    }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: step.type === 'condition' ? '#f59e0b' : '#6366f1', width: 20, textAlign: 'center' }}>
                                            {step.type === 'condition' ? 'IF' : '#' + (i + 1)}
                                        </span>
                                        {step.type === 'condition' ? (
                                            <>
                                                <select className="form-select" style={{ width: 180 }} value={step.conditionId} onChange={e => updateStep(i, { conditionId: e.target.value })}>
                                                    {CONDITION_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                </select>
                                                <input className="form-input" style={{ width: 100 }} placeholder="Value" value={step.value || ''} onChange={e => updateStep(i, { value: e.target.value })} />
                                            </>
                                        ) : (
                                            <>
                                                <select className="form-select" style={{ flex: 1 }} value={step.actionId} onChange={e => updateStep(i, { actionId: e.target.value })}>
                                                    {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
                                                </select>
                                            </>
                                        )}
                                        <button className="btn-icon" onClick={() => removeStep(i)}>✕</button>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                    <button className="btn btn-ghost btn-sm" style={{ borderColor: '#6366f1', color: '#6366f1' }} onClick={() => addStep('action')}>+ Add Action</button>
                                    <button className="btn btn-ghost btn-sm" style={{ borderColor: '#f59e0b', color: '#f59e0b' }} onClick={() => addStep('condition')}>+ Add Condition</button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createRule}>Create Automation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
