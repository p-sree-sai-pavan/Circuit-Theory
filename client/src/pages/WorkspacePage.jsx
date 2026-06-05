import { useRef, useEffect } from 'react';
import { 
  COMPONENT_TYPES, 
  GroundSymbol, 
  ComponentSymbol, 
  MiniSymbol 
} from '../components/Symbols';
import ResultsSlate from '../components/ResultsSlate';

export const WorkspacePage = ({
  user,
  nodes,
  setNodes,
  branches,
  setBranches,
  selectedType,
  setSelectedType,
  componentValue,
  setComponentValue,
  formFrom,
  setFormFrom,
  formTo,
  setFormTo,
  nodePositions,
  setNodePositions,
  draggedNode,
  setDraggedNode,
  tool,
  setTool,
  isDraggingWire,
  setIsDraggingWire,
  drawingWireFrom,
  setDrawingWireFrom,
  drawStartCoords,
  setDrawStartCoords,
  mousePos,
  setMousePos,
  selectedBranchIndex,
  setSelectedBranchIndex,
  results,
  setResults,
  loading,
  setLoading,
  error,
  setError,
  validationError,
  setValidationError,
  showSaveDialog,
  setShowSaveDialog,
  saveCircuitName,
  setSaveCircuitName,
  savingCircuit,
  isFirebaseConfigured,
  setCurrentPage,
  handleLogout,
  handleSaveCircuit,
  loadExample,
  clearCircuit,
  analyzeCircuit,
  exportResults,
  downloadPlot,
  addBranchFromForm,
  deleteBranch,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  ensureNodePosition,
  getPreviewStart,
  EXAMPLES
}) => {
  const svgRef = useRef(null);

  // Sync reference for local coordinate calculation
  const setSvgRef = (node) => {
    svgRef.current = node;
  };

  const getMouseCoordsLocal = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 700;
    const y = ((e.clientY - rect.top) / rect.height) * 460;
    return { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 };
  };

  const onMouseDown = (e) => {
    const coords = getMouseCoordsLocal(e);
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
  };

  const onMouseMove = (e) => {
    const coords = getMouseCoordsLocal(e);
    if (draggedNode !== null) {
      setNodePositions(prev => ({ ...prev, [draggedNode]: coords }));
    } else if (isDraggingWire) {
      setMousePos(coords);
    }
  };

  const onMouseUp = (e) => {
    if (draggedNode !== null) { setDraggedNode(null); return; }
    if (!isDraggingWire) return;
    const coords = getMouseCoordsLocal(e);
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
      // Inline create branch helper trigger
      const val = parseFloat(componentValue);
      if (isNaN(val) || val <= 0) { setValidationError('Value must be positive'); setDrawingWireFrom(null); return; }
      setValidationError('');
      const count = branches.filter(b => b.type === selectedType).length + 1;
      const id = `${selectedType}${count}`;
      setBranches(prev => [...prev, { id, from: startLabel, to: endLabel, type: selectedType, value: val }]);
      ensureNodePosition(startLabel); ensureNodePosition(endLabel);
    }
    setDrawingWireFrom(null); setDrawStartCoords(null);
  };

  return (
    <>
      {/* HEADER NAVBAR */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setCurrentPage('landing')}>
          <h1>⚡ Circuit Solver</h1>
          <span className="subtitle">Graph Theory & Laplace Engine</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
              ref={setSvgRef}
              viewBox="0 0 700 460"
              className="schematic-svg-light"
              style={{ cursor: tool === 'wire' ? 'crosshair' : 'grab' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
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
      <ResultsSlate 
        results={results}
        loading={loading}
        exportResults={exportResults}
        downloadPlot={downloadPlot}
      />
    </>
  );
};

export default WorkspacePage;
