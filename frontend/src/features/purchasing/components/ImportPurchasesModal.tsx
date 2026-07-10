import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, X, Search, ChevronRight, Check, RefreshCw, Upload, FileDown, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from '@/components/ui/ImportBalancesModal.module.css'; // Reuse CSS
import { warehousesApi } from '@/api/warehouses.api';
import { purchasesApi } from '@/api/purchases.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportPurchasesModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  
  const [updateStock, setUpdateStock] = useState(false);
  const [paymentResolution, setPaymentResolution] = useState<'FROM_CSV' | 'PAID_CASH' | 'CURRENT_ACCOUNT'>('FROM_CSV');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ createdCount: number; errorCount: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      warehousesApi.getWarehouses().then(res => {
        setWarehouses(res.data);
        if (res.data.length > 0) setWarehouseId(res.data[0].id);
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
    const csvContent = `ID_Compra,Fecha,Proveedor,SKU,Cantidad,Precio_Costo,Estado_Pago\n"OC-0001",2024-01-15,"proveedor@mail.com","PROD-1",20,1000.50,"Efectivo"\n"OC-0001",2024-01-15,"proveedor@mail.com","PROD-2",10,400.00,"Efectivo"\n"OC-0002",2024-01-16,"otro@mail.com","PROD-1",15,1000.50,"Cuenta Corriente"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_compras.csv`;
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
          const hasOrderId = keys.some(k => ['id_compra', 'nro_comprobante', 'compra', 'orden'].includes(k));
          const hasSku = keys.some(k => ['sku', 'codigo'].includes(k));
          
          if (!hasOrderId || !hasSku) {
            setError(`El archivo debe tener al menos ID_Compra y SKU.`);
            return;
          }
        }

        const formattedRows = rows.map(r => {
          const rawKeys = Object.keys(r);
          const findKey = (matches: string[]) => rawKeys.find(k => matches.includes(k.trim().toLowerCase()));

          return {
            orderId: String(r[findKey(['id_compra', 'nro_comprobante', 'compra', 'orden']) || '']),
            date: r[findKey(['fecha', 'date']) || ''] || undefined,
            supplierIdentifier: r[findKey(['proveedor', 'cuit', 'email']) || ''] || undefined,
            sku: String(r[findKey(['sku', 'codigo']) || '']),
            quantity: parseFloat(String(r[findKey(['cantidad', 'qty']) || '1']).replace(',', '.')),
            unitCost: parseFloat(String(r[findKey(['precio_costo', 'costo', 'monto']) || '0']).replace(',', '.')),
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
      
      const res = await purchasesApi.bulkImportPurchases(parsedRows, updateStock, paymentResolution, warehouseId);
      setResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error importando compras');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importador Histórico de Compras" size="lg">
      <div className={styles.container}>
        
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.uploadArea}>
              <UploadCloud size={48} color="var(--text-muted)" />
              <h3>Subir archivo de Compras</h3>
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
              <p>Descargá la plantilla para ver cómo agrupar ítems por ID de Compra.</p>
              <button className={styles.linkBtn} onClick={handleDownloadTemplate}>
                <FileDown size={16} /> Descargar Plantilla
              </button>
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!file || parsedRows.length === 0 || !!error}
                icon={<ChevronRight size={16} />}
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
                <p>Las filas con el mismo ID de Compra se agruparán en una sola orden.</p>
              </div>
            </div>

            <div className={styles.optionsSection}>
              <h4>Depósito de Destino</h4>
              <p className={styles.optionDesc}>¿A qué depósito ingresarían (o ingresaron) estos productos?</p>
              <select 
                value={warehouseId} 
                onChange={e => setWarehouseId(e.target.value)}
                className={styles.optionsSelect}
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
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
                  <strong>Sumar stock físico (Recepción de Mercadería)</strong>
                  <p>Si se activa, estas compras sumarán unidades al inventario actual del depósito. Mantenelo apagado si solo estás importando historial viejo.</p>
                </div>
              </label>
            </div>

            <div className={styles.optionsSection}>
              <h4>Estado de Pago / Cuentas Corrientes</h4>
              <p className={styles.optionDesc}>¿Cómo procesamos el pago a proveedores?</p>
              
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
                  <p>Decide por cada compra basándose en el archivo CSV.</p>
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
                  <p>No generan deuda con el proveedor.</p>
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
                  <p>Incrementa el saldo adeudado al proveedor.</p>
                </div>
              </label>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isImporting}>Atrás</Button>
              <Button onClick={handleImport} disabled={!parsedRows.length || isImporting} icon={<Upload size={16} />}>
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
                  <span>Órdenes Creadas</span>
                  <strong>{result.createdCount}</strong>
                </div>
                <div className={styles.statBox}>
                  <span>Errores</span>
                  <strong className={result.errorCount > 0 ? styles.statValueDanger : undefined}>{result.errorCount}</strong>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className={styles.notFoundBox}>
                  <strong>No se pudieron procesar algunas compras:</strong>
                  <div className={styles.notFoundList}>
                    {result.errors.map((err, i) => <span key={i} className={styles.errorLine}>{err}</span>)}
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
