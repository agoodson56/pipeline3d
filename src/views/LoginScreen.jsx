import { useState } from 'react';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onLogin(email.trim(), password);
        } catch (err) {
            setError(err.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="login-screen">
            <div className="login-bg-effects">
                <div className="login-orb login-orb-1" />
                <div className="login-orb login-orb-2" />
                <div className="login-orb login-orb-3" />
            </div>

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <img src="/logo.png" alt="Pipeline3D" className="login-logo" />
                        <h1 className="login-title">Pipeline3D</h1>
                        <p className="login-subtitle">Sales CRM — Sign in to your account</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="login-field">
                            <label className="login-label">Email address</label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">📧</span>
                                <input
                                    type="email"
                                    className="login-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">Password</label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="login-input"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="login-show-pw"
                                    onClick={() => setShowPassword(s => !s)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`login-submit ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <><div className="login-spinner" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Need an account? Contact your admin.</p>
                    </div>
                </div>

                <div className="login-branding">
                    <span>Powered by Pipeline3D</span>
                </div>
            </div>
        </div>
    );
}
