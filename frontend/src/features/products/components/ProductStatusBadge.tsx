import { Badge, StatusChip } from '@/components/ui';

interface Props {
  isActive: boolean;
  isPublished: boolean;
}

export function ProductStatusBadge({ isActive, isPublished }: Props) {
  if (!isActive) {
    return <StatusChip label="Inactivo" color="gray" size="sm" />;
  }
  
  if (isPublished) {
    return <StatusChip label="Publicado" color="green" size="sm" />;
  }

  return <Badge color="yellow">Borrador</Badge>;
}
