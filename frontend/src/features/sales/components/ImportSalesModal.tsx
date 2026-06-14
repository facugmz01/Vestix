import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileDown, AlertTriangle, CheckCircle, ChevronRight, FileSpreadsheet, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from '@/components/ui/ImportBalancesModal.module.css'; // Reuse CSS
import { branchesApi } from '@/api/branches.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onImport: (rows: any[], updateStock: boolean, paymentResolution: string, branchId: string) => Promise<any>;
}

export function ImportSalesModal({ open, onClose, onSuccess, onImport }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  
  const [updateStock, setUpdateStock] = useState(false);
  const [paymentResolution, setPaymentResolution] = useState<'FROM_CSV' | 'PAID_CASH' | 'CURRENT_ACCOUNT'>('FROM_CSV');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ createdCount: number; errorCount: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      branchesApi.getBranches().then(res => {
        setBranches(res.data);
        if (res.data.length > 0) setBranchId(res.data[0].id);
      }).catch(console.error);
    }
  }, [open]);

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParsedRows([]);
    setResult(null);
    setError(null);
    setUpdateStock(false);
    setPaymentResolution('FROM_CSV');
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csvContent = `ID_Venta,Fecha,Cliente_Email,SKU,Cantidad,Precio_Unitario,Estado_Pago\n"V-0001",2024-01-15,"cliente@mail.com","PROD-1",2,1500.50,"Efectivo"\n"V-0001",2024-01-15,"cliente@mail.com","PROD-2",1,500.00,"Efectivo"\n"V-0002",2024-01-16,"otro@mail.com","PROD-1",1,1500.50,"Cuenta Corriente"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_ventas.csv`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
          const hasOrderId = keys.some(k => ['id_venta', 'nro_comprobante', 'venta'].includes(k));
          const hasSku = keys.some(k => ['sku', 'codigo'].includes(k));
          
          if (!hasOrderId || !hasSku) {
            setError(`El archivo debe tener al menos ID_Venta y SKU.`);
            return;
          }
        }

        const formattedRows = rows.map(r => {
          const rawKeys = Object.keys(r);
          const findKey = (matches: string[]) => rawKeys.find(k => matches.includes(k.trim().toLowerCase()));

          return {
            orderId: String(r[findKey(['id_venta', 'nro_comprobante', 'venta']) || '']),
            date: r[findKey(['fecha', 'date']) || ''] || undefined,
            customerIdentifier: r[findKey(['cliente_email', 'cliente', 'cuit']) || ''] || undefined,
            sku: String(r[findKey(['sku', 'codigo']) || '']),
            quantity: parseFloat(String(r[findKey(['cantidad', 'qty']) || '1']).replace(',', '.')),
            unitPrice: parseFloat(String(r[findKey(['precio_unitario', 'precio', 'monto']) || '0']).replace(',', '.')),
            paymentStatus: r[findKey(['estado_pago', 'pago', 'status']) || ''] || undefined,
          };
        }).filter(r => r.orderId && r.sku);

        setParsedRows(formattedRows);
      },
      error: (err) => {
        setError(`Error leyendo el archivo: ${err.message}`);
      }
    });
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setError(null);
      
      const res = await onImport(parsedRows, updateStock, paymentResolution, branchId);
      setResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error importando ventas');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importador Histórico de Ventas" size="lg">
      <div className={styles.container}>
        
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.uploadArea}>
              <UploadCloud size={48} color="var(--text-muted)" />
              <h3>Subir archivo de Ventas</h3>
              <p>Solo archivos CSV separados por coma</p>
              
              <input 
                type="file" 
                accept=".csv" 
                id="csv-upload" 
                className={styles.fileInput}
                onChange={handleFileChange}
              />
              <label htmlFor="csv-upload" className={styles.uploadBtn}>
                Seleccionar Archivo
              </label>
              
              {file && !error && <div className={styles.fileName}>{file.name} ({parsedRows.length} líneas detectadas)</div>}
              {error && <div className={styles.errorText}><AlertTriangle size={14}/> {error}</div>}
            </div>

            <div className={styles.templateArea}>
              <p>Descargá la plantilla para ver cómo agrupar ítems por ID de Venta.</p>
              <button className={styles.linkBtn} onClick={handleDownloadTemplate}>
                <FileDown size={16} /> Descargar Plantilla
              </button>
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!file || parsedRows.length === 0 || !!error}
                rightIcon={<ChevronRight size={16} />}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.summaryBox}>
              <FileSpreadsheet size={24} color="var(--accent)" />
              <div>
                <h4>Archivo listo: {parsedRows.length} ítems encontrados</h4>
                <p>Las filas con el mismo ID de Venta se agruparán en un solo comprobante.</p>
              </div>
            </div>

            <div className={styles.optionsSection}>
              <h4>Sucursal de Destino</h4>
              <p className={styles.optionDesc}>¿A qué sucursal pertenecen estas ventas?</p>
              <select 
                value={branchId} 
                onChange={e => setBranchId(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.optionsSection}>
              <h4>Impacto en Inventario</h4>
              <label className={styles.radioLabel}>
                <input 
                  type="checkbox" 
                  checked={updateStock}
                  onChange={e => setUpdateStock(e.target.checked)}
                />
                <div>
                  <strong>Descontar stock físico</strong>
                  <p>Si se activa, estas ventas restarán unidades del inventario actual. Mantenelo apagado si solo estás importando historial viejo.</p>
                </div>
              </label>
            </div>

            <div className={styles.optionsSection}>
              <h4>Estado de Cobro / Cuentas Corrientes</h4>
              <p className={styles.optionDesc}>¿Cómo procesamos el pago de estas ventas?</p>
              
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="FROM_CSV" 
                  checked={paymentResolution === 'FROM_CSV'}
                  onChange={() => setPaymentResolution('FROM_CSV')}
                />
                <div>
                  <strong>Leer de la columna "Estado_Pago"</strong>
                  <p>Decide por cada venta basándose en el archivo CSV.</p>
                </div>
              </label>

              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="PAID_CASH" 
                  checked={paymentResolution === 'PAID_CASH'}
                  onChange={() => setPaymentResolution('PAID_CASH')}
                />
                <div>
                  <strong>Marcar todas como Pagadas</strong>
                  <p>No generan deuda, entran como efectivo.</p>
                </div>
              </label>

              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="CURRENT_ACCOUNT" 
                  checked={paymentResolution === 'CURRENT_ACCOUNT'}
                  onChange={() => setPaymentResolution('CURRENT_ACCOUNT')}
                />
                <div>
                  <strong>Mandar todas a Cuenta Corriente (Deuda)</strong>
                  <p>Incrementa el saldo adeudado del cliente.</p>
                </div>
              </label>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isImporting}>Atrás</Button>
              <Button onClick={handleImport} loading={isImporting} disabled={!branchId}>
                Importar Ahora
              </Button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className={styles.step}>
            <div className={styles.successArea}>
              <CheckCircle size={64} color={result.errorCount === 0 ? "var(--success)" : "var(--warning)"} />
              <h3>Importación Finalizada</h3>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span>Ventas Creadas</span>
                  <strong>{result.createdCount}</strong>
                </div>
                <div className={styles.statBox}>
                  <span>Errores</span>
                  <strong style={{ color: result.errorCount > 0 ? 'var(--danger)' : 'inherit'}}>{result.errorCount}</strong>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className={styles.notFoundBox}>
                  <strong>No se pudieron procesar algunas ventas:</strong>
                  <div className={styles.notFoundList}>
                    {result.errors.map((err, i) => <span key={i} style={{display:'block'}}>{err}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <Button onClick={() => { onSuccess(); handleClose(); }}>Terminar y Actualizar</Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
