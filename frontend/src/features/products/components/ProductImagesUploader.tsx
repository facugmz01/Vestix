import { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
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
        <div className={styles.previewRow}>
          {images.map((img, i) => (
            <div key={i} className={styles.previewItem}>
              <img src={img} alt={`Preview ${i}`} className={styles.previewImg} />
              <button type="button" onClick={() => handleRemove(i)} className={styles.previewRemove}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
