import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, X, Search, ChevronRight, Check, RefreshCw, Upload, FileSpreadsheet, AlertTriangle, FileDown, ScanBarcode } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { inventoryApi } from '@/api/inventory.api';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAuditModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [warehouseId, setWarehouseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setWarehouseId('');
    setFile(null);
    setParsedRows([]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = "sku,countedQuantity\nABC-123,15\nXYZ-999,0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_auditoria_stock.csv';
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const parseFile = () => {
    if (!file) return;
    if (!warehouseId) {
      setError('Por favor, selecciona o ingresa el ID del depósito donde se realiza el recuento.');
      return;
    }
    
    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        const rows = results.data as any[];
        
        // Basic validation
        if (rows.length === 0) {
          setError('El archivo está vacío.');
          return;
        }

        if (!('sku' in rows[0] || 'variantId' in rows[0]) || !('countedQuantity' in rows[0])) {
          setError('El formato del CSV es incorrecto. Debe incluir las columnas "sku" y "countedQuantity".');
          return;
        }

        const validRows = rows.filter(r => (r.sku || r.variantId) && !isNaN(parseInt(r.countedQuantity, 10)));
        setParsedRows(validRows.map(r => ({
          sku: r.sku,
          variantId: r.variantId,
          countedQuantity: parseInt(r.countedQuantity, 10)
        })));
        setStep(2);
      },
      error: (err) => {
        setIsProcessing(false);
        setError(`Error al leer el archivo: ${err.message}`);
      }
    });
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const response = await inventoryApi.submitStockAudit({
        warehouseId,
        items: parsedRows
      });
      toast.success(`Auditoría procesada. ${response.adjustmentsMade} ajustes realizados.`);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar la auditoría.');
      setError(err.response?.data?.message || 'Error desconocido del servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Auditoría de Stock (Masivo)">
      <div style={{ padding: '24px' }}>
        {/* PROGRESS TABS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? 'var(--accent)' : 'var(--text-muted)' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '12px', background: step >= 1 ? 'var(--accent)' : 'var(--bg-surface)', color: step >= 1 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Cargar Archivo</span>
          </div>
          <ChevronRight size={20} color="var(--border)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? 'var(--accent)' : 'var(--text-muted)' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '12px', background: step >= 2 ? 'var(--accent)' : 'var(--bg-surface)', color: step >= 2 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Validación</span>
          </div>
          <ChevronRight size={20} color="var(--border)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '12px', background: step >= 3 ? 'var(--accent)' : 'var(--bg-surface)', color: step >= 3 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Resultado</span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.4 }}>{error}</p>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>ID del Depósito (Warehouse ID)</label>
              <input 
                type="text" 
                value={warehouseId} 
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="Ej. d0b9b3e1-..." 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>En el futuro habrá un selector de depósitos visual.</p>
            </div>

            <div 
              style={{
                border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                background: file ? 'var(--bg-surface)' : 'transparent', transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
              
              {file ? (
                <>
                  <FileText size={48} color="var(--accent)" />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{file.name}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} style={{ position: 'relative', zIndex: 10 }}>
                    Cambiar archivo
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={32} color="var(--text-secondary)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '16px' }}>Hacé clic o arrastrá un archivo CSV</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Solo archivos .csv separados por coma</p>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <Button variant="ghost" icon={<Download size={16} />} onClick={downloadTemplate}>
                Descargar Plantilla CSV
              </Button>
              <Button variant="primary" onClick={parseFile} disabled={!file || isProcessing || !warehouseId} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <ChevronRight size={16} />}>
                Analizar Datos
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanBarcode size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '16px' }}>Listos para importar</p>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Se encontraron <strong>{parsedRows.length}</strong> SKUs válidos.
                </p>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>SKU</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Cantidad Contada</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}>{row.sku || row.variantId}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{row.countedQuantity}</td>
                    </tr>
                  ))}
                  {parsedRows.length > 50 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        y {parsedRows.length - 50} filas más...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>Confirmación de Ajuste</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                El sistema comparará las cantidades contadas contra el stock actual de cada variante en el depósito seleccionado y registrará los movimientos de "Sobrante" o "Faltante" automáticamente.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isProcessing}>Atrás</Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isProcessing} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}>
                {isProcessing ? 'Procesando...' : 'Confirmar Auditoría'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={40} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>Auditoría Completada</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Los ajustes de inventario se han registrado correctamente en el sistema. Podrás ver los movimientos en la pestaña del historial.
              </p>
            </div>

            <Button variant="primary" onClick={() => onSuccess()} style={{ minWidth: '200px' }}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
