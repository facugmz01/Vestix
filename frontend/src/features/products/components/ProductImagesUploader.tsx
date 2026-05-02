import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ProductImagesUploader({ images, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);

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
    
    // Mock logic: Just add a placeholder image URL for the dropped files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newMocks = Array.from(e.dataTransfer.files).map(f => URL.createObjectURL(f));
      onChange([...images, ...newMocks]);
    }
  };

  const handleRemove = (index: number) => {
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
          cursor: 'pointer'
        }}
      >
        <UploadCloud size={32} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Arrastrá imágenes aquí o hacé clic para subir
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
          PNG, JPG hasta 5MB. La primera imagen será la principal.
        </p>
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
