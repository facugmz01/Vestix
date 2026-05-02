import { Badge } from '@/components/ui';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  status: string;
}

export function InvoiceStatusBadge({ status }: Props) {
  switch (status) {
    case 'PENDING':
      return <Badge color="orange"><Clock size={12} /> Pendiente</Badge>;
    case 'ISSUED':
      return <Badge color="green"><CheckCircle size={12} /> Emitida (CAE OK)</Badge>;
    case 'FAILED':
      return <Badge color="red"><AlertTriangle size={12} /> Error AFIP</Badge>;
    case 'CANCELLED':
      return <Badge color="gray"><XCircle size={12} /> Anulada</Badge>;
    default:
      return <Badge color="gray">{status}</Badge>;
  }
}
