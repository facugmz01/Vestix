import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PauseCircle, Maximize, Calculator, LogOut } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import styles from '../../pages/pos/POSPage.module.css';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time.toLocaleTimeString()}</span>;
}

export function POSHeader() {
  const navigate = useNavigate();
  const setShiftModalOpen = usePosStore(s => s.setShiftModalOpen);
  const setSuspendModalOpen = usePosStore(s => s.setSuspendModalOpen);
  const suspendedSales = usePosStore(s => s.suspendedSales);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.navLogo}>
        <span>Vestix</span> POS
      </div>
      <div className={styles.navIcons}>
        <div className={styles.iconBtn}><Clock size={16} /> <LiveClock /></div>
        <button className={styles.iconBtn} onClick={() => setSuspendModalOpen(true)} title="Ventas Suspendidas">
          <PauseCircle size={18} /> 
          {suspendedSales.length > 0 && <span style={{ background: 'var(--yellow)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{suspendedSales.length}</span>}
        </button>
        <button className={styles.iconBtn} onClick={toggleFullScreen} title="Pantalla Completa"><Maximize size={18} /></button>
        <button className={styles.iconBtn} onClick={() => window.open('/calculator', '_blank', 'width=300,height=400')} title="Calculadora"><Calculator size={18} /></button>
        <button className={styles.iconBtn} onClick={() => setShiftModalOpen(true)} style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.4)' }} title="Cerrar Caja">
          <LogOut size={16} /> Cerrar Caja
        </button>
        <button className={styles.iconBtn} onClick={() => navigate('/')} title="Volver al Dashboard"><LogOut size={18} /> Volver</button>
      </div>
    </div>
  );
}
