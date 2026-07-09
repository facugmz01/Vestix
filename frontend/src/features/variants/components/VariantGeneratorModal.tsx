import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { variantsApi, type GenerateCombinationsDto } from '@/api/variants.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { X, Plus, Shuffle } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
}

export function VariantGeneratorModal({ open, onClose, productId }: Props) {
  const queryClient = useQueryClient();

  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);

  const handleAddColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const handleAddSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes([...sizes, sizeInput.trim()]);
      setSizeInput('');
    }
  };

  const mutation = useMutation({
    mutationFn: (data: GenerateCombinationsDto) => variantsApi.generateCombinations(productId, data),
    onSuccess: (generated) => {
      toast.success(`Se generaron ${generated.length} variantes combinadas exitosamente`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(productId) });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al generar combinaciones');
    },
  });

  const handleSubmit = () => {
    if (colors.length === 0 && sizes.length === 0) {
      toast.error('Agregá al menos un color o talle para combinar');
      return;
    }
    mutation.mutate({ colors, sizes, basePrice });
  };

  return (
    <Drawer
      open={open}
      title="Generador de Combinaciones"
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending} icon={<Shuffle size={16} />}>
            Generar {Math.max(1, colors.length) * Math.max(1, sizes.length)} Variantes
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        
        <div className={styles.sectionPanel}>
          Ingresá los atributos. El sistema generará automáticamente todas las permutaciones posibles y les asignará SKUs secuenciales.
        </div>

        <div>
          <label className={styles.formLabelBlock}>
            Colores
          </label>
          <div className={styles.tagInputRow}>
            <Input 
              value={colorInput} 
              onChange={e => setColorInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
              placeholder="Ej: Rojo, Azul..." 
            />
            <Button variant="outline" onClick={handleAddColor}><Plus size={16} /></Button>
          </div>
          <div className={styles.tagList}>
            {colors.map(c => (
              <span key={c} className={styles.tagChip}>
                {c} <X size={12} className={styles.clickable} onClick={() => setColors(colors.filter(x => x !== c))} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className={styles.formLabelBlock}>
            Talles / Tamaños
          </label>
          <div className={styles.tagInputRow}>
            <Input 
              value={sizeInput} 
              onChange={e => setSizeInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
              placeholder="Ej: S, M, L..." 
            />
            <Button variant="outline" onClick={handleAddSize}><Plus size={16} /></Button>
          </div>
          <div className={styles.tagList}>
            {sizes.map(s => (
              <span key={s} className={styles.tagChip}>
                {s} <X size={12} className={styles.clickable} onClick={() => setSizes(sizes.filter(x => x !== s))} />
              </span>
            ))}
          </div>
        </div>

        <Input 
          label="Precio Base para todas las generadas ($)" 
          type="number" 
          value={basePrice} 
          onChange={e => setBasePrice(Number(e.target.value))} 
        />

      </div>
    </Drawer>
  );
}
