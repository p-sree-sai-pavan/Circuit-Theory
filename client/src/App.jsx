import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import './App.css'

const Latex = ({ math }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, {
        throwOnError: false
      });
    }
  }, [math]);

  return <span ref={containerRef} />;
};

// Example circuits
const EXAMPLES = {
  'series-rc': {
    name: 'Series RC Circuit',
    nodes: ['0', '1', '2'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 5 },
      { id: 'C1', from: '2', to: '0', type: 'C', value: 0.1 }
    ]
  },
  'series-rlc': {
    name: 'Series RLC Circuit',
    nodes: ['0', '1', '2', '3'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 2 },
      { id: 'L1', from: '2', to: '3', type: 'L', value: 0.5 },
      { id: 'C1', from: '3', to: '0', type: 'C', value: 0.2 }
    ]
  },
  'complex': {
    name: 'Complex Multi-Loop',
    nodes: ['0', '1', '2', '3'],
    branches: [
      { id: 'V1', from: '1', to: '0', type: 'V', value: 10 },
      { id: 'R1', from: '1', to: '2', type: 'R', value: 2 },
      { id: 'L1', from: '2', to: '3', type: 'L', value: 1 },
      { id: 'C1', from: '2', to: '0', type: 'C', value: 0.5 },
      { id: 'R2', from: '3', to: '0', type: 'R', value: 4 },
      { id: 'I1', from: '0', to: '3', type: 'I', value: 2 }
    ]
  }
};

function App() {
  const [nodes, setNodes] = useState(['0'])
  const [branches, setBranches] = useState([])
  const [newBranch, setNewBranch] = useState({
    from: '1', to: '0', type: 'R', value: 10
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const addBranch = () => {
    // Validation
    if (!newBranch.from || !newBranch.to) {
      setValidationError('From and To nodes are required');
      return;
    }
    if (newBranch.from === newBranch.to) {
      setValidationError('From and To nodes must be different');
      return;
    }
    if (!newBranch.value || newBranch.value <= 0) {
      setValidationError('Value must be positive');
      return;
    }

    setValidationError('');
    const id = `${newBranch.type}${branches.length + 1}`
    const branch = { ...newBranch, id, value: parseFloat(newBranch.value) }
    setBranches([...branches, branch])

    // Update nodes list
    const newNodes = new Set(nodes)
    newNodes.add(branch.from)
    newNodes.add(branch.to)
    setNodes(Array.from(newNodes).sort())
  }

  const deleteBranch = (index) => {
    const newBranches = branches.filter((_, i) => i !== index);
    setBranches(newBranches);
  }

  const loadExample = (exampleKey) => {
    const example = EXAMPLES[exampleKey];
    setNodes(example.nodes);
    setBranches(example.branches);
    setResults(null);
    setError(null);
    setValidationError('');
  }

  const analyzeCircuit = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const payload = {
        nodes: nodes,
        branches: branches
      }
      const response = await axios.post('http://localhost:3000/analyze', payload)

      if (response.data.status === 'success') {
        setResults(response.data)
      } else {
        setError(response.data.message || 'Analysis failed')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Connection failed. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const clearCircuit = () => {
    if (branches.length > 0 && !window.confirm('Clear all branches? This cannot be undone.')) {
      return;
    }
    setBranches([])
    setNodes(['0'])
    setResults(null)
    setError(null)
    setValidationError('')
  }

  const exportResults = () => {
    if (!results) return;

    const exportData = {
      circuit: { nodes, branches },
      equations: results.equations,
      timeDomain: results.time_domain,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const downloadPlot = (plot) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${plot.image}`;
    a.download = `${plot.name}-plot.png`;
    a.click();
  }

  return (
    <>
      <div className="header">
        <h1>🔌 Circuit Solver</h1>
        <p className="subtitle">Graph Theory & Laplace Transform Analysis</p>
        <button onClick={() => setShowHelp(!showHelp)} className="help-btn">
          {showHelp ? '✕ Close Help' : '❓ Help'}
        </button>
      </div>

      {showHelp && (
        <div className="help-panel">
          <h3>📖 Quick Start Guide</h3>
          <div className="help-content">
            <div className="help-section">
              <h4>🚀 Getting Started</h4>
              <p>The easiest way is to click a <strong>Quick Example</strong> button, then click <strong>Analyze</strong>.</p>
            </div>
            <div className="help-section">
              <h4>🔧 Building Circuits</h4>
              <ul>
                <li><strong>Node 0</strong> is always the reference (ground)</li>
                <li>Use nodes <strong>1, 2, 3...</strong> for other points</li>
                <li>All branches must connect to form a complete circuit</li>
                <li>Values must be positive numbers</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>⚙️ Component Types</h4>
              <ul>
                <li><strong>R (Resistor)</strong>: Resistance in Ohms (Ω)</li>
                <li><strong>L (Inductor)</strong>: Inductance in Henrys (H)</li>
                <li><strong>C (Capacitor)</strong>: Capacitance in Farads (F)</li>
                <li><strong>V (Voltage Source)</strong>: Voltage in Volts (V)</li>
                <li><strong>I (Current Source)</strong>: Current in Amperes (A)</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>📊 Understanding Results</h4>
              <ul>
                <li><strong>s-domain Equations</strong>: Laplace transform expressions</li>
                <li><strong>Time Domain</strong>: How values change over time</li>
                <li><strong>Plots</strong>: Visual graphs from t=0 to t=10 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="editor">
          <h2>Circuit Editor</h2>

          <div className="examples-section">
            <label>Quick Examples:</label>
            <div className="examples-buttons">
              <button onClick={() => loadExample('series-rc')} className="example-btn">RC Circuit</button>
              <button onClick={() => loadExample('series-rlc')} className="example-btn">RLC Circuit</button>
              <button onClick={() => loadExample('complex')} className="example-btn">Complex</button>
            </div>
          </div>

          <div className="divider"></div>

          <div className="input-group">
            <label>Type:</label>
            <select value={newBranch.type} onChange={e => setNewBranch({ ...newBranch, type: e.target.value })}>
              <option value="R">Resistor (Ω)</option>
              <option value="L">Inductor (H)</option>
              <option value="C">Capacitor (F)</option>
              <option value="V">Voltage Source (V)</option>
              <option value="I">Current Source (A)</option>
            </select>
          </div>

          <div className="input-group">
            <label>From Node:</label>
            <input type="text" value={newBranch.from} onChange={e => setNewBranch({ ...newBranch, from: e.target.value })} placeholder="e.g., 1" />
          </div>

          <div className="input-group">
            <label>To Node:</label>
            <input type="text" value={newBranch.to} onChange={e => setNewBranch({ ...newBranch, to: e.target.value })} placeholder="e.g., 0 (ref)" />
          </div>

          <div className="input-group">
            <label>Value:</label>
            <input type="number" step="0.1" value={newBranch.value} onChange={e => setNewBranch({ ...newBranch, value: e.target.value })} placeholder="e.g., 10" />
          </div>

          {validationError && <div className="validation-error">{validationError}</div>}

          <div className="button-row">
            <button onClick={addBranch} className="add-btn">➕ Add Branch</button>
            <button onClick={clearCircuit} className="clear-btn">🗑️ Clear All</button>
          </div>

          <div className="branch-list">
            <h3>Branches ({branches.length})</h3>
            {branches.length === 0 && <p className="empty-msg">No branches yet. Add one above or load an example.</p>}
            {branches.map((b, i) => (
              <div key={i} className="branch-item">
                <span className="branch-info">{b.id}: {b.from} &rarr; {b.to} ({b.value})</span>
                <button onClick={() => deleteBranch(i)} className="delete-btn">✕</button>
              </div>
            ))}
          </div>

          <button
            onClick={analyzeCircuit}
            disabled={branches.length === 0 || loading}
            className="analyze-btn"
          >
            {loading ? '⏳ Analyzing...' : '⚡ Analyze Circuit'}
          </button>

          {error && <div className="error-msg">❌ {error}</div>}
        </div>

        <div className="results">
          <div className="results-header">
            <h2>Analysis Results</h2>
            {results && (
              <button onClick={exportResults} className="export-btn">
                💾 Export JSON
              </button>
            )}
          </div>

          {!results && !loading && (
            <div className="placeholder">
              <p>👈 Add circuit components and click <strong>Analyze</strong> to see:</p>
              <ul>
                <li>✓ Laplace domain equations</li>
                <li>✓ Time domain solutions</li>
                <li>✓ Transient response plots</li>
              </ul>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing circuit...</p>
              <p className="loading-detail">Computing Cut Set & Tie Set matrices</p>
            </div>
          )}

          {results && (
            <div className="results-content">
              <div className="section">
                <h3>⚙️ Equations (s-domain)</h3>
                <div className="equations">
                  {Object.entries(results.equations).map(([k, v]) => (
                    <div key={k} className="equation-item">
                      <Latex math={`${k} = ${v}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>📈 Time Domain Expressions</h3>
                <div className="equations">
                  {Object.entries(results.time_domain).map(([k, v]) => (
                    <div key={k} className="equation-item">
                      <Latex math={`${k}(t) = ${v}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>📊 Transient Response Plots</h3>
                <div className="plots-grid">
                  {results.plots.map((plot, i) => (
                    <div key={i} className="plot-card">
                      <img src={`data:image/png;base64,${plot.image}`} alt={plot.name} className="plot-img" />
                      <div className="plot-footer">
                        <p className="plot-label">{plot.name}</p>
                        <button onClick={() => downloadPlot(plot)} className="download-plot-btn">
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
