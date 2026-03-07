import { useState, useMemo } from 'react';
import * as api from '../api.js';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function Pipeline({ deals, pipelines, contacts, companies, toast, refreshDeals, refreshPipelines }) {
    const [activePipeline, setActivePipeline] = useState(null);
    const [showAddDeal, setShowAddDeal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [addStage, setAddStage] = useState('');

    const currentPipeline = activePipeline || (pipelines.length > 0 ? pipelines[0] : null);

    const stages = useMemo(() => {
        if (!currentPipeline) return [];
        return currentPipeline.stages || [];
    }, [currentPipeline]);

    const pipelineDeals = useMemo(() => {
        if (!currentPipeline) return [];
        return deals.filter(d => d.pipelineId === currentPipeline.id);
    }, [deals, currentPipeline]);

    const handleAddDeal = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const deal = {
            id: Date.now(),
            title: fd.get('title'),
            value: parseFloat(fd.get('value')) || 0,
            stage: addStage || stages[0]?.name || 'Lead In',
            pipelineId: currentPipeline.id,
            contact: fd.get('contact'),
            contactEmail: fd.get('contactEmail') || '',
            company: fd.get('company'),
            companyId: '',
            probability: parseInt(fd.get('probability')) || 20,
            daysOpen: 0,
            label: fd.get('label') || 'warm',
            expectedClose: fd.get('expectedClose') || '',
            notes: [],
            history: [{ id: 1, action: 'created', detail: 'Deal created', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }],
            customFields: {},
        };
        try {
            await api.saveDeal(deal);
            await refreshDeals();
            toast('Deal created!');
            setShowAddDeal(false);
        } catch (err) { toast(err.message, 'error'); }
    };

    const moveDeal = async (deal, newStage) => {
        const updated = {
            ...deal,
            stage: newStage,
            history: [...(deal.history || []), {
                id: Date.now(), action: 'stage',
                detail: `Moved to ${newStage}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }],
        };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            toast(`Moved to ${newStage}`);
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleDeleteDeal = async (id) => {
        try {
            await api.deleteDeal(id);
            await refreshDeals();
            toast('Deal deleted');
            setSelectedDeal(null);
        } catch (err) { toast(err.message, 'error'); }
    };

    return (
        <div>
            {/* Pipeline Tabs */}
            <div className="pipeline-tabs">
                {pipelines.map(p => (
                    <button key={p.id}
                        className={`pipeline-tab ${currentPipeline?.id === p.id ? 'active' : ''}`}
                        onClick={() => setActivePipeline(p)}
                        style={currentPipeline?.id === p.id ? { borderBottomColor: p.color } : {}}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Action bar */}
            <div className="section-header">
                <h3>{pipelineDeals.length} deals · {fmt(pipelineDeals.reduce((s, d) => s + d.value, 0))}</h3>
                <button className="btn btn-primary" onClick={() => { setAddStage(stages[0]?.name || ''); setShowAddDeal(true); }}>+ Add Deal</button>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {stages.map(stage => {
                    const stageDeals = pipelineDeals.filter(d => d.stage === stage.name);
                    const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                    return (
                        <div className="kanban-column" key={stage.id}>
                            <div className="kanban-column-header">
                                <div className="kanban-column-title">
                                    <span className="kanban-column-dot" style={{ background: stage.color }} />
                                    {stage.name}
                                </div>
                                <div className="kanban-column-count">{stageDeals.length} · {fmt(stageValue)}</div>
                            </div>
                            <div className="kanban-cards">
                                {stageDeals.map(deal => (
                                    <div className="kanban-card" key={deal.id} onClick={() => setSelectedDeal(deal)}>
                                        <div className="kanban-card-title">{deal.title}</div>
                                        <div className="kanban-card-company">{deal.company || deal.contact || '—'}</div>
                                        <div className="kanban-card-footer">
                                            <div className="kanban-card-value">{fmt(deal.value)}</div>
                                            <span className={`kanban-card-label label-${deal.label}`}>{deal.label}</span>
                                        </div>
                                    </div>
                                ))}
                                {stageDeals.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12 }}>No deals</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Deal Modal */}
            {showAddDeal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddDeal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>New Deal</h3>
                            <button className="modal-close" onClick={() => setShowAddDeal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddDeal}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input name="title" className="form-input" required placeholder="Deal name" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Value ($)</label>
                                        <input name="value" className="form-input" type="number" placeholder="10000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Stage</label>
                                        <select name="stage" className="form-select" value={addStage} onChange={e => setAddStage(e.target.value)}>
                                            {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Contact</label>
                                        <input name="contact" className="form-input" placeholder="Contact name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Company</label>
                                        <input name="company" className="form-input" placeholder="Company name" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Probability (%)</label>
                                        <input name="probability" className="form-input" type="number" min="0" max="100" defaultValue="20" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Label</label>
                                        <select name="label" className="form-select" defaultValue="warm">
                                            <option value="hot">Hot</option>
                                            <option value="warm">Warm</option>
                                            <option value="cold">Cold</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddDeal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Deal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deal Detail Modal */}
            {selectedDeal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedDeal(null)}>
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>{selectedDeal.title}</h3>
                            <button className="modal-close" onClick={() => setSelectedDeal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="deal-detail-grid">
                                <div className="deal-detail-item">
                                    <div className="label">Value</div>
                                    <div className="value" style={{ color: '#10b981' }}>{fmt(selectedDeal.value)}</div>
                                </div>
                                <div className="deal-detail-item">
                                    <div className="label">Stage</div>
                                    <div className="value">{selectedDeal.stage}</div>
                                </div>
                                <div className="deal-detail-item">
                                    <div className="label">Contact</div>
                                    <div className="value">{selectedDeal.contact || '—'}</div>
                                </div>
                                <div className="deal-detail-item">
                                    <div className="label">Company</div>
                                    <div className="value">{selectedDeal.company || '—'}</div>
                                </div>
                                <div className="deal-detail-item">
                                    <div className="label">Probability</div>
                                    <div className="value">{selectedDeal.probability}%</div>
                                </div>
                                <div className="deal-detail-item">
                                    <div className="label">Days Open</div>
                                    <div className="value">{selectedDeal.daysOpen || 0}</div>
                                </div>
                            </div>

                            {/* Move deal between stages */}
                            <div style={{ marginBottom: 20 }}>
                                <div className="form-label">Move to Stage</div>
                                <div className="filter-bar">
                                    {stages.map(s => (
                                        <button key={s.id}
                                            className={`filter-chip ${selectedDeal.stage === s.name ? 'active' : ''}`}
                                            onClick={() => { moveDeal(selectedDeal, s.name); setSelectedDeal({ ...selectedDeal, stage: s.name }); }}
                                        >{s.name}</button>
                                    ))}
                                </div>
                            </div>

                            {/* History */}
                            {selectedDeal.history?.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div className="form-label" style={{ marginBottom: 8 }}>History</div>
                                    {selectedDeal.history.map((h, i) => (
                                        <div className="deal-history-item" key={i}>
                                            <div className="deal-history-icon">📋</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.detail}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{h.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            {selectedDeal.notes?.length > 0 && (
                                <div>
                                    <div className="form-label" style={{ marginBottom: 8 }}>Notes</div>
                                    <ul className="deal-notes-list">
                                        {selectedDeal.notes.map((n, i) => (
                                            <li className="deal-note" key={i}>
                                                {n.text}
                                                <div className="note-date">{n.date}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-danger" onClick={() => handleDeleteDeal(selectedDeal.id)}>Delete Deal</button>
                            <button className="btn btn-ghost" onClick={() => setSelectedDeal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
