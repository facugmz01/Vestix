import { useState } from 'react';
import { Modal } from '@/components/ui';
import styles from '@/pages/pos/POSPage.module.css';

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

  return (
    <Modal open={open} onClose={onClose} title="Calculadora">
      <div className={styles.calcStack}>
        <div className={styles.calcDisplay}>
          {display}
        </div>
        <div className={styles.calcGrid}>
          <button type="button" className={styles.calcBtn} onClick={clear}>C</button>
          <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleOp('/')}>/</button>
          <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleOp('*')}>×</button>
          <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleOp('-')}>−</button>
          {['7','8','9','+','4','5','6','=','1','2','3','0','.'].map((key, i) => (
            <button
              key={i}
              type="button"
              className={key === '=' ? `${styles.calcBtn} ${styles.calcBtnOp} ${styles.calcBtnEquals}` : key === '+' ? `${styles.calcBtn} ${styles.calcBtnOp}` : styles.calcBtn}
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
