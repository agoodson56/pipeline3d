import { useState, useMemo, useRef } from 'react';
import * as api from '../api.js';
import { fmt, exportCSV, uid } from '../utils.js';

const WIN_REASONS = ['Best Price', 'Scope Fit', 'Relationship', 'Technical Capability', 'Timeline', 'Bundled Services', 'Existing Customer', 'Other'];
const LOSS_REASONS = ['Price Too High', 'Lost to Competitor', 'Project Cancelled', 'Decision Delayed', 'Went In-House', 'Scope Changed', 'No Response', 'Budget Cut', 'Other'];

function isOverdue(expectedClose) {
    if (!expectedClose) return false;
    const d = new Date(expectedClose);
    return !isNaN(d) && d < new Date(new Date().toDateString());
}

export default function Pipeline({ deals, pipelines, activities, emails, toast, refreshDeals }) {
    const [activePipeline, setActivePipeline] = useState(null);
    const [showAddDeal, setShowAddDeal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [addStage, setAddStage] = useState('');
    const [noteText, setNoteText] = useState('');
    const [detailTab, setDetailTab] = useState('details');
    const [editForm, setEditForm] = useState(null);
    const [winLossModal, setWinLossModal] = useState(null); // { deal, stage }
    const [winLossReason, setWinLossReason] = useState('');
    const [winLossNote, setWinLossNote] = useState('');
    const dragItem = useRef(null);
    const dragOverStage = useRef(null);

    // Related data for selected deal
    const dealActivities = useMemo(() => {
        if (!selectedDeal || !activities) return [];
        return activities.filter(a => a.deal === selectedDeal.title);
    }, [selectedDeal, activities]);

    const dealEmails = useMemo(() => {
        if (!selectedDeal || !emails) return [];
        return emails.filter(e => e.dealId === selectedDeal.id || e.dealTitle === selectedDeal.title);
    }, [selectedDeal, emails]);

    const currentPipeline = activePipeline || (pipelines.length > 0 ? pipelines[0] : null);
    const stages = useMemo(() => currentPipeline?.stages || [], [currentPipeline]);
    const pipelineDeals = useMemo(() => {
        if (!currentPipeline) return [];
        return deals.filter(d => d.pipelineId === currentPipeline.id);
    }, [deals, currentPipeline]);

    // ─── Drag and Drop ───────────────────────────────────────
    const handleDragStart = (e, deal) => {
        dragItem.current = deal;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        dragItem.current = null;
        dragOverStage.current = null;
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    };

    const handleDragOver = (e, stageName) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dragOverStage.current = stageName;
    };

    const handleDragEnter = (e) => {
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, stageName) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const deal = dragItem.current;
        if (!deal || deal.stage === stageName) return;

        // Intercept Won/Lost moves to capture reason
        if (stageName === 'Won' || stageName === 'Lost') {
            setWinLossModal({ deal, stage: stageName });
            setWinLossReason('');
            setWinLossNote('');
            return;
        }

        const updated = {
            ...deal,
            stage: stageName,
            history: [...(deal.history || []), {
                id: uid(), action: 'stage',
                detail: `Moved to ${stageName}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }],
        };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            toast(`Moved "${deal.title}" → ${stageName}`);
        } catch (err) { toast(err.message, 'error'); }
    };

    // ─── CRUD ────────────────────────────────────────────────
    const handleAddDeal = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const deal = {
            id: uid(), title: fd.get('title'),
            value: parseFloat(fd.get('value')) || 0,
            stage: addStage || stages[0]?.name || 'Lead In',
            pipelineId: currentPipeline.id,
            contact: fd.get('contact'), contactEmail: fd.get('contactEmail') || '',
            company: fd.get('company'), companyId: '',
            probability: parseInt(fd.get('probability')) || 20,
            daysOpen: 0, label: fd.get('label') || 'warm',
            expectedClose: fd.get('expectedClose') || '',
            notes: [], customFields: {},
            history: [{ id: 1, action: 'created', detail: 'Deal created', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }],
        };
        try {
            await api.saveDeal(deal);
            await refreshDeals();
            toast('Deal created!');
            setShowAddDeal(false);
        } catch (err) { toast(err.message, 'error'); }
    };

    const moveDealToStage = async (deal, newStage) => {
        // Intercept Won/Lost moves to capture reason
        if (newStage === 'Won' || newStage === 'Lost') {
            setWinLossModal({ deal, stage: newStage });
            setWinLossReason('');
            setWinLossNote('');
            return;
        }
        const updated = {
            ...deal, stage: newStage,
            history: [...(deal.history || []), { id: uid(), action: 'stage', detail: `Moved to ${newStage}`, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }],
        };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            toast(`Moved to ${newStage}`);
            setSelectedDeal({ ...updated });
        } catch (err) { toast(err.message, 'error'); }
    };

    // Win/Loss confirmation with reason
    const confirmWinLoss = async () => {
        if (!winLossModal) return;
        const { deal, stage } = winLossModal;
        const reasonText = winLossReason || (stage === 'Won' ? 'Won' : 'Lost');
        const updated = {
            ...deal,
            stage,
            customFields: { ...(deal.customFields || {}), winLossReason: reasonText, winLossNote: winLossNote.trim() },
            history: [...(deal.history || []), {
                id: uid(), action: stage === 'Won' ? 'won' : 'lost',
                detail: `${stage === 'Won' ? '🎉 Won' : '❌ Lost'}: ${reasonText}${winLossNote.trim() ? ' — ' + winLossNote.trim() : ''}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }],
        };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            toast(stage === 'Won' ? '🎉 Deal won!' : 'Deal marked as lost');
            setSelectedDeal(null);
            setWinLossModal(null);
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

    const handleEditDeal = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const changes = [];
        const newTitle = fd.get('title');
        const newValue = parseFloat(fd.get('value')) || 0;
        const newContact = fd.get('contact');
        const newCompany = fd.get('company');
        const newProb = parseInt(fd.get('probability')) || 20;
        const newLabel = fd.get('label') || 'warm';
        const newClose = fd.get('expectedClose') || '';
        if (newTitle !== selectedDeal.title) changes.push(`Title → "${newTitle}"`);
        if (newValue !== selectedDeal.value) changes.push(`Value → $${newValue.toLocaleString()}`);
        if (newContact !== selectedDeal.contact) changes.push(`Contact → ${newContact || 'None'}`);
        if (newCompany !== selectedDeal.company) changes.push(`Company → ${newCompany || 'None'}`);
        if (newProb !== selectedDeal.probability) changes.push(`Probability → ${newProb}%`);
        if (newLabel !== selectedDeal.label) changes.push(`Label → ${newLabel}`);
        if (newClose !== selectedDeal.expectedClose) changes.push(`Expected Close → ${newClose || 'None'}`);
        const updated = {
            ...selectedDeal,
            title: newTitle, value: newValue, contact: newContact,
            company: newCompany, probability: newProb, label: newLabel,
            expectedClose: newClose,
            history: [...(selectedDeal.history || []),
            ...(changes.length > 0 ? [{ id: uid(), action: 'edit', detail: 'Edited: ' + changes.join(', '), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }] : []),
            ],
        };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            setSelectedDeal(updated);
            setDetailTab('details');
            setEditForm(null);
            toast(changes.length > 0 ? 'Deal updated!' : 'No changes');
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !selectedDeal) return;
        const updatedNotes = [...(selectedDeal.notes || []), {
            id: uid(), text: noteText.trim(),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }];
        const updated = { ...selectedDeal, notes: updatedNotes };
        try {
            await api.saveDeal(updated);
            await refreshDeals();
            setSelectedDeal(updated);
            setNoteText('');
            toast('Note added');
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleExport = () => {
        exportCSV(pipelineDeals.map(d => ({
            Title: d.title, Value: d.value, Stage: d.stage, Contact: d.contact,
            Company: d.company, Probability: d.probability, Label: d.label,
            'Days Open': d.daysOpen, 'Expected Close': d.expectedClose,
        })), `pipeline3d_${currentPipeline?.name || 'deals'}.csv`);
        toast('Exported to CSV!');
    };

    return (
        <div>
            <div className="pipeline-tabs">
                {pipelines.map(p => (
                    <button key={p.id}
                        className={`pipeline-tab ${currentPipeline?.id === p.id ? 'active' : ''}`}
                        onClick={() => setActivePipeline(p)}
                        style={currentPipeline?.id === p.id ? { borderBottomColor: p.color } : {}}
                    >{p.name}</button>
                ))}
            </div>

            <div className="section-header">
                <h3>{pipelineDeals.length} deals · {fmt(pipelineDeals.reduce((s, d) => s + d.value, 0))}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={handleExport}>⬇ Export CSV</button>
                    <button className="btn btn-primary" onClick={() => { setAddStage(stages[0]?.name || ''); setShowAddDeal(true); }}>+ Add Deal</button>
                </div>
            </div>

            {/* Kanban Board with Drag & Drop */}
            <div className="kanban-board">
                {stages.map(stage => {
                    const stageDeals = pipelineDeals.filter(d => d.stage === stage.name);
                    const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                    return (
                        <div className="kanban-column" key={stage.id}
                            onDragOver={(e) => handleDragOver(e, stage.name)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage.name)}
                        >
                            <div className="kanban-column-header">
                                <div className="kanban-column-title">
                                    <span className="kanban-column-dot" style={{ background: stage.color }} />
                                    {stage.name}
                                </div>
                                <div className="kanban-column-count">{stageDeals.length} · {fmt(stageValue)}</div>
                            </div>
                            <div className="kanban-cards">
                                {stageDeals.map(deal => (
                                    <div className={`kanban-card ${deal.daysOpen > 60 ? 'rotting-critical' : deal.daysOpen > 30 ? 'rotting-warning' : ''}`} key={deal.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, deal)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => { setSelectedDeal(deal); setDetailTab('details'); setNoteText(''); }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="kanban-card-title">{deal.title}</div>
                                            {deal.daysOpen > 0 && (
                                                <span className={`rot-badge ${deal.daysOpen > 60 ? 'rot-critical' : deal.daysOpen > 30 ? 'rot-warn' : deal.daysOpen > 14 ? 'rot-mild' : 'rot-fresh'}`}
                                                    title={`${deal.daysOpen} days open`}>
                                                    {deal.daysOpen}d
                                                </span>
                                            )}
                                        </div>
                                        <div className="kanban-card-company">{deal.company || deal.contact || '—'}</div>
                                        <div className="kanban-card-footer">
                                            <div className="kanban-card-value">{fmt(deal.value)}</div>
                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                {isOverdue(deal.expectedClose) && (
                                                    <span style={{ fontSize: 10, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }} title={`Close date: ${deal.expectedClose}`}>⏰ Overdue</span>
                                                )}
                                                <span className={`kanban-card-label label-${deal.label}`}>{deal.label}</span>
                                            </div>
                                        </div>
                                        {deal.daysOpen > 30 && (
                                            <div className="rot-bar">
                                                <div className="rot-bar-fill" style={{ width: `${Math.min(100, (deal.daysOpen / 90) * 100)}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {stageDeals.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 12, border: '2px dashed var(--border)', borderRadius: 8, margin: 4 }}>
                                        Drop deals here
                                    </div>
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
                                            <option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expected Close</label>
                                    <input name="expectedClose" className="form-input" placeholder="e.g. Apr" />
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

            {/* Deal Detail Modal with Tabs + Notes */}
            {selectedDeal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedDeal(null)}>
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>{selectedDeal.title}</h3>
                            <button className="modal-close" onClick={() => setSelectedDeal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-tabs">
                                <button className={`detail-tab ${detailTab === 'details' ? 'active' : ''}`} onClick={() => setDetailTab('details')}>Details</button>
                                <button className={`detail-tab ${detailTab === 'edit' ? 'active' : ''}`} onClick={() => { setDetailTab('edit'); setEditForm(selectedDeal); }}>✏️ Edit</button>
                                <button className={`detail-tab ${detailTab === 'products' ? 'active' : ''}`} onClick={() => setDetailTab('products')}>
                                    Products {selectedDeal.products?.length > 0 && `(${selectedDeal.products.length})`}
                                </button>
                                <button className={`detail-tab ${detailTab === 'activities' ? 'active' : ''}`} onClick={() => setDetailTab('activities')}>
                                    Activities {dealActivities.length > 0 && `(${dealActivities.length})`}
                                </button>
                                <button className={`detail-tab ${detailTab === 'emails' ? 'active' : ''}`} onClick={() => setDetailTab('emails')}>
                                    Emails {dealEmails.length > 0 && `(${dealEmails.length})`}
                                </button>
                                <button className={`detail-tab ${detailTab === 'notes' ? 'active' : ''}`} onClick={() => setDetailTab('notes')}>
                                    Notes {selectedDeal.notes?.length > 0 && `(${selectedDeal.notes.length})`}
                                </button>
                                <button className={`detail-tab ${detailTab === 'history' ? 'active' : ''}`} onClick={() => setDetailTab('history')}>History</button>
                            </div>

                            {detailTab === 'details' && (
                                <>
                                    <div className="deal-detail-grid">
                                        <div className="deal-detail-item"><div className="label">Value</div><div className="value" style={{ color: '#10b981' }}>{fmt(selectedDeal.value)}</div></div>
                                        <div className="deal-detail-item"><div className="label">Stage</div><div className="value">{selectedDeal.stage}</div></div>
                                        <div className="deal-detail-item"><div className="label">Contact</div><div className="value">{selectedDeal.contact || '—'}</div></div>
                                        <div className="deal-detail-item"><div className="label">Company</div><div className="value">{selectedDeal.company || '—'}</div></div>
                                        <div className="deal-detail-item"><div className="label">Probability</div><div className="value">{selectedDeal.probability}%</div></div>
                                        <div className="deal-detail-item"><div className="label">Days Open</div><div className="value">{selectedDeal.daysOpen || 0}</div></div>
                                        <div className="deal-detail-item"><div className="label">Expected Close</div><div className="value" style={isOverdue(selectedDeal.expectedClose) ? { color: '#dc2626', fontWeight: 600 } : {}}>{selectedDeal.expectedClose || '—'}{isOverdue(selectedDeal.expectedClose) && ' ⏰ OVERDUE'}</div></div>
                                        {selectedDeal.customFields?.winLossReason && <div className="deal-detail-item"><div className="label">{selectedDeal.stage === 'Won' ? '🎉 Win Reason' : '❌ Loss Reason'}</div><div className="value">{selectedDeal.customFields.winLossReason}{selectedDeal.customFields.winLossNote ? ` — ${selectedDeal.customFields.winLossNote}` : ''}</div></div>}
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <div className="form-label">Move to Stage</div>
                                        <div className="filter-bar">
                                            {stages.map(s => (
                                                <button key={s.id}
                                                    className={`filter-chip ${selectedDeal.stage === s.name ? 'active' : ''}`}
                                                    onClick={() => moveDealToStage(selectedDeal, s.name)}
                                                >{s.name}</button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {detailTab === 'edit' && (
                                <form onSubmit={handleEditDeal}>
                                    <div className="form-group" style={{ marginBottom: 12 }}>
                                        <label className="form-label">Deal Title *</label>
                                        <input name="title" className="form-input" required defaultValue={selectedDeal.title} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Value ($)</label>
                                            <input name="value" className="form-input" type="number" step="0.01" defaultValue={selectedDeal.value} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Probability (%)</label>
                                            <input name="probability" className="form-input" type="number" min="0" max="100" defaultValue={selectedDeal.probability} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Contact</label>
                                            <input name="contact" className="form-input" placeholder="Contact name" defaultValue={selectedDeal.contact} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Company</label>
                                            <input name="company" className="form-input" placeholder="Company name" defaultValue={selectedDeal.company} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Label</label>
                                            <select name="label" className="form-select" defaultValue={selectedDeal.label}>
                                                <option value="hot">🔥 Hot</option>
                                                <option value="warm">🟡 Warm</option>
                                                <option value="cold">🧊 Cold</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Expected Close</label>
                                            <input name="expectedClose" className="form-input" type="date" defaultValue={selectedDeal.expectedClose} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setDetailTab('details')}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">💾 Save Changes</button>
                                    </div>
                                </form>
                            )}

                            {detailTab === 'products' && (
                                <div>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                                        <input id="prod-name" className="form-input" style={{ flex: 2 }} placeholder="Product / service name" />
                                        <input id="prod-qty" className="form-input" style={{ width: 60 }} type="number" placeholder="Qty" defaultValue="1" />
                                        <input id="prod-price" className="form-input" style={{ width: 100 }} type="number" placeholder="Unit $" />
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            const nm = document.getElementById('prod-name').value;
                                            const qt = parseInt(document.getElementById('prod-qty').value) || 1;
                                            const pr = parseFloat(document.getElementById('prod-price').value) || 0;
                                            if (!nm) return;
                                            const prods = [...(selectedDeal.products || []), { id: uid(), name: nm, qty: qt, price: pr, total: qt * pr }];
                                            const totalVal = prods.reduce((s, p) => s + p.total, 0);
                                            const updated = { ...selectedDeal, products: prods, value: totalVal };
                                            try { await api.saveDeal(updated); await refreshDeals(); setSelectedDeal(updated); toast('Product added'); document.getElementById('prod-name').value = ''; document.getElementById('prod-price').value = ''; } catch (e) { toast(e.message, 'error'); }
                                        }}>Add</button>
                                    </div>
                                    {(selectedDeal.products?.length > 0) ? (
                                        <div>
                                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                                <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                                                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Product</th>
                                                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Qty</th>
                                                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Unit Price</th>
                                                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Total</th>
                                                    <th></th>
                                                </tr></thead>
                                                <tbody>{selectedDeal.products.map((p, i) => (
                                                    <tr key={p.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '8px 4px', fontWeight: 500 }}>{p.name}</td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{p.qty}</td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>{fmt(p.price)}</td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{fmt(p.total)}</td>
                                                        <td style={{ padding: '4px', textAlign: 'right' }}>
                                                            <button className="btn-icon" onClick={async () => {
                                                                const prods = selectedDeal.products.filter(x => x.id !== p.id);
                                                                const totalVal = prods.reduce((s, x) => s + x.total, 0);
                                                                const updated = { ...selectedDeal, products: prods, value: totalVal };
                                                                try { await api.saveDeal(updated); await refreshDeals(); setSelectedDeal(updated); toast('Removed'); } catch (e) { toast(e.message, 'error'); }
                                                            }}>🗑</button>
                                                        </td>
                                                    </tr>
                                                ))}</tbody>
                                            </table>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 4px', borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
                                                Deal Total: <span style={{ color: '#10b981', marginLeft: 8 }}>{fmt(selectedDeal.products.reduce((s, p) => s + p.total, 0))}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: 24 }}><p>No products. Add line items above to build a quote.</p></div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'notes' && (
                                <div>
                                    {/* Add Note Form */}
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                        <input className="form-input" style={{ flex: 1 }} placeholder="Add a note…"
                                            value={noteText} onChange={e => setNoteText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                        />
                                        <button className="btn btn-primary" onClick={handleAddNote} disabled={!noteText.trim()}>Add</button>
                                    </div>
                                    {selectedDeal.notes?.length > 0 ? (
                                        <ul className="deal-notes-list">
                                            {[...selectedDeal.notes].reverse().map((n, i) => (
                                                <li className="deal-note" key={i}>
                                                    {n.text}
                                                    <div className="note-date">{n.date}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="empty-state" style={{ padding: 24 }}>
                                            <p>No notes yet. Add one above.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'activities' && (
                                <div>
                                    {dealActivities.length > 0 ? dealActivities.map((a, i) => (
                                        <div className="deal-history-item" key={i}>
                                            <div className="deal-history-icon">{a.type === 'call' ? '📞' : a.type === 'email' ? '📧' : a.type === 'meeting' ? '🤝' : '📋'}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{a.title}</span>
                                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: a.done ? '#10b981' : a.priority === 'high' ? '#dc2626' : '#f59e0b', color: '#fff' }}>
                                                        {a.done ? '✓ Done' : a.priority || 'pending'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{a.due || a.dueDate || '—'}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state" style={{ padding: 24 }}><p>No activities linked to this deal. Create activities with this deal's name in the "Related Deal" field.</p></div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'emails' && (
                                <div>
                                    {dealEmails.length > 0 ? dealEmails.map((e, i) => (
                                        <div className="deal-history-item" key={i}>
                                            <div className="deal-history-icon">{e.opened ? '📬' : '📧'}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.subject || '(No subject)'}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 12 }}>
                                                    <span>To: {e.contact || e.email}</span>
                                                    <span>{e.sentAt ? new Date(e.sentAt).toLocaleDateString() : '—'}</span>
                                                    {e.opened && <span style={{ color: '#10b981' }}>✓ Opened{e.openedAt ? ` ${new Date(e.openedAt).toLocaleDateString()}` : ''}</span>}
                                                    {e.clicked && <span style={{ color: '#3b82f6' }}>🔗 Clicked</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state" style={{ padding: 24 }}><p>No emails logged to this deal. Send emails linked to a deal in the Email Composer.</p></div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'history' && (
                                <div>
                                    {selectedDeal.history?.length > 0 ? (
                                        [...selectedDeal.history].reverse().map((h, i) => (
                                            <div className="deal-history-item" key={i}>
                                                <div className="deal-history-icon">{h.action === 'won' ? '🎉' : h.action === 'lost' ? '❌' : h.action === 'stage' ? '📦' : h.action === 'created' ? '✨' : '📋'}</div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.detail}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>{h.date}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state" style={{ padding: 24 }}><p>No history</p></div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-danger" onClick={() => handleDeleteDeal(selectedDeal.id)}>Delete</button>
                            <button className="btn btn-ghost" onClick={() => { setDetailTab('edit'); setEditForm(selectedDeal); }}>✏️ Edit</button>
                            <button className="btn btn-ghost" onClick={() => setSelectedDeal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Win/Loss Reason Modal */}
            {winLossModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setWinLossModal(null)}>
                    <div className="modal" style={{ maxWidth: 440 }}>
                        <div className="modal-header">
                            <h3>{winLossModal.stage === 'Won' ? '🎉 Mark as Won' : '❌ Mark as Lost'}</h3>
                            <button className="modal-close" onClick={() => setWinLossModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">{winLossModal.stage === 'Won' ? 'Why did we win?' : 'Why did we lose?'} *</label>
                                <select className="form-select" value={winLossReason} onChange={e => setWinLossReason(e.target.value)}>
                                    <option value="">Select a reason...</option>
                                    {(winLossModal.stage === 'Won' ? WIN_REASONS : LOSS_REASONS).map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label className="form-label">Additional notes (optional)</label>
                                <input className="form-input" placeholder="Any details worth capturing..." value={winLossNote} onChange={e => setWinLossNote(e.target.value)} />
                            </div>
                            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                                <strong>{winLossModal.deal.title}</strong> — {fmt(winLossModal.deal.value)}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setWinLossModal(null)}>Cancel</button>
                            <button className={`btn ${winLossModal.stage === 'Won' ? 'btn-primary' : 'btn-danger'}`} onClick={confirmWinLoss} disabled={!winLossReason}>
                                {winLossModal.stage === 'Won' ? '🎉 Confirm Win' : '❌ Confirm Loss'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
