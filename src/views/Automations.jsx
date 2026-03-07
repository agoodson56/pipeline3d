import { useState } from 'react';

const TRIGGER_TYPES = [
    { id: 'deal_stage', label: 'Deal moves to stage', icon: '📦' },
    { id: 'deal_created', label: 'New deal created', icon: '✨' },
    { id: 'deal_value', label: 'Deal value exceeds', icon: '💰' },
    { id: 'activity_due', label: 'Activity due today', icon: '⏰' },
    { id: 'deal_inactive', label: 'Deal inactive for X days', icon: '💤' },
];

const ACTION_TYPES = [
    { id: 'create_activity', label: 'Create follow-up activity', icon: '✅' },
    { id: 'send_email', label: 'Send email template', icon: '📧' },
    { id: 'move_stage', label: 'Move deal to stage', icon: '➡️' },
    { id: 'notify_slack', label: 'Send Slack notification', icon: '💬' },
    { id: 'update_label', label: 'Update deal label', icon: '🏷️' },
    { id: 'webhook', label: 'Fire webhook', icon: '🔗' },
];

const SAMPLE_RULES = [
    {
        id: 1, name: 'Follow-up on new deals', trigger: 'deal_created', action: 'create_activity', active: true,
        config: { activityTitle: 'Follow up on new deal', activityType: 'call', delay: '1 day' }
    },
    {
        id: 2, name: 'Notify on won deals', trigger: 'deal_stage', triggerValue: 'Won', action: 'notify_slack', active: true,
        config: { channel: '#sales-wins', message: 'Deal "{deal}" won for ${value}!' }
    },
    {
        id: 3, name: 'Hot label for big deals', trigger: 'deal_value', triggerValue: '50000', action: 'update_label', active: false,
        config: { label: 'hot' }
    },
    {
        id: 4, name: 'Proposal follow-up email', trigger: 'deal_stage', triggerValue: 'Proposal', action: 'send_email', active: true,
        config: { template: 'proposal', delay: '2 days' }
    },
    {
        id: 5, name: 'Alert stale deals', trigger: 'deal_inactive', triggerValue: '14', action: 'create_activity', active: true,
        config: { activityTitle: 'Re-engage stale deal', activityType: 'call' }
    },
];

export default function Automations({ toast }) {
    const [rules, setRules] = useState(SAMPLE_RULES);
    const [showAdd, setShowAdd] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', trigger: '', triggerValue: '', action: '', active: true });
    const [expandedId, setExpandedId] = useState(null);

    const toggleRule = (id) => {
        setRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r));
        toast('Automation updated');
    };

    const deleteRule = (id) => {
        setRules(rs => rs.filter(r => r.id !== id));
        toast('Automation removed');
    };

    const addRule = () => {
        if (!newRule.name || !newRule.trigger || !newRule.action) return;
        setRules(rs => [...rs, { ...newRule, id: Date.now(), config: {} }]);
        toast('Automation created!');
        setShowAdd(false);
        setNewRule({ name: '', trigger: '', triggerValue: '', action: '', active: true });
    };

    const activeCount = rules.filter(r => r.active).length;

    return (
        <div>
            <div className="section-header">
                <h3>⚡ {activeCount} active automations</h3>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Automation</button>
            </div>

            <div className="automation-list">
                {rules.map(rule => {
                    const trigger = TRIGGER_TYPES.find(t => t.id === rule.trigger);
                    const action = ACTION_TYPES.find(a => a.id === rule.action);
                    const expanded = expandedId === rule.id;
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
                                            {trigger?.icon} {trigger?.label}{rule.triggerValue ? `: ${rule.triggerValue}` : ''} → {action?.icon} {action?.label}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
                            </div>
                            {expanded && (
                                <div className="automation-card-body">
                                    <div className="automation-flow">
                                        <div className="automation-flow-node trigger">
                                            <div className="flow-node-icon">{trigger?.icon}</div>
                                            <div><div className="flow-node-label">WHEN</div><div className="flow-node-text">{trigger?.label}{rule.triggerValue ? ` = "${rule.triggerValue}"` : ''}</div></div>
                                        </div>
                                        <div className="automation-flow-arrow">→</div>
                                        <div className="automation-flow-node action">
                                            <div className="flow-node-icon">{action?.icon}</div>
                                            <div><div className="flow-node-label">THEN</div><div className="flow-node-text">{action?.label}</div></div>
                                        </div>
                                    </div>
                                    {rule.config && Object.keys(rule.config).length > 0 && (
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                                            {Object.entries(rule.config).map(([k, v]) => (
                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--text-muted)' }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                    <div className="modal">
                        <div className="modal-header">
                            <h3>New Automation</h3>
                            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Rule Name *</label>
                                <input className="form-input" value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Follow up on proposals" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">When (Trigger) *</label>
                                <div className="automation-option-grid">
                                    {TRIGGER_TYPES.map(t => (
                                        <div key={t.id} className={`automation-option ${newRule.trigger === t.id ? 'selected' : ''}`}
                                            onClick={() => setNewRule(r => ({ ...r, trigger: t.id }))}>
                                            <span style={{ fontSize: 20 }}>{t.icon}</span>
                                            <span style={{ fontSize: 12 }}>{t.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {newRule.trigger && (
                                <div className="form-group">
                                    <label className="form-label">Trigger Value (optional)</label>
                                    <input className="form-input" value={newRule.triggerValue} onChange={e => setNewRule(r => ({ ...r, triggerValue: e.target.value }))}
                                        placeholder={newRule.trigger === 'deal_stage' ? 'e.g. Proposal' : newRule.trigger === 'deal_value' ? 'e.g. 50000' : newRule.trigger === 'deal_inactive' ? 'days (e.g. 14)' : 'Value'} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Then (Action) *</label>
                                <div className="automation-option-grid">
                                    {ACTION_TYPES.map(a => (
                                        <div key={a.id} className={`automation-option ${newRule.action === a.id ? 'selected' : ''}`}
                                            onClick={() => setNewRule(r => ({ ...r, action: a.id }))}>
                                            <span style={{ fontSize: 20 }}>{a.icon}</span>
                                            <span style={{ fontSize: 12 }}>{a.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={addRule}>Create Automation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
