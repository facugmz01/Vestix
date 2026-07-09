import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, ChevronRight, Check, RefreshCw, ScanBarcode } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { inventoryApi } from '@/api/inventory.api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import styles from './InventoryModals.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { num: 1, label: 'Cargar Archivo' },
  { num: 2, label: 'Validación' },
  { num: 3, label: 'Resultado' },
] as const;

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
      <div className={styles.modalBody}>
        <div className={styles.stepper}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              {i > 0 && <ChevronRight size={20} className={styles.stepChevron} aria-hidden="true" />}
              <div className={clsx(styles.stepItem, step >= s.num && styles.stepItemActive)}>
                <span className={clsx(styles.stepBadge, step >= s.num && styles.stepBadgeActive)}>{s.num}</span>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={20} aria-hidden="true" />
            <p className={styles.errorBannerText}>{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className={styles.modalStack}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ID del Depósito (Warehouse ID)</label>
              <input
                type="text"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="Ej. d0b9b3e1-..."
                className={styles.fieldInput}
              />
              <p className={styles.fieldHint}>En el futuro habrá un selector de depósitos visual.</p>
            </div>

            <div className={clsx(styles.dropZone, file && styles.dropZoneHasFile)}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className={styles.fileInputOverlay}
              />

              {file ? (
                <>
                  <FileText size={48} color="var(--accent)" aria-hidden="true" />
                  <div className={styles.fileMetaCenter}>
                    <p className={styles.fileMetaName}>{file.name}</p>
                    <p className={styles.fileMetaSize}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className={styles.changeFileBtn}>
                    Cambiar archivo
                  </Button>
                </>
              ) : (
                <>
                  <div className={styles.dropZoneIconCircle}>
                    <UploadCloud size={32} aria-hidden="true" />
                  </div>
                  <div className={styles.fileMetaCenter}>
                    <p className={styles.dropZoneTitle}>Hacé clic o arrastrá un archivo CSV</p>
                    <p className={styles.dropZoneSubtitle}>Solo archivos .csv separados por coma</p>
                  </div>
                </>
              )}
            </div>

            <div className={styles.actionsBetween}>
              <Button variant="ghost" icon={<Download size={16} />} onClick={downloadTemplate}>
                Descargar Plantilla CSV
              </Button>
              <Button variant="primary" onClick={parseFile} disabled={!file || isProcessing || !warehouseId} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <ChevronRight size={16} />}>
                Analizar Datos
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.modalStack}>
            <div className={styles.previewSummary}>
              <div className={styles.previewSummaryIcon}>
                <ScanBarcode size={24} aria-hidden="true" />
              </div>
              <div>
                <p className={styles.previewSummaryTitle}>Listos para importar</p>
                <p className={styles.previewSummaryText}>
                  Se encontraron <strong>{parsedRows.length}</strong> SKUs válidos.
                </p>
              </div>
            </div>

            <div className={styles.dataTableWrap}>
              <table className={styles.dataTable}>
                <thead className={styles.dataTableHead}>
                  <tr>
                    <th className={styles.dataTableTh}>SKU</th>
                    <th className={clsx(styles.dataTableTh, styles.dataTableThRight)}>Cantidad Contada</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className={styles.dataTableRow}>
                      <td className={styles.dataTableTd}>{row.sku || row.variantId}</td>
                      <td className={clsx(styles.dataTableTd, styles.dataTableTdRight)}>{row.countedQuantity}</td>
                    </tr>
                  ))}
                  {parsedRows.length > 50 && (
                    <tr>
                      <td colSpan={2} className={styles.dataTableMore}>
                        y {parsedRows.length - 50} filas más...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.confirmCallout}>
              <p className={styles.confirmCalloutTitle}>Confirmación de Ajuste</p>
              <p className={styles.confirmCalloutText}>
                El sistema comparará las cantidades contadas contra el stock actual de cada variante en el depósito seleccionado y registrará los movimientos de "Sobrante" o "Faltante" automáticamente.
              </p>
            </div>

            <div className={styles.actionsEndGap}>
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isProcessing}>Atrás</Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isProcessing} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}>
                {isProcessing ? 'Procesando...' : 'Confirmar Auditoría'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.successCenter}>
            <div className={styles.successIcon}>
              <Check size={40} aria-hidden="true" />
            </div>

            <div className={styles.resultTextCenter}>
              <h3 className={styles.successTitle}>Auditoría Completada</h3>
              <p className={styles.successText}>
                Los ajustes de inventario se han registrado correctamente en el sistema. Podrás ver los movimientos en la pestaña del historial.
              </p>
            </div>

            <Button variant="primary" onClick={() => onSuccess()} className={styles.successBtn}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
