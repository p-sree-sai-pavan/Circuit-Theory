import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Import Firebase configs
import { auth, db, isFirebaseConfigured } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  writeBatch
} from 'firebase/firestore';

// Import pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import WorkspacePage from './pages/WorkspacePage';

const API_URL = import.meta.env.VITE_API_URL || '';

const EXAMPLES = {
  'series-rc': {
    name: '⚡ Series RC',
    nodes: ['0', '1', '2'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 5 },
      { id: 'C1', from: '2', to: '0', type: 'C', value: 0.1 }
    ],
    positions: { '0': { x: 350, y: 340 }, '1': { x: 180, y: 140 }, '2': { x: 530, y: 140 } }
  },
  'series-rlc': {
    name: '🔄 Series RLC',
    nodes: ['0', '1', '2', '3'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 2 },
      { id: 'L1', from: '2', to: '3', type: 'L', value: 0.5 },
      { id: 'C1', from: '3', to: '0', type: 'C', value: 0.2 }
    ],
    positions: { '0': { x: 350, y: 340 }, '1': { x: 120, y: 140 }, '2': { x: 310, y: 140 }, '3': { x: 530, y: 140 } }
  },
  'complex': {
    name: '🌐 Complex Loop',
    nodes: ['0', '1', '2', '3'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 2 },
      { id: 'L1', from: '2', to: '3', type: 'L', value: 1 },
      { id: 'C1', from: '2', to: '0', type: 'C', value: 0.5 },
      { id: 'R2', from: '3', to: '0', type: 'R', value: 4 },
      { id: 'I1', from: '0', to: '3', type: 'I', value: 2 }
    ],
    positions: { '0': { x: 350, y: 340 }, '1': { x: 120, y: 140 }, '2': { x: 350, y: 140 }, '3': { x: 560, y: 140 } }
  }
};

function App() {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);

  // Authentication states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Saved History states
  const [savedCircuits, setSavedCircuits] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saveCircuitName, setSaveCircuitName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingCircuit, setSavingCircuit] = useState(false);
  const [showFirebaseBanner, setShowFirebaseBanner] = useState(!isFirebaseConfigured);

  // Core Circuit Solver state
  const [nodes, setNodes] = useState(['0']);
  const [branches, setBranches] = useState([]);
  const [selectedType, setSelectedType] = useState('R');
  const [componentValue, setComponentValue] = useState(10);
  const [formFrom, setFormFrom] = useState('1');
  const [formTo, setFormTo] = useState('0');

  const [nodePositions, setNodePositions] = useState({ '0': { x: 350, y: 340 } });
  const [draggedNode, setDraggedNode] = useState(null);
  const [tool, setTool] = useState('wire');
  const [isDraggingWire, setIsDraggingWire] = useState(false);
  const [drawingWireFrom, setDrawingWireFrom] = useState(null);
  const [drawStartCoords, setDrawStartCoords] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(null);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Listen to Auth State
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchHistory(currentUser.uid);
      } else {
        setSavedCircuits([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;
    if (!authEmail || !authPassword) { setAuthError('Please fill all fields'); return; }
    setAuthLoading(true); setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setCurrentPage('workspace');
      setAuthEmail(''); setAuthPassword('');
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally { setAuthLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;
    if (!authEmail || !authPassword) { setAuthError('Please fill all fields'); return; }
    setAuthLoading(true); setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      setCurrentPage('workspace');
      setAuthEmail(''); setAuthPassword('');
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      setCurrentPage('landing');
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('landing');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Firestore Database Operations
  const fetchHistory = async (uid) => {
    if (!isFirebaseConfigured) return;
    setProfileLoading(true);
    try {
      const q = query(
        collection(db, 'circuits'),
        where('userId', '==', uid)
      );
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedCircuits(list);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally { setProfileLoading(false); }
  };

  const handleSaveCircuit = async (e) => {
    e.preventDefault();
    if (!user || !isFirebaseConfigured) return;
    if (!saveCircuitName.trim()) return;
    setSavingCircuit(true);
    try {
      const newCircuit = {
        userId: user.uid,
        name: saveCircuitName.trim(),
        nodes,
        branches,
        positions: nodePositions,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'circuits'), newCircuit);
      
      setSavedCircuits(prev => [{ id: docRef.id, ...newCircuit }, ...prev]);
      setShowSaveDialog(false);
      setSaveCircuitName('');
      alert('Circuit saved successfully!');
    } catch (err) {
      console.error("Failed to save circuit:", err);
      alert("Error saving circuit: " + err.message);
    } finally { setSavingCircuit(false); }
  };

  const handleDeleteCircuit = async (id, e) => {
    e.stopPropagation();
    if (!isFirebaseConfigured) return;
    if (!window.confirm("Are you sure you want to delete this saved circuit?")) return;
    try {
      await deleteDoc(doc(db, 'circuits', id));
      setSavedCircuits(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Failed to delete circuit:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !isFirebaseConfigured) return;
    if (!window.confirm("WARNING: This will permanently delete your account and all saved circuits. This action cannot be undone. Proceed?")) return;
    
    try {
      const q = query(collection(db, 'circuits'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      await deleteUser(user);
      
      setUser(null);
      setSavedCircuits([]);
      setCurrentPage('landing');
      alert("Account and data deleted successfully.");
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account. For security reasons, please log out, log back in, and try again.");
    }
  };

  // Canvas positions helper
  const ensureNodePosition = (nodeLabel, customCoords = null) => {
    if (nodePositions[nodeLabel]) return nodePositions[nodeLabel];
    let position;
    if (customCoords) {
      position = customCoords;
    } else {
      const idx = parseInt(nodeLabel) || 0;
      if (nodeLabel === '0') { position = { x: 350, y: 340 }; }
      else {
        const cols = 4;
        const row = Math.floor((idx - 1) / cols);
        const col = (idx - 1) % cols;
        position = { x: 100 + col * 160, y: 100 + row * 140 };
      }
    }
    setNodePositions(prev => ({ ...prev, [nodeLabel]: position }));
    return position;
  };

  const loadExample = (key) => {
    const ex = EXAMPLES[key];
    setNodes(ex.nodes);
    setBranches(ex.branches);
    setNodePositions(ex.positions);
    setResults(null); setError(null); setValidationError('');
    setSelectedBranchIndex(null); setDrawingWireFrom(null); setIsDraggingWire(false);
  };

  const handleLoadCircuit = (circuit) => {
    setNodes(circuit.nodes);
    setBranches(circuit.branches);
    setNodePositions(circuit.positions || {});
    setResults(null);
    setError(null);
    setValidationError('');
    setCurrentPage('workspace');
  };

  const clearCircuit = () => {
    if (branches.length > 0 && !window.confirm('Clear everything?')) return;
    setBranches([]); setNodes(['0']); setNodePositions({ '0': { x: 350, y: 340 } });
    setResults(null); setError(null); setValidationError('');
    setSelectedBranchIndex(null); setIsDraggingWire(false);
  };

  const analyzeCircuit = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { nodes, branches });
      if (res.data.status === 'success') setResults(res.data);
      else setError(res.data.message || 'Analysis failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection failed. Is the server running?');
    } finally { setLoading(false); }
  };

  const exportResults = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify({ circuit: { nodes, branches }, equations: results.equations, timeDomain: results.time_domain, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `circuit-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPlot = (plot) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${plot.image}`; a.download = `${plot.name}.png`; a.click();
  };

  const addBranchFromForm = () => {
    if (!formFrom || !formTo) { setValidationError('Both node fields required'); return; }
    if (formFrom === formTo) { setValidationError('Nodes must be different'); return; }
    const newN = new Set(nodes); newN.add(formFrom); newN.add(formTo);
    setNodes(Array.from(newN).sort());
    ensureNodePosition(formFrom); ensureNodePosition(formTo);
    
    // Create branch inline logic
    const val = parseFloat(componentValue);
    if (isNaN(val) || val <= 0) { setValidationError('Value must be positive'); return; }
    setValidationError('');
    const count = branches.filter(b => b.type === selectedType).length + 1;
    const id = `${selectedType}${count}`;
    setBranches(prev => [...prev, { id, from: formFrom, to: formTo, type: selectedType, value: val }]);
  };

  const deleteBranch = (index) => {
    const updated = branches.filter((_, i) => i !== index);
    setBranches(updated); setSelectedBranchIndex(null);
    const activeN = new Set(['0']);
    updated.forEach(b => { activeN.add(b.from); activeN.add(b.to); });
    setNodes(Array.from(activeN).sort());
  };

  const getPreviewStart = () => {
    if (!isDraggingWire) return { x: 0, y: 0 };
    if (drawingWireFrom === 'NEW_START') return drawStartCoords;
    return nodePositions[drawingWireFrom] || drawStartCoords;
  };

  // Navigation router switch
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            setCurrentPage={setCurrentPage} 
            isFirebaseConfigured={isFirebaseConfigured}
            showFirebaseBanner={showFirebaseBanner}
            setShowFirebaseBanner={setShowFirebaseBanner}
          />
        );
      case 'auth':
        return (
          <AuthPage 
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authError={authError}
            setAuthError={setAuthError}
            authLoading={authLoading}
            handleLogin={handleLogin}
            handleSignUp={handleSignUp}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            user={user}
            savedCircuits={savedCircuits}
            profileLoading={profileLoading}
            handleLoadCircuit={handleLoadCircuit}
            handleDeleteCircuit={handleDeleteCircuit}
            handleDeleteAccount={handleDeleteAccount}
            handleLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'workspace':
      default:
        return (
          <WorkspacePage 
            user={user}
            nodes={nodes}
            setNodes={setNodes}
            branches={branches}
            setBranches={setBranches}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            componentValue={componentValue}
            setComponentValue={setComponentValue}
            formFrom={formFrom}
            setFormFrom={setFormFrom}
            formTo={formTo}
            setFormTo={setFormTo}
            nodePositions={nodePositions}
            setNodePositions={setNodePositions}
            draggedNode={draggedNode}
            setDraggedNode={setDraggedNode}
            tool={tool}
            setTool={setTool}
            isDraggingWire={isDraggingWire}
            setIsDraggingWire={setIsDraggingWire}
            drawingWireFrom={drawingWireFrom}
            setDrawingWireFrom={setDrawingWireFrom}
            drawStartCoords={drawStartCoords}
            setDrawStartCoords={setDrawStartCoords}
            mousePos={mousePos}
            setMousePos={setMousePos}
            selectedBranchIndex={selectedBranchIndex}
            setSelectedBranchIndex={setSelectedBranchIndex}
            results={results}
            setResults={setResults}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
            validationError={validationError}
            setValidationError={setValidationError}
            showSaveDialog={showSaveDialog}
            setShowSaveDialog={setShowSaveDialog}
            saveCircuitName={saveCircuitName}
            setSaveCircuitName={setSaveCircuitName}
            savingCircuit={savingCircuit}
            isFirebaseConfigured={isFirebaseConfigured}
            setCurrentPage={setCurrentPage}
            handleLogout={handleLogout}
            handleSaveCircuit={handleSaveCircuit}
            loadExample={loadExample}
            clearCircuit={clearCircuit}
            analyzeCircuit={analyzeCircuit}
            exportResults={exportResults}
            downloadPlot={downloadPlot}
            addBranchFromForm={addBranchFromForm}
            deleteBranch={deleteBranch}
            ensureNodePosition={ensureNodePosition}
            getPreviewStart={getPreviewStart}
            EXAMPLES={EXAMPLES}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      {renderPage()}
    </div>
  );
}

export default App;
