import { Drawer, Button } from '@/components/ui';
import { VariantCombinationGenerator } from './VariantCombinationGenerator';

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  defaultBasePrice?: number;
}

export function VariantGeneratorDrawer({ open, onClose, productId, defaultBasePrice = 0 }: Props) {
  return (
    <Drawer
      open={open}
      title="Generador de Combinaciones"
      onClose={onClose}
      width="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <VariantCombinationGenerator
        mode="persist"
        productId={productId}
        basePrice={defaultBasePrice}
        onPersistSuccess={onClose}
      />
    </Drawer>
  );
}
