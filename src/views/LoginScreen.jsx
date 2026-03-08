import { useState } from 'react';

export default function LoginScreen({ onLogin, onVerify2FA }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 2FA state
    const [needs2FA, setNeeds2FA] = useState(false);
    const [challengeToken, setChallengeToken] = useState('');
    const [totpCode, setTotpCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await onLogin(email.trim(), password);
            // Check if 2FA is required
            if (result?.requires2FA) {
                setNeeds2FA(true);
                setChallengeToken(result.challengeToken);
                setTotpCode('');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        }
        setLoading(false);
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        if (totpCode.length !== 6) {
            setError('Enter the 6-digit code from your authenticator app');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onVerify2FA(challengeToken, totpCode);
        } catch (err) {
            setError(err.message || 'Invalid 2FA code');
        }
        setLoading(false);
    };

    const handleBack = () => {
        setNeeds2FA(false);
        setChallengeToken('');
        setTotpCode('');
        setError('');
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
                        <p className="login-subtitle">
                            {needs2FA ? 'Two-Factor Authentication' : 'Sales CRM — Sign in to your account'}
                        </p>
                    </div>

                    {!needs2FA ? (
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
                    ) : (
                        <form className="login-form" onSubmit={handle2FASubmit}>
                            {error && (
                                <div className="login-error">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted, #888)' }}>
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>

                            <div className="login-field">
                                <label className="login-label">Authentication Code</label>
                                <div className="login-input-wrapper">
                                    <span className="login-input-icon">🔢</span>
                                    <input
                                        type="text"
                                        className="login-input"
                                        value={totpCode}
                                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        autoFocus
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={6}
                                        style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`login-submit ${loading ? 'loading' : ''}`}
                                disabled={loading || totpCode.length !== 6}
                            >
                                {loading ? (
                                    <><div className="login-spinner" /> Verifying...</>
                                ) : (
                                    '🔓 Verify & Sign In'
                                )}
                            </button>

                            <button type="button" className="login-submit" style={{ background: 'transparent', color: 'var(--text-muted, #888)', marginTop: 8 }} onClick={handleBack}>
                                ← Back to login
                            </button>
                        </form>
                    )}

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
