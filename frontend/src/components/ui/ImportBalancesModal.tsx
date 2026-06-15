import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Download, X, Search, ChevronRight, Check, RefreshCw, Upload, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './ImportBalancesModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  entityName?: string;
  onImport: (rows: any[], resolution: 'overwrite' | 'add') => Promise<any>;
}

export function ImportBalancesModal({ open, onClose, onSuccess, title = 'Importar Saldos', entityName = 'Cliente', onImport }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [resolution, setResolution] = useState<'overwrite' | 'add'>('add');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ updatedCount: number; notFound: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParsedRows([]);
    setResult(null);
    setError(null);
    setResolution('add');
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csvContent = `Identificador,Saldo\n"11111111111",15000.50\n"ejemplo@correo.com",-500.00`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_saldos_${entityName.toLowerCase()}s.csv`;
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
        
        // Find identifier and balance columns (case-insensitive)
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
          const hasId = keys.some(k => k === 'identificador' || k === 'cuit' || k === 'email' || k === 'nombre');
          const hasBalance = keys.some(k => k === 'saldo' || k === 'balance' || k === 'deuda');
          
          if (!hasId || !hasBalance) {
            setError(`El archivo no tiene las columnas requeridas. Descargá la plantilla de ejemplo.`);
            return;
          }
        }

        const formattedRows = rows.map(r => {
          // Auto detect keys
          const rawKeys = Object.keys(r);
          const idKey = rawKeys.find(k => ['identificador', 'cuit', 'email', 'nombre'].includes(k.trim().toLowerCase()));
          const balanceKey = rawKeys.find(k => ['saldo', 'balance', 'deuda'].includes(k.trim().toLowerCase()));
          
          return {
            identifier: idKey ? String(r[idKey]).trim() : '',
            balance: balanceKey ? parseFloat(String(r[balanceKey]).replace(',', '.')) : 0
          };
        }).filter(r => r.identifier && !isNaN(r.balance));

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
      
      const res = await onImport(parsedRows, resolution);
      setResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error importando los saldos');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className={styles.container}>
        
        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.uploadArea}>
              <UploadCloud size={48} color="var(--text-muted)" />
              <h3>Subir archivo de Saldos</h3>
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
              
              {file && !error && <div className={styles.fileName}>{file.name} ({parsedRows.length} filas detectadas)</div>}
              {error && <div className={styles.errorText}><AlertTriangle size={14}/> {error}</div>}
            </div>

            <div className={styles.templateArea}>
              <p>¿No tenés el formato correcto?</p>
              <button className={styles.linkBtn} onClick={handleDownloadTemplate}>
                <FileDown size={16} /> Descargar Plantilla Base
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

        {/* STEP 2: OPTIONS */}
        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.summaryBox}>
              <FileSpreadsheet size={24} color="var(--accent)" />
              <div>
                <h4>Archivo listo</h4>
                <p>Se importarán {parsedRows.length} registros</p>
              </div>
            </div>

            <div className={styles.optionsSection}>
              <h4>Opciones de Importación</h4>
              <p className={styles.optionDesc}>¿Qué deseas hacer con el saldo actual de estos {entityName}s?</p>
              
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="resolution" 
                  value="add" 
                  checked={resolution === 'add'}
                  onChange={() => setResolution('add')}
                />
                <div>
                  <strong>Sumar al Saldo Actual</strong>
                  <p>Si la persona debe $1000 y el CSV dice $500, el nuevo saldo será $1500.</p>
                </div>
              </label>

              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="resolution" 
                  value="overwrite" 
                  checked={resolution === 'overwrite'}
                  onChange={() => setResolution('overwrite')}
                />
                <div>
                  <strong>Sobrescribir Saldo Actual</strong>
                  <p>El sistema ignorará la deuda actual y la reemplazará exactamente por lo que diga el CSV.</p>
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

        {/* STEP 3: RESULT */}
        {step === 3 && result && (
          <div className={styles.step}>
            <div className={styles.successArea}>
              <CheckCircle size={64} color="var(--success)" />
              <h3>Importación Finalizada</h3>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span>Saldos Actualizados</span>
                  <strong>{result.updatedCount}</strong>
                </div>
                <div className={styles.statBox}>
                  <span>No Encontrados</span>
                  <strong>{result.notFound.length}</strong>
                </div>
              </div>

              {result.notFound.length > 0 && (
                <div className={styles.notFoundBox}>
                  <strong>No se encontraron estos identificadores:</strong>
                  <div className={styles.notFoundList}>
                    {result.notFound.map((id, i) => <span key={i}>{id}</span>)}
                  </div>
                  <p className={styles.helpText}>Verificá que el CUIT o Email coincida exactamente con la base de datos.</p>
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
