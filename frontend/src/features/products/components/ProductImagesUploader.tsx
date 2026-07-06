import { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { upload } from '@/api/client';
import { productsApi } from '@/api/products.api';
import toast from 'react-hot-toast';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
          background: isDragging ? 'var(--accent-muted)' : 'var(--bg-elevated)',
          transition: 'all 0.2s ease',
          cursor: uploading ? 'wait' : 'pointer',
          position: 'relative',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading ? <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} /> : <UploadCloud size={32} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />}
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {productId ? 'Subir al servidor' : 'Arrastrá imágenes (se guardan al crear el producto)'}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
          PNG, JPG, WebP hasta 5MB
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          disabled={uploading}
          onChange={handleFileSelect}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={img} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
