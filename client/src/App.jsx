import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import './App.css';

// Import Firebase config and auth/firestore functions
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
  orderBy,
  writeBatch
} from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || '';

const Latex = ({ math }) => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, { throwOnError: false });
    }
  }, [math]);
  return <span ref={containerRef} />;
};

// Preset examples with canvas positions
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

const COMPONENT_TYPES = [
  { type: 'R', name: 'Resistor', unit: 'Ω', color: '#7c3aed' },
  { type: 'L', name: 'Inductor', unit: 'H', color: '#d97706' },
  { type: 'C', name: 'Capacitor', unit: 'F', color: '#0891b2' },
  { type: 'V', name: 'Voltage Src', unit: 'V', color: '#dc2626' },
  { type: 'I', name: 'Current Src', unit: 'A', color: '#2563eb' },
];

// Ground symbol
const GroundSymbol = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <line x1="0" y1="0" x2="0" y2="16" stroke="#059669" strokeWidth="2.5" />
    <line x1="-12" y1="16" x2="12" y2="16" stroke="#059669" strokeWidth="2.5" />
    <line x1="-7" y1="21" x2="7" y2="21" stroke="#059669" strokeWidth="2" />
    <line x1="-3" y1="26" x2="3" y2="26" stroke="#059669" strokeWidth="1.5" />
  </g>
);

// Mini symbol SVGs for the left toolbox
const MiniSymbol = ({ type, color }) => {
  const c = color || '#0f172a';
  if (type === 'R') return (
    <svg width="48" height="20" viewBox="0 0 48 20"><path d="M0 10 H10 L12 2 L16 18 L20 2 L24 18 L28 2 L32 18 L34 10 H48" fill="none" stroke={c} strokeWidth="1.8"/></svg>
  );
  if (type === 'C') return (
    <svg width="48" height="20" viewBox="0 0 48 20"><path d="M0 10 H19 M19 2 V18 M27 2 V18 M27 10 H48" fill="none" stroke={c} strokeWidth="1.8"/></svg>
  );
  if (type === 'L') return (
    <svg width="48" height="20" viewBox="0 0 48 20"><path d="M0 10 H8 Q11 0 14 10 Q17 0 20 10 Q23 0 26 10 Q29 0 32 10 Q35 0 38 10 H48" fill="none" stroke={c} strokeWidth="1.8"/></svg>
  );
  if (type === 'V') return (
    <svg width="48" height="20" viewBox="0 0 48 20"><circle cx="24" cy="10" r="8" fill="none" stroke={c} strokeWidth="1.8"/><path d="M0 10 H16 M32 10 H48" fill="none" stroke={c} strokeWidth="1.8"/><path d="M21 10 H23 M22 8 V12" stroke={c} strokeWidth="1"/><path d="M25 10 H27" stroke={c} strokeWidth="1"/></svg>
  );
  if (type === 'I') return (
    <svg width="48" height="20" viewBox="0 0 48 20"><circle cx="24" cy="10" r="8" fill="none" stroke={c} strokeWidth="1.8"/><path d="M0 10 H16 M32 10 H48" fill="none" stroke={c} strokeWidth="1.8"/><path d="M20 10 H28 M25 7 L28 10 L25 13" fill="none" stroke={c} strokeWidth="1"/></svg>
  );
  return null;
};

// Full-size schematic component rendered on SVG canvas
const ComponentSymbol = ({ type, x1, y1, x2, y2, value, id, onSelect, isSelected }) => {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.sqrt(dx * dx + dy * dy);
  if (L === 0) return null;
  const theta = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;

  let symbolPath = "";
  let wireStart = `M 0 0 L ${L / 2 - 25} 0`;
  let wireEnd = `M ${L / 2 + 25} 0 L ${L} 0`;

  if (type === 'R') {
    const s = L / 2 - 25;
    symbolPath = `M ${s} 0 L ${s+4} -8 L ${s+11} 8 L ${s+18} -8 L ${s+25} 8 L ${s+32} -8 L ${s+39} 8 L ${s+46} -8 L ${s+50} 0`;
  } else if (type === 'C') {
    const s = L / 2 - 5;
    symbolPath = `M ${s} -14 V 14 M ${s+10} -14 V 14`;
    wireStart = `M 0 0 L ${s} 0`;
    wireEnd = `M ${s+10} 0 L ${L} 0`;
  } else if (type === 'L') {
    const s = L / 2 - 20;
    symbolPath = `M ${s} 0 Q ${s+5} -12 ${s+10} 0 Q ${s+15} -12 ${s+20} 0 Q ${s+25} -12 ${s+30} 0 Q ${s+35} -12 ${s+40} 0`;
    wireStart = `M 0 0 L ${s} 0`;
    wireEnd = `M ${s+40} 0 L ${L} 0`;
  } else if (type === 'V' || type === 'I') {
    const cx = L / 2;
    wireStart = `M 0 0 L ${cx - 15} 0`;
    wireEnd = `M ${cx + 15} 0 L ${L} 0`;
  }

  const compInfo = COMPONENT_TYPES.find(c => c.type === type);
  const accentColor = isSelected ? (compInfo?.color || '#2563eb') : '#0f172a';
  const wireColor = isSelected ? (compInfo?.color || '#2563eb') : '#475569';
  const unitLabel = compInfo?.unit || '';

  return (
    <g className="schematic-branch-container" onClick={onSelect}>
      <g transform={`translate(${x1}, ${y1}) rotate(${theta})`}>
        <rect x="0" y="-18" width={L} height="36" fill="transparent" />
        <path d={wireStart} className="schematic-branch-path-light" stroke={wireColor} strokeWidth={isSelected ? "2.5" : "2"} />
        <path d={wireEnd} className="schematic-branch-path-light" stroke={wireColor} strokeWidth={isSelected ? "2.5" : "2"} />
        {symbolPath && <path d={symbolPath} className="schematic-branch-symbol-light" stroke={accentColor} strokeWidth="2" />}

        {type === 'V' && (
          <g>
            <circle cx={L/2} cy="0" r="14" fill="#ffffff" stroke={accentColor} strokeWidth="2" className="schematic-branch-symbol-light" />
            <path d={`M ${L/2-6} -3 H ${L/2-2} M ${L/2-4} -5 V -1`} stroke="#dc2626" strokeWidth="1.5" />
            <path d={`M ${L/2+2} 3 H ${L/2+6}`} stroke="#2563eb" strokeWidth="1.5" />
          </g>
        )}
        {type === 'I' && (
          <g>
            <circle cx={L/2} cy="0" r="14" fill="#ffffff" stroke={accentColor} strokeWidth="2" className="schematic-branch-symbol-light" />
            <path d={`M ${L/2-6} 0 H ${L/2+6} M ${L/2+3} -3 L ${L/2+6} 0 L ${L/2+3} 3`} stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
      <g transform={`translate(${midX}, ${midY - 18})`}>
        <text className="schematic-branch-text-light" fill={isSelected ? accentColor : '#64748b'} style={{ textAnchor:'middle', fontSize:'10.5px', fontWeight: isSelected ? 700 : 600 }}>
          {id} = {value}{unitLabel}
        </text>
      </g>
    </g>
  );
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
  const [nodes, setNodes] = useState(['0'])
  const [branches, setBranches] = useState([])
  const [selectedType, setSelectedType] = useState('R')
  const [componentValue, setComponentValue] = useState(10)
  const [formFrom, setFormFrom] = useState('1')
  const [formTo, setFormTo] = useState('0')

  const [nodePositions, setNodePositions] = useState({ '0': { x: 350, y: 340 } })
  const [draggedNode, setDraggedNode] = useState(null)
  const [tool, setTool] = useState('wire')
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [drawingWireFrom, setDrawingWireFrom] = useState(null)
  const [drawStartCoords, setDrawStartCoords] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(null)

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationError, setValidationError] = useState('')

  const svgRef = useRef(null)

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
      // Sort client-side by date
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
      // 1. Delete all saved circuits in Firestore
      const q = query(collection(db, 'circuits'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // 2. Delete the user authentication record
      await deleteUser(user);
      
      // Clean up local states
      setUser(null);
      setSavedCircuits([]);
      setCurrentPage('landing');
      alert("Account and data deleted successfully.");
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account. For security reasons, please log out, log back in, and try again.");
    }
  };

  // Original UI Canvas handlers
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
  }

  const loadExample = (key) => {
    const ex = EXAMPLES[key];
    setNodes(ex.nodes);
    setBranches(ex.branches);
    setNodePositions(ex.positions);
    setResults(null); setError(null); setValidationError('');
    setSelectedBranchIndex(null); setDrawingWireFrom(null); setIsDraggingWire(false);
  }

  const getMouseCoords = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 700;
    const y = ((e.clientY - rect.top) / rect.height) * 460;
    return { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 };
  }

  const handleCanvasMouseDown = (e) => {
    const coords = getMouseCoords(e);
    if (tool === 'select') {
      for (const [label, pos] of Object.entries(nodePositions)) {
        if (Math.sqrt((pos.x - coords.x)**2 + (pos.y - coords.y)**2) < 18) {
          setDraggedNode(label); return;
        }
      }
      return;
    }
    if (tool === 'wire') {
      e.preventDefault();
      let clickedNode = null;
      for (const [label, pos] of Object.entries(nodePositions)) {
        if (Math.sqrt((pos.x - coords.x)**2 + (pos.y - coords.y)**2) < 18) {
          clickedNode = label; break;
        }
      }
      setDrawingWireFrom(clickedNode !== null ? clickedNode : 'NEW_START');
      setDrawStartCoords(coords);
      setMousePos(coords);
      setIsDraggingWire(true);
    }
  }

  const handleCanvasMouseMove = (e) => {
    const coords = getMouseCoords(e);
    if (draggedNode !== null) {
      setNodePositions(prev => ({ ...prev, [draggedNode]: coords }));
    } else if (isDraggingWire) {
      setMousePos(coords);
    }
  }

  const handleCanvasMouseUp = (e) => {
    if (draggedNode !== null) { setDraggedNode(null); return; }
    if (!isDraggingWire) return;
    const coords = getMouseCoords(e);
    setIsDraggingWire(false);

    let releasedNode = null;
    for (const [label, pos] of Object.entries(nodePositions)) {
      if (Math.sqrt((pos.x - coords.x)**2 + (pos.y - coords.y)**2) < 18) {
        releasedNode = label; break;
      }
    }
    const endToken = releasedNode !== null ? releasedNode : 'NEW_END';
    if (drawingWireFrom === endToken && drawingWireFrom !== 'NEW_START') {
      setDrawingWireFrom(null); return;
    }

    let startLabel, endLabel;
    const currentNodes = [...nodes];

    if (drawingWireFrom === 'NEW_START') {
      let n = 0; while (currentNodes.includes(n.toString())) n++;
      startLabel = n.toString();
      setNodePositions(prev => ({ ...prev, [startLabel]: drawStartCoords }));
      currentNodes.push(startLabel);
    } else {
      startLabel = drawingWireFrom;
    }

    if (endToken === 'NEW_END') {
      let n = 0; while (currentNodes.includes(n.toString()) || n.toString() === startLabel) n++;
      endLabel = n.toString();
      setNodePositions(prev => ({ ...prev, [endLabel]: coords }));
      currentNodes.push(endLabel);
    } else {
      endLabel = endToken;
    }

    if (startLabel !== endLabel) {
      setNodes(currentNodes.sort());
      createBranch(startLabel, endLabel);
    }
    setDrawingWireFrom(null); setDrawStartCoords(null);
  }

  const createBranch = (from, to, customVal = null) => {
    const val = customVal !== null ? customVal : parseFloat(componentValue);
    if (isNaN(val) || val <= 0) { setValidationError('Value must be positive'); return; }
    setValidationError('');
    const count = branches.filter(b => b.type === selectedType).length + 1;
    const id = `${selectedType}${count}`;
    setBranches(prev => [...prev, { id, from, to, type: selectedType, value: val }]);
    ensureNodePosition(from); ensureNodePosition(to);
  }

  const addBranchFromForm = () => {
    if (!formFrom || !formTo) { setValidationError('Both node fields required'); return; }
    if (formFrom === formTo) { setValidationError('Nodes must be different'); return; }
    const newN = new Set(nodes); newN.add(formFrom); newN.add(formTo);
    setNodes(Array.from(newN).sort());
    ensureNodePosition(formFrom); ensureNodePosition(formTo);
    createBranch(formFrom, formTo);
  }

  const deleteBranch = (index) => {
    const updated = branches.filter((_, i) => i !== index);
    setBranches(updated); setSelectedBranchIndex(null);
    const activeN = new Set(['0']);
    updated.forEach(b => { activeN.add(b.from); activeN.add(b.to); });
    setNodes(Array.from(activeN).sort());
  }

  const clearCircuit = () => {
    if (branches.length > 0 && !window.confirm('Clear everything?')) return;
    setBranches([]); setNodes(['0']); setNodePositions({ '0': { x: 350, y: 340 } });
    setResults(null); setError(null); setValidationError('');
    setSelectedBranchIndex(null); setIsDraggingWire(false);
  }

  const analyzeCircuit = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { nodes, branches });
      if (res.data.status === 'success') setResults(res.data);
      else setError(res.data.message || 'Analysis failed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection failed. Is the server running?');
    } finally { setLoading(false); }
  }

  const exportResults = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify({ circuit: { nodes, branches }, equations: results.equations, timeDomain: results.time_domain, timestamp: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `circuit-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const downloadPlot = (plot) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${plot.image}`; a.download = `${plot.name}.png`; a.click();
  }

  useEffect(() => { nodes.forEach(n => ensureNodePosition(n)); }, [nodes]);

  const getPreviewStart = () => {
    if (!isDraggingWire) return { x: 0, y: 0 };
    if (drawingWireFrom === 'NEW_START') return drawStartCoords;
    return nodePositions[drawingWireFrom] || drawStartCoords;
  }

  // --- RENDERING VIEWS ---

  // 1. Unconfigured Firebase Warning Banner
  const renderFirebaseWarning = () => {
    if (!showFirebaseBanner) return null;
    return (
      <div className="firebase-banner">
        <span>
          ⚠️ <strong>Firebase Configuration Required</strong>: To enable user logins and saving circuit history, please copy `client/.env.example` to `client/.env` and add your Firebase API credentials.
        </span>
        <button className="firebase-banner-close" onClick={() => setShowFirebaseBanner(false)}>✕</button>
      </div>
    );
  };

  // 2. Landing Page
  const renderLandingPage = () => {
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
                setAuthMode('login');
                setAuthError(null);
                setCurrentPage('auth');
              } else {
                alert('Firebase is not configured. Please see the warning banner.');
              }
            }}
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  };

  // 3. Auth Page (Login / Sign Up)
  const renderAuthPage = () => {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
            >
              Log In
            </button>
            <button 
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

  // 4. User Profile & History Page
  const renderProfilePage = () => {
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

  // 5. Workspace Page
  const renderWorkspacePage = () => {
    return (
      <>
        {/* HEADER NAVBAR */}
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setCurrentPage('landing')}>
            <h1>⚡ Circuit Solver</h1>
            <span className="subtitle">Graph Theory & Laplace Engine</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Show login status / actions */}
            {user ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                  Logged in as: <strong>{user.email}</strong>
                </span>
                <button 
                  className="example-btn" 
                  style={{ width: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  onClick={() => setShowSaveDialog(true)}
                >
                  💾 Save Circuit
                </button>
                <button className="example-btn" style={{ width: 'auto' }} onClick={() => setCurrentPage('profile')}>
                  📊 My Profile & History
                </button>
                <button className="clear-btn-light" style={{ padding: '0.65rem 1rem' }} onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                  Running as Guest
                </span>
                <button 
                  className="example-btn" 
                  style={{ width: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  disabled={!isFirebaseConfigured}
                  onClick={() => {
                    if (isFirebaseConfigured) {
                      setAuthMode('login');
                      setAuthError(null);
                      setCurrentPage('auth');
                    } else {
                      alert('Firebase is not configured. Run app locally or configure the .env keys.');
                    }
                  }}
                >
                  🔐 Log In to Save
                </button>
                <button className="example-btn" style={{ width: 'auto' }} onClick={() => setCurrentPage('landing')}>
                  🏠 Landing Page
                </button>
              </>
            )}
          </div>
        </div>

        {/* Save Dialog Modal */}
        {showSaveDialog && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
          }}>
            <div className="auth-card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1rem' }}>Save Current Circuit</h3>
              <form onSubmit={handleSaveCircuit}>
                <div className="input-group-light" style={{ marginBottom: '1.5rem' }}>
                  <label>Circuit Name</label>
                  <input 
                    type="text" 
                    required 
                    value={saveCircuitName}
                    onChange={e => setSaveCircuitName(e.target.value)}
                    placeholder="e.g. Series RLC Filter"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="clear-btn-light" onClick={() => { setShowSaveDialog(false); setSaveCircuitName(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="add-btn-light" style={{ width: 'auto' }} disabled={savingCircuit}>
                    {savingCircuit ? 'Saving...' : 'Confirm Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3-COLUMN LAYOUT */}
        <div className="container">

          {/* LEFT COLUMN — Component Toolbox */}
          <div className="editor-left">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ borderBottom:'none', margin:0, padding:0 }}>Components</h2>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                  <button 
                    key={key} 
                    className="example-btn" 
                    style={{ width: 'auto', padding: '0.35rem 0.50rem', fontSize: '0.75rem' }} 
                    onClick={() => loadExample(key)}
                  >
                    {ex.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="palette-dock-vertical">
              {COMPONENT_TYPES.map(comp => (
                <div
                  key={comp.type}
                  className={`palette-tile-light ${selectedType === comp.type ? 'active' : ''}`}
                  onClick={() => { setSelectedType(comp.type); setTool('wire'); }}
                >
                  <div className="palette-icon-wrapper-light">
                    <MiniSymbol type={comp.type} color={selectedType === comp.type ? comp.color : '#64748b'} />
                  </div>
                  <span className="palette-name-light">{comp.name}</span>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            {/* Value Slider */}
            <div className="value-slider-panel">
              <div className="slider-label-box">
                <span className="slider-label">Value</span>
                <span className="slider-value">{componentValue} {COMPONENT_TYPES.find(c => c.type === selectedType)?.unit}</span>
              </div>
              <input type="range" min="0.1" max="50" step="0.1" className="visual-range-slider" value={componentValue} onChange={e => setComponentValue(parseFloat(e.target.value))} />
              <input type="number" step="0.1" value={componentValue} style={{ marginTop: '0.5rem', textAlign: 'center' }} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setComponentValue(v); }} />
            </div>

            <div className="divider"></div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Select a component, set its value, then <strong>drag on the canvas</strong> to place it. Drag between existing nodes to connect them.
            </p>
          </div>

          {/* CENTER COLUMN — Canvas */}
          <div className="editor-middle">
            <div className="canvas-container-box">
              <div className="canvas-header-light">
                <span className="canvas-title-light">
                  {tool === 'wire' ? '✏️ Draw Mode — Drag to place component' : '🖐️ Select Mode — Drag to move nodes'}
                </span>
                <div className="canvas-toolbar">
                  <button className={`canvas-tool-btn-light ${tool === 'wire' ? 'active' : ''}`} onClick={() => setTool('wire')}>✏️ Draw</button>
                  <button className={`canvas-tool-btn-light ${tool === 'select' ? 'active' : ''}`} onClick={() => { setTool('select'); setIsDraggingWire(false); }}>🖐️ Move</button>
                </div>
              </div>

              <svg
                ref={svgRef}
                viewBox="0 0 700 460"
                className="schematic-svg-light"
                style={{ cursor: tool === 'wire' ? 'crosshair' : 'grab' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onClick={() => { if (!isDraggingWire) setSelectedBranchIndex(null); }}
              >
                {/* Ground symbol at node 0 */}
                {nodePositions['0'] && <GroundSymbol x={nodePositions['0'].x} y={nodePositions['0'].y} />}

                {/* Branches */}
                {branches.map((b, i) => {
                  const p1 = ensureNodePosition(b.from);
                  const p2 = ensureNodePosition(b.to);
                  return (
                    <ComponentSymbol key={b.id} id={b.id} type={b.type} value={b.value}
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      isSelected={selectedBranchIndex === i}
                      onSelect={(e) => { e.stopPropagation(); setSelectedBranchIndex(i); }}
                    />
                  );
                })}

                {/* Live drag preview */}
                {isDraggingWire && (
                  <g opacity="0.7">
                    <ComponentSymbol id="" type={selectedType} value={componentValue}
                      x1={getPreviewStart().x} y1={getPreviewStart().y}
                      x2={mousePos.x} y2={mousePos.y}
                      isSelected={true}
                    />
                    <line x1={getPreviewStart().x} y1={getPreviewStart().y}
                      x2={mousePos.x} y2={mousePos.y}
                      className="active-wire-line-light" />
                  </g>
                )}

                {/* Nodes */}
                {nodes.map(label => {
                  const pos = ensureNodePosition(label);
                  const isHover = isDraggingWire && Math.sqrt((pos.x - mousePos.x)**2 + (pos.y - mousePos.y)**2) < 18;
                  return (
                    <g key={label} transform={`translate(${pos.x}, ${pos.y})`}
                      className={`schematic-node-light ${label === '0' ? 'ground' : ''}`}
                      style={{ pointerEvents: isDraggingWire ? 'none' : 'auto' }}
                    >
                      <circle cx="0" cy="0" r="14"
                        fill={isHover ? '#eff6ff' : '#ffffff'}
                        stroke={isHover ? '#2563eb' : (label === '0' ? '#059669' : '#0f172a')}
                        strokeWidth={isHover ? 3 : 2.2}
                      />
                      <text>{label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Inline editor */}
            {selectedBranchIndex !== null && branches[selectedBranchIndex] && (
              <div className="inline-editor-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.65rem' }}>
                  <strong style={{ color: COMPONENT_TYPES.find(c => c.type === branches[selectedBranchIndex].type)?.color }}>
                    Edit: {branches[selectedBranchIndex].id}
                  </strong>
                  <button onClick={() => deleteBranch(selectedBranchIndex)} className="clear-btn-light" style={{ padding:'0.35rem 0.75rem', fontSize:'0.8rem' }}>Delete</button>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                  <input type="number" step="0.1" value={branches[selectedBranchIndex].value}
                    style={{ flex: 1 }}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) { const u = [...branches]; u[selectedBranchIndex].value = v; setBranches(u); }}}
                  />
                  <button onClick={() => setSelectedBranchIndex(null)} className="add-btn-light" style={{ padding:'0.5rem 1rem', width:'auto' }}>Done</button>
                </div>
              </div>
            )}

            {/* Solve Bar */}
            <div className="solve-bar">
              <button onClick={clearCircuit} className="clear-btn-light">🗑️ Clear</button>
              <button onClick={analyzeCircuit} disabled={branches.length === 0 || loading} className="analyze-btn-light">
                {loading ? '⏳ Solving...' : '⚡ Analyze Circuit'}
              </button>
            </div>

            {error && <div style={{ marginTop:'0.75rem', padding:'0.75rem 1rem', background:'#fff1f2', border:'1px solid #fda4af', borderRadius:'10px', color:'#be123c', fontSize:'0.9rem' }}>❌ {error}</div>}
          </div>

          {/* RIGHT COLUMN — Form Builder */}
          <div className="editor-right">
            <h2>Add Manually</h2>

            <div className="input-grid-vertical">
              <div className="input-group-light">
                <label>Component</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  {COMPONENT_TYPES.map(c => <option key={c.type} value={c.type}>{c.name} ({c.unit})</option>)}
                </select>
              </div>
              <div className="input-group-light">
                <label>Value</label>
                <input type="number" step="0.1" value={componentValue} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setComponentValue(v); }} />
              </div>
              <div className="input-group-light">
                <label>From Node</label>
                <input type="text" value={formFrom} onChange={e => setFormFrom(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div className="input-group-light">
                <label>To Node</label>
                <input type="text" value={formTo} onChange={e => setFormTo(e.target.value)} placeholder="e.g. 0" />
              </div>
            </div>

            {validationError && <p style={{ color:'#be123c', fontSize:'0.8rem', marginBottom:'0.75rem' }}>{validationError}</p>}

            <button onClick={addBranchFromForm} className="add-btn-light">+ Add Branch</button>

            <div className="divider"></div>

            <h3 style={{ fontSize:'1rem', marginTop: '0.5rem' }}>Elements ({branches.length})</h3>
            <div className="branch-list-light">
              {branches.length === 0 && <p style={{ textAlign:'center', color:'var(--text-muted)', padding:'1rem', fontSize:'0.85rem' }}>No elements yet.</p>}
              {branches.map((b, i) => (
                <div key={i} className="branch-item-light"
                  style={selectedBranchIndex === i ? { borderColor:'var(--primary)', background:'var(--primary-light)' } : {}}
                >
                  <span className="branch-info-light" onClick={() => setSelectedBranchIndex(i)} style={{ cursor:'pointer', flex:1 }}>
                    {b.id}: {b.from}→{b.to} ({b.value}{COMPONENT_TYPES.find(c=>c.type===b.type)?.unit})
                  </span>
                  <button onClick={() => deleteBranch(i)} className="delete-btn-light">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS FULL-WIDTH BOTTOM SLATE */}
        {(results || loading) && (
          <div className="results-bottom-slate">
            {results && (
              <div className="results-header-light">
                <h2>📊 Analysis Results</h2>
                <button onClick={exportResults} className="export-btn-light">💾 Export JSON</button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign:'center', padding:'3rem' }}>
                <div style={{ width:'40px', height:'40px', border:'3px solid var(--border-color)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }}></div>
                <p style={{ fontWeight:700, fontSize:'1.1rem' }}>Solving circuit matrices...</p>
                <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Computing Cut Set & Tie Set equations</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
              </div>
            )}

            {results && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
                <div>
                  <h3>⚙️ s-Domain Equations</h3>
                  <div className="equations-light">
                    {Object.entries(results.equations).map(([k, v]) => (
                      <div key={k} className="equation-item-light"><Latex math={`${k} = ${v}`} /></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>📈 Time Domain</h3>
                  <div className="equations-light">
                    {Object.entries(results.time_domain).map(([k, v]) => (
                      <div key={k} className="equation-item-light"><Latex math={`${k}(t) = ${v}`} /></div>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <h3>📊 Transient Plots</h3>
                  <div className="plots-grid-light">
                    {results.plots.map((plot, i) => (
                      <div key={i} className="plot-card-light">
                        <img src={`data:image/png;base64,${plot.image}`} alt={plot.name} className="plot-img-light" />
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontFamily:"'Fira Code', monospace", fontSize:'0.8rem', color:'var(--text-muted)' }}>{plot.name}</span>
                          <button onClick={() => downloadPlot(plot)} className="clear-btn-light" style={{ padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}>⬇ Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  // Switch display views
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return renderLandingPage();
      case 'auth':
        return renderAuthPage();
      case 'profile':
        return renderProfilePage();
      case 'workspace':
      default:
        return renderWorkspacePage();
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      {renderPage()}
    </div>
  );
}

export default App;
