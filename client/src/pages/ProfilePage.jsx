export const ProfilePage = ({
  user,
  savedCircuits,
  profileLoading,
  handleLoadCircuit,
  handleDeleteCircuit,
  handleDeleteAccount,
  handleLogout,
  setCurrentPage
}) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto' }}>
      {/* Header Navigation back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Profile Dashboard</h2>
        <button className="clear-btn-light" onClick={() => setCurrentPage('workspace')}>
          ← Back to Editor
        </button>
      </div>

      <div className="profile-layout">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-meta">Logged In User</div>
          
          <div className="profile-actions">
            <button className="clear-btn-light" style={{ width: '100%' }} onClick={handleLogout}>
              Logout Account
            </button>
            <button 
              className="clear-btn-light" 
              style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }} 
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Saved Circuits list */}
        <div className="profile-content">
          <h3>Saved Circuits & History ({savedCircuits.length})</h3>
          <div className="divider"></div>

          {profileLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading your saved history...</p>
          ) : savedCircuits.length === 0 ? (
            <div className="empty-history-slate">
              <div className="empty-history-icon">📐</div>
              <h3>No Saved Circuits Yet</h3>
              <p style={{ marginTop: '0.5rem' }}>Create some designs in the editor, name them, and save them to your account to view them here.</p>
            </div>
          ) : (
            <div className="history-list">
              {savedCircuits.map((circ) => (
                <div key={circ.id} className="history-card">
                  <div className="history-info">
                    <span className="history-name">{circ.name}</span>
                    <span className="history-details">
                      Nodes: {circ.nodes.length} | Branches: {circ.branches.length} ({circ.branches.map(b => b.id).join(', ')})
                    </span>
                    <span className="history-date">
                      Saved: {new Date(circ.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="history-actions">
                    <button 
                      className="add-btn-light" 
                      style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      onClick={() => handleLoadCircuit(circ)}
                    >
                      Load in Editor
                    </button>
                    <button 
                      className="clear-btn-light" 
                      style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      onClick={(e) => handleDeleteCircuit(circ.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
