import { useState } from 'react';
import * as api from '../api.js';

const ICONS = { call: '📞', email: '📧', meeting: '🤝', task: '📋' };

export default function Activities({ activities, toast, refreshActivities }) {
    const [showAdd, setShowAdd] = useState(false);
    const [filter, setFilter] = useState('all');

    const filtered = activities.filter(a => {
        if (filter === 'pending') return !a.done;
        if (filter === 'completed') return a.done;
        return true;
    });

    const toggleDone = async (act) => {
        try {
            await api.saveActivity({ ...act, done: !act.done });
            await refreshActivities();
            toast(act.done ? 'Reopened' : 'Completed!');
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const activity = {
            id: Date.now(),
            type: fd.get('type') || 'call',
            title: fd.get('title'),
            deal: fd.get('deal'),
            due: fd.get('due'),
            dueDate: fd.get('dueDate'),
            done: false,
            priority: fd.get('priority') || 'medium',
        };
        try {
            await api.saveActivity(activity);
            await refreshActivities();
            toast('Activity added!');
            setShowAdd(false);
        } catch (err) { toast(err.message, 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteActivity(id);
            await refreshActivities();
            toast('Activity removed');
        } catch (err) { toast(err.message, 'error'); }
    };

    const pending = activities.filter(a => !a.done).length;
    const done = activities.filter(a => a.done).length;

    return (
        <div>
            <div className="section-header">
                <h3>{pending} pending · {done} completed</h3>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Activity</button>
            </div>

            <div className="filter-bar">
                {['all', 'pending', 'completed'].map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div className="activity-list">
                {filtered.map(a => (
                    <div className={`activity-item ${a.done ? 'done' : ''}`} key={a.id}>
                        <div className={`activity-checkbox ${a.done ? 'checked' : ''}`} onClick={() => toggleDone(a)}>
                            {a.done ? '✓' : ''}
                        </div>
                        <div className={`activity-icon ${a.type}`}>{ICONS[a.type] || '📋'}</div>
                        <div className="activity-info">
                            <div className="activity-title">{a.title}</div>
                            <div className="activity-meta">
                                {a.deal && <span>{a.deal} · </span>}
                                {a.due || a.dueDate || '—'}
                                {a.priority && <span className={` priority-${a.priority}`}> · {a.priority}</span>}
                            </div>
                        </div>
                        <button className="btn-icon" onClick={() => handleDelete(a.id)} title="Delete">🗑</button>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <h3>{filter === 'pending' ? 'All caught up!' : 'No activities'}</h3>
                        <p>{filter === 'pending' ? 'No pending tasks at the moment.' : 'Add an activity to get started.'}</p>
                    </div>
                )}
            </div>

            {showAdd && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>New Activity</h3>
                            <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input name="title" className="form-input" required placeholder="What needs to be done?" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select name="type" className="form-select">
                                            <option value="call">📞 Call</option>
                                            <option value="email">📧 Email</option>
                                            <option value="meeting">🤝 Meeting</option>
                                            <option value="task">📋 Task</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select name="priority" className="form-select">
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Due</label>
                                        <input name="due" className="form-input" placeholder="e.g. Today 2pm" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input name="dueDate" className="form-input" type="date" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Related Deal</label>
                                    <input name="deal" className="form-input" placeholder="Deal name (optional)" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Activity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
