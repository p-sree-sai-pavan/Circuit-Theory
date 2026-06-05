export const COMPONENT_TYPES = [
  { type: 'R', name: 'Resistor', unit: 'Ω', color: '#7c3aed' },
  { type: 'L', name: 'Inductor', unit: 'H', color: '#d97706' },
  { type: 'C', name: 'Capacitor', unit: 'F', color: '#0891b2' },
  { type: 'V', name: 'Voltage Src', unit: 'V', color: '#dc2626' },
  { type: 'I', name: 'Current Src', unit: 'A', color: '#2563eb' },
];

export const GroundSymbol = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <line x1="0" y1="0" x2="0" y2="16" stroke="#059669" strokeWidth="2.5" />
    <line x1="-12" y1="16" x2="12" y2="16" stroke="#059669" strokeWidth="2.5" />
    <line x1="-7" y1="21" x2="7" y2="21" stroke="#059669" strokeWidth="2" />
    <line x1="-3" y1="26" x2="3" y2="26" stroke="#059669" strokeWidth="1.5" />
  </g>
);

export const MiniSymbol = ({ type, color }) => {
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

export const ComponentSymbol = ({ type, x1, y1, x2, y2, value, id, onSelect, isSelected }) => {
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
