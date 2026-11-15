import { useState } from 'react';
import { UploadCloud, X, Loader2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import { upload } from '@/api/client';
import { productsApi } from '@/api/products.api';
import toast from 'react-hot-toast';
import styles from './ProductFormWidgets.module.css';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  productId?: string;
}

export function ProductImagesUploader({ images, onChange, productId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;

    if (productId) {
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of files) {
          const res = await upload<{ url: string }>(`/products/${productId}/images`, file, 'image');
          urls.push(res.url);
        }
        onChange([...images, ...urls]);
        toast.success('Imágenes subidas');
      } catch {
        toast.error('Error al subir imágenes');
      } finally {
        setUploading(false);
      }
      return;
    }

    const promises = files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.readAsDataURL(file);
    }));
    const newImages = await Promise.all(promises);
    onChange([...images, ...newImages]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const img = images[index];
    if (productId && img.startsWith('/uploads/')) {
      try {
        await productsApi.deleteProductImage(productId, img);
      } catch {
        toast.error('No se pudo eliminar la imagen del servidor');
      }
    }
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  const handleImageDrop = (toIndex: number) => {
    if (draggedIndex !== null) moveImage(draggedIndex, toIndex);
    setDraggedIndex(null);
  };

  return (
    <div className={styles.uploaderStack}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={clsx(
          styles.dropzone,
          isDragging && styles.dropzoneDragging,
          uploading && styles.dropzoneUploading,
        )}
      >
        {uploading ? (
          <Loader2 size={32} className={clsx('spin', styles.dropzoneIcon)} />
        ) : (
          <UploadCloud size={32} color="var(--text-secondary)" className={styles.dropzoneIcon} />
        )}
        <p className={styles.dropzoneTitle}>
          {productId ? 'Subir al servidor' : 'Arrastrá imágenes (se guardan al crear el producto)'}
        </p>
        <p className={styles.dropzoneHint}>PNG, JPG, WebP hasta 5MB</p>
        <input
          type="file"
          multiple
          accept="image/*"
          disabled={uploading}
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
      </div>

      {images.length > 0 && (
        <div className={styles.previewRow} aria-label="Orden de imágenes del producto">
          {images.map((img, i) => (
            <div
              key={`${img}-${i}`}
              className={clsx(styles.previewItem, draggedIndex === i && styles.previewItemDragging)}
              draggable
              onDragStart={() => setDraggedIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleImageDrop(i)}
              onDragEnd={() => setDraggedIndex(null)}
              title="Arrastrá para reordenar"
            >
              <img src={img} alt={`Imagen ${i + 1}${i === 0 ? ' principal' : ''}`} className={styles.previewImg} />
              {i === 0 && <span className={styles.previewPrimary}>Principal</span>}
              <GripVertical size={14} className={styles.previewDragHandle} aria-hidden="true" />
              <button type="button" onClick={() => handleRemove(i)} className={styles.previewRemove}>
                <X size={12} />
              </button>
              <div className={styles.previewMoveControls}>
                <button
                  type="button"
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Mover imagen ${i + 1} hacia la izquierda`}
                  title="Mover hacia la izquierda"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label={`Mover imagen ${i + 1} hacia la derecha`}
                  title="Mover hacia la derecha"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
