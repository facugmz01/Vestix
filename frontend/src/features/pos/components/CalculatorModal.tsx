import { useState } from 'react';
import { Modal } from '@/components/ui';

export function CalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const input = (val: string) => {
    setDisplay(d => (d === '0' && val !== '.' ? val : d + val));
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
  };

  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op) {
      const result = compute(prev, current, op);
      setDisplay(String(Number(result.toFixed(2))));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const result = compute(prev, parseFloat(display), op);
    setDisplay(String(Number(result.toFixed(2))));
    setPrev(null);
    setOp(null);
  };

  const btnStyle: React.CSSProperties = {
    padding: '14px',
    fontSize: '18px',
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
  };

  const opStyle: React.CSSProperties = { ...btnStyle, background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' };

  return (
    <Modal open={open} onClose={onClose} title="Calculadora">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          padding: '16px',
          fontSize: '28px',
          fontWeight: 700,
          textAlign: 'right',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          fontFamily: 'monospace',
          overflow: 'hidden',
        }}>
          {display}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <button style={btnStyle} onClick={clear}>C</button>
          <button style={opStyle} onClick={() => handleOp('/')}>/</button>
          <button style={opStyle} onClick={() => handleOp('*')}>×</button>
          <button style={opStyle} onClick={() => handleOp('-')}>−</button>
          {['7','8','9','+','4','5','6','=','1','2','3','0','.'].map((key, i) => (
            <button
              key={i}
              style={key === '=' ? { ...opStyle, gridRow: 'span 2' } : btnStyle}
              onClick={() => key === '=' ? handleEquals() : key === '+' ? handleOp('+') : input(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
