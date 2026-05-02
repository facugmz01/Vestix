import { Badge } from '@/components/ui';

interface Props {
  status: string;
}

export function PaymentStatusBadge({ status }: Props) {
  switch (status) {
    case 'PENDING':
      return <Badge color="orange">Pendiente</Badge>;
    case 'COMPLETED':
      return <Badge color="green">Completado</Badge>;
    case 'FAILED':
      return <Badge color="red">Rechazado / Fallido</Badge>;
    case 'REFUNDED':
      return <Badge color="gray">Reembolsado</Badge>;
    default:
      return <Badge color="gray">{status}</Badge>;
  }
}
