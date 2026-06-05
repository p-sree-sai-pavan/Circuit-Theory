import Latex from './Latex';

export const ResultsSlate = ({ results, loading, exportResults, downloadPlot }) => {
  if (!results && !loading) return null;

  return (
    <div className="results-bottom-slate">
      {results && (
        <div className="results-header-light">
          <h2>📊 Analysis Results</h2>
          <button onClick={exportResults} className="export-btn-light">💾 Export JSON</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Solving circuit matrices...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Computing Cut Set & Tie Set equations</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}

      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3>⚙️ s-Domain Equations</h3>
            <div className="equations-light">
              {Object.entries(results.equations).map(([k, v]) => (
                <div key={k} className="equation-item-light">
                  <Latex math={`${k} = ${v}`} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>📈 Time Domain</h3>
            <div className="equations-light">
              {Object.entries(results.time_domain).map(([k, v]) => (
                <div key={k} className="equation-item-light">
                  <Latex math={`${k}(t) = ${v}`} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <h3>📊 Transient Plots</h3>
            <div className="plots-grid-light">
              {results.plots.map((plot, i) => (
                <div key={i} className="plot-card-light">
                  <img src={`data:image/png;base64,${plot.image}`} alt={plot.name} className="plot-img-light" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.8rem', color: 'var(--text-muted)' }}>{plot.name}</span>
                    <button onClick={() => downloadPlot(plot)} className="clear-btn-light" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>⬇ Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSlate;
