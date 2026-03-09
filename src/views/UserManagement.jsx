import { useState, useEffect } from 'react';
import * as api from '../api.js';

export default function UserManagement({ toast, currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(null); // userId or null
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'rep' });
    const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });

    const loadUsers = async () => {
        try {
            const data = await api.listUsers();
            setUsers(data);
        } catch (err) {
            toast('Failed to load users: ' + err.message, 'error');
        }
        setLoading(false);
    };

    useEffect(() => { loadUsers(); }, []);

    const handleAddUser = async () => {
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
            toast('All fields are required', 'error');
            return;
        }
        if (newUser.password.length < 6) {
            toast('Password must be at least 6 characters', 'error');
            return;
        }
        try {
            await api.registerUser(newUser.email, newUser.name, newUser.password, newUser.role);
            toast(`User "${newUser.name}" created! They can now log in.`);
            setShowAddUser(false);
            setNewUser({ name: '', email: '', password: '', role: 'rep' });
            loadUsers();
        } catch (err) {
            toast(err.message, 'error');
        }
    };

    const handleToggleStatus = async (user) => {
        const isDeactivating = user.status !== 'deactivated';
        try {
            await api.deactivateUser(user.id, !isDeactivating);
            toast(`${user.name} has been ${isDeactivating ? 'deactivated' : 'reactivated'}`);
            loadUsers();
        } catch (err) {
            toast(err.message, 'error');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.updateUser(userId, { role: newRole });
            toast('Role updated');
            loadUsers();
        } catch (err) {
            toast(err.message, 'error');
        }
    };

    const handleChangePassword = async () => {
        if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
            toast('Password must be at least 6 characters', 'error');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast('Passwords do not match', 'error');
            return;
        }
        try {
            await api.changePassword(null, pwForm.newPassword, showChangePassword);
            toast('Password updated');
            setShowChangePassword(null);
            setPwForm({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast(err.message, 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'invited': return '#f59e0b';
            case 'deactivated': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>;

    return (
        <div>
            <div className="section-header">
                <h3>{users.filter(u => u.status === 'active').length} active / {users.length} total users</h3>
                <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>+ Add User</button>
            </div>

            <div className="automation-list">
                {users.map(user => (
                    <div className={`automation-card ${user.status === 'deactivated' ? 'inactive' : ''}`} key={user.id}>
                        <div className="automation-card-header" style={{ cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff',
                                    background: user.avatarColor || '#0D9488', flexShrink: 0,
                                }}>
                                    {getInitials(user.name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {user.name}
                                        {user.id === currentUser?.id && (
                                            <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>You</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {user.lastLogin ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}` : 'Never logged in'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{
                                    fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                                    background: getStatusColor(user.status) + '22', color: getStatusColor(user.status),
                                    textTransform: 'capitalize',
                                }}>
                                    {user.status}
                                </span>
                                <select
                                    className="form-select"
                                    value={user.role}
                                    onChange={e => handleRoleChange(user.id, e.target.value)}
                                    style={{ width: 100, fontSize: 12, padding: '4px 8px' }}
                                    disabled={user.id === currentUser?.id}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="rep">Sales Rep</option>
                                    <option value="senior_sales">Senior Sales Consultant</option>
                                    <option value="customer_care">Customer Care Rep</option>
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => { setShowChangePassword(user.id); setPwForm({ newPassword: '', confirmPassword: '' }); }}
                                    title="Reset password"
                                    style={{ fontSize: 12 }}
                                >
                                    🔑
                                </button>
                                {user.id !== currentUser?.id && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleToggleStatus(user)}
                                        title={user.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                                        style={{ fontSize: 12 }}
                                    >
                                        {user.status === 'deactivated' ? '✅' : '🚫'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            {showAddUser && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUser(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>👤 Add New User</h3>
                            <button className="modal-close" onClick={() => setShowAddUser(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" value={newUser.name}
                                    onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                                    placeholder="John Smith" autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input className="form-input" type="email" value={newUser.email}
                                    onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                                    placeholder="john@company.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Password *</label>
                                <input className="form-input" type="text" value={newUser.password}
                                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                                    placeholder="Min 6 characters" />
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Share this with the user — they can change it after logging in.
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={newUser.role}
                                    onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                                    <option value="rep">Sales Rep — sees only their own deals</option>
                                    <option value="senior_sales">Senior Sales Consultant — sees only their own deals</option>
                                    <option value="customer_care">Customer Care Rep — sees only their own deals</option>
                                    <option value="admin">Admin — sees all data, manages users</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddUser(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddUser}>Create User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowChangePassword(null)}>
                    <div className="modal" style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3>🔑 Reset Password</h3>
                            <button className="modal-close" onClick={() => setShowChangePassword(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                                Setting password for: <strong>{users.find(u => u.id === showChangePassword)?.name}</strong>
                            </p>
                            <div className="form-group">
                                <label className="form-label">New Password *</label>
                                <input className="form-input" type="text" value={pwForm.newPassword}
                                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                                    placeholder="Min 6 characters" autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password *</label>
                                <input className="form-input" type="text" value={pwForm.confirmPassword}
                                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                    placeholder="Type password again" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowChangePassword(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleChangePassword}>Update Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
