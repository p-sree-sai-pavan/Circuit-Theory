export const AuthPage = ({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMode,
  setAuthMode,
  authError,
  setAuthError,
  authLoading,
  handleLogin,
  handleSignUp,
  handleGoogleLogin,
  isFirebaseConfigured,
  setCurrentPage
}) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setAuthError(null); }}
          >
            Log In
          </button>
          <button 
            type="button"
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => { setAuthMode('signup'); setAuthError(null); }}
          >
            Register
          </button>
        </div>

        <h2 className="auth-title">
          {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="auth-subtitle">
          {authMode === 'login' 
            ? 'Log in to sync your circuits and view history.' 
            : 'Register a free account to persist your electrical designs.'}
        </p>

        <form className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
          <div className="input-group-light">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={authEmail} 
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="you@example.com" 
            />
          </div>
          <div className="input-group-light">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={authPassword} 
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="••••••••" 
            />
          </div>

          {authError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0.25rem 0' }}>❌ {authError}</p>}

          <button type="submit" className="add-btn-light" disabled={authLoading}>
            {authLoading 
              ? 'Processing...' 
              : (authMode === 'login' ? 'Log In' : 'Create Account')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <button 
            type="button" 
            className="google-btn" 
            onClick={handleGoogleLogin} 
            disabled={authLoading || !isFirebaseConfigured}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#EA4335" d="M9 3.6c1.62 0 3.06.56 4.21 1.66l3.15-3.15C14.45 1.07 11.97 0 9 0 5.48 0 2.44 2.02.96 4.96l3.65 2.83C5.47 5.25 7.07 3.6 9 3.6z"/>
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.7l3.64 2.83c2.13-1.97 3.35-4.87 3.35-8.17z"/>
              <path fill="#FBBC05" d="M4.61 10.61c-.18-.56-.29-1.16-.29-1.78s.11-1.22.29-1.78L.96 4.22C.33 5.48 0 6.9 0 8.4s.33 2.92.96 4.18l3.65-2.97z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-3.64-2.83c-1 .67-2.28 1.07-3.64 1.07-3.19 0-5.89-2.15-6.85-5.04L.96 12.06C2.44 15.02 5.48 18 9 18z"/>
            </svg>
            Continue with Google
          </button>
          
          <button 
            type="button" 
            className="clear-btn-light" 
            style={{ width: '100%' }}
            onClick={() => {
              setAuthEmail('');
              setAuthPassword('');
              setAuthError(null);
              setCurrentPage('landing');
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
