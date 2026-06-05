export const LandingPage = ({ 
  setCurrentPage, 
  isFirebaseConfigured, 
  showFirebaseBanner, 
  setShowFirebaseBanner,
  firebaseError
}) => {

  const renderFirebaseWarning = () => {
    if (!showFirebaseBanner) return null;
    return (
      <div className="firebase-banner">
        <span>
          ⚠️ <strong>Firebase Configuration Required</strong>: {firebaseError || "To enable user logins and saving circuit history, please copy `client/.env.example` to `client/.env` and add your Firebase API credentials."}
        </span>
        <button className="firebase-banner-close" onClick={() => setShowFirebaseBanner(false)}>✕</button>
      </div>
    );
  };

  return (
    <div className="landing-container">
      {renderFirebaseWarning()}
      
      <div className="landing-hero">
        <h1 className="landing-title">Circuit Solver</h1>
        <p className="landing-subtitle">
          A premium, symbolic electrical network analyzer built on Graph Theory and Laplace Transform algorithms. Solve complex circuits in real-time.
        </p>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">✏️</div>
          <h3>Schematic Editor</h3>
          <p>Drag, drop, and connect component wires onto our clean vector canvas. Select custom values and arrange topologies manually.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧮</div>
          <h3>Symbolic Laplace Solver</h3>
          <p>Generates Cut Set (KCL) and Tie Set (KVL) equations in the s-domain and performs Inverse Laplace Transforms to output analytical equations.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Transient Plots</h3>
          <p>Graph step response voltages and currents over time. View detailed graphical curves and download the plots in HD png.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">☁️</div>
          <h3>Cloud Persistence</h3>
          <p>Sync your circuits to your user profile. Load previous schematics instantly or manage history, powered secure by Google Firebase.</p>
        </div>
      </div>

      <div className="landing-cta">
        <button className="cta-btn-primary" onClick={() => setCurrentPage('workspace')}>
          Start Designing (Guest)
        </button>
        <button 
          className="cta-btn-secondary" 
          disabled={!isFirebaseConfigured}
          onClick={() => {
            if (isFirebaseConfigured) {
              setCurrentPage('auth');
            }
          }}
        >
          Sign In / Register
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
