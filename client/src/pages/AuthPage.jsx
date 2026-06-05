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
