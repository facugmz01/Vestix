import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileDown, AlertTriangle, CheckCircle, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { productsApi } from '@/api/products.api';
import toast from 'react-hot-toast';
import styles from './ImportProductsModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'UPLOAD' | 'VALIDATING' | 'CONFLICTS' | 'IMPORTING' | 'SUCCESS';

export function ImportProductsModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  
  // Parsed and validated data
  const [validRows, setValidRows] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [stats, setStats] = useState({ created: 0, updated: 0 });

  const reset = () => {
    setStep('UPLOAD');
    setFile(null);
    setValidRows([]);
    setConflicts([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = "name,sku,barcode,category,brand,costPrice,basePrice,initialStock\nProducto Ejemplo,SKU-123,779123456789,General,MarcaX,1000.00,1500.00,10\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_articulos.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setStep('VALIDATING');

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        try {
          // Transform array of objects to expected DTO format
          const mappedRows = results.data.map((row: any) => ({
            name: row.name?.toString() || row.Nombre?.toString() || '',
            sku: row.sku?.toString() || row.SKU?.toString() || '',
            barcode: row.barcode?.toString() || row.Código?.toString() || '',
            category: row.category?.toString() || row.Categoría?.toString() || '',
            brand: row.brand?.toString() || row.Marca?.toString() || '',
            costPrice: parseFloat(String(row.costPrice ?? row.Costo ?? 0).replace(',', '.')) || 0,
            basePrice: parseFloat(String(row.basePrice ?? row['Precio Venta'] ?? 0).replace(',', '.')) || 0,
            initialStock: parseFloat(String(row.initialStock ?? row.Stock ?? 0).replace(',', '.')) || 0,
          })).filter(r => r.name); // Skip if no name

          if (mappedRows.length === 0) {
            toast.error('El archivo está vacío o no tiene el formato correcto');
            setStep('UPLOAD');
            return;
          }

          const response = await productsApi.bulkValidate(mappedRows);
          
          setValidRows(response.data.validRows);
          
          if (response.data.conflicts.length > 0) {
            // Assign default resolution to skip
            setConflicts(response.data.conflicts.map((c: any) => ({ ...c, row: { ...c.row, resolution: 'skip' } })));
            setStep('CONFLICTS');
          } else {
            // Straight to import if no conflicts
            executeImport(response.data.validRows);
          }
        } catch (error) {
          toast.error('Error procesando el archivo');
          console.error(error);
          setStep('UPLOAD');
        }
      },
      error: (error) => {
        toast.error('Error leyendo el CSV');
        console.error(error);
        setStep('UPLOAD');
      }
    });
  };

  const handleConflictResolution = (index: number, resolution: 'overwrite' | 'skip') => {
    const newConflicts = [...conflicts];
    newConflicts[index].row.resolution = resolution;
    setConflicts(newConflicts);
  };

  const resolveAll = (resolution: 'overwrite' | 'skip') => {
    setConflicts(conflicts.map(c => ({ ...c, row: { ...c.row, resolution } })));
  };

  const executeImport = async (rowsToImport: any[]) => {
    setStep('IMPORTING');
    try {
      const response = await productsApi.bulkImport(rowsToImport);
      setStats({ created: response.data.createdCount, updated: response.data.updatedCount });
      setStep('SUCCESS');
      onSuccess(); // Refresh product list in background
    } catch (error) {
      toast.error('Error importando artículos');
      console.error(error);
      setStep('UPLOAD');
    }
  };

  const handleImportWithConflicts = () => {
    const resolvedRows = conflicts.map(c => c.row);
    const finalRows = [...validRows, ...resolvedRows];
    executeImport(finalRows);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importador Masivo">
      <div className={styles.container}>
        
        {/* STEP: UPLOAD */}
        {step === 'UPLOAD' && (
          <div className={styles.uploadStep}>
            <div className={styles.header}>
              <FileSpreadsheet className={styles.headerIcon} />
              <h3 className={styles.title}>Sube tu archivo de artículos</h3>
              <p className={styles.subtitle}>
                Asegúrate de que la primera fila contenga los nombres de las columnas.
              </p>
            </div>

            <button type="button" className={styles.templateBtn} onClick={downloadTemplate}>
              <FileDown size={18} />
              Descargar Plantilla CSV
            </button>

            <label className={styles.dropzone}>
              <input 
                type="file" 
                accept=".csv" 
                className={styles.fileInput} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className={styles.dropIcon} />
              <p className={styles.dropText}>Haz clic aquí o arrastra un archivo .CSV</p>
            </label>
          </div>
        )}

        {/* STEP: VALIDATING */}
        {step === 'VALIDATING' && (
          <div className={styles.loadingStep}>
            <div className={styles.spinner} />
            <h3 className={styles.title}>Validando {file?.name}...</h3>
            <p className={styles.subtitle}>Comprobando códigos y formatos contra la base de datos.</p>
          </div>
        )}

        {/* STEP: CONFLICTS */}
        {step === 'CONFLICTS' && (
          <div className={styles.conflictsStep}>
            <div className={styles.alertBox}>
              <AlertTriangle size={24} className={styles.alertIcon} />
              <div>
                <h4 className={styles.alertTitle}>Hemos encontrado {conflicts.length} artículos duplicados</h4>
                <p className={styles.alertText}>Estos SKU ya existen en tu sistema. Selecciona qué deseas hacer con ellos.</p>
              </div>
            </div>

            <div className={styles.bulkActions}>
              <span className={styles.bulkLabel}>Acción global:</span>
              <button type="button" className={styles.textBtn} onClick={() => resolveAll('overwrite')}>Sobrescribir Todos</button>
              <button type="button" className={styles.textBtn} onClick={() => resolveAll('skip')}>Omitir Todos</button>
            </div>

            <div className={styles.conflictList}>
              {conflicts.map((c, i) => (
                <div key={i} className={styles.conflictRow}>
                  <div className={styles.conflictInfo}>
                    <span className={styles.conflictSku}>{c.row.sku}</span>
                    <span className={styles.conflictName}>{c.row.name}</span>
                  </div>
                  <div className={styles.conflictControls}>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        name={`res-${i}`} 
                        checked={c.row.resolution === 'skip'} 
                        onChange={() => handleConflictResolution(i, 'skip')} 
                      />
                      Omitir
                    </label>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        name={`res-${i}`} 
                        checked={c.row.resolution === 'overwrite'} 
                        onChange={() => handleConflictResolution(i, 'overwrite')} 
                      />
                      Sobrescribir
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleImportWithConflicts}>
                Continuar Importación <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP: IMPORTING */}
        {step === 'IMPORTING' && (
          <div className={styles.loadingStep}>
            <div className={styles.spinner} />
            <h3 className={styles.title}>Guardando artículos...</h3>
            <p className={styles.subtitle}>Esto puede tomar unos segundos.</p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className={styles.successStep}>
            <CheckCircle className={styles.successIcon} />
            <h3 className={styles.title}>¡Importación Exitosa!</h3>
            
            <div className={styles.statsBox}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.created}</span>
                <span className={styles.statLabel}>Artículos Creados</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.updated}</span>
                <span className={styles.statLabel}>Artículos Actualizados</span>
              </div>
            </div>

            <Button variant="primary" onClick={handleClose} className={styles.doneBtn}>
              Finalizar
            </Button>
          </div>
        )}

      </div>
    </Modal>
  );
}
