import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FileText, Building2, User } from 'lucide-react';

import { Drawer, Button, Input } from '@/components/ui';
import { invoicesApi, type IssueInvoiceDto } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import type { InvoiceType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  saleOrderId?: string;
}

const IVA_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'No Responsable',
];

export function IssueInvoiceDrawer({ open, onClose, saleOrderId }: Props) {
  const queryClient = useQueryClient();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('FACTURA_B');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<IssueInvoiceDto, 'saleOrderId' | 'type'>>({
    defaultValues: {
      receiverName: '',
      receiverDocType: 'DNI',
      receiverDocNumber: '',
      receiverIvaCondition: 'Consumidor Final',
      receiverAddress: { street: '', city: '', state: '', zipCode: '', country: 'Argentina' },
    }
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<IssueInvoiceDto, 'saleOrderId' | 'type'>) =>
      invoicesApi.issueInvoice({ ...data, saleOrderId: saleOrderId!, type: invoiceType }),
    onSuccess: () => {
      toast.success('Comprobante enviado a AFIP. Aguardando CAE...');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
      if (saleOrderId) queryClient.invalidateQueries({ queryKey: queryKeys.invoices.bySale(saleOrderId) });
      onClose();
      reset();
    },
    onError: (err: any) => toast.error(err.message || 'Error al iniciar la emisión'),
  });

  const invoiceTypes: { value: InvoiceType; label: string; desc: string }[] = [
    { value: 'FACTURA_A', label: 'Factura A', desc: 'Responsables Inscriptos con descuento de IVA' },
    { value: 'FACTURA_B', label: 'Factura B', desc: 'Consumidores finales y Monotributistas' },
    { value: 'FACTURA_C', label: 'Factura C', desc: 'Emisores Monotributistas / No inscriptos' },
    { value: 'NOTA_CREDITO_A', label: 'N/C A', desc: 'Nota de Crédito para Factura A' },
    { value: 'NOTA_CREDITO_B', label: 'N/C B', desc: 'Nota de Crédito para Factura B' },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Emitir Comprobante Electrónico"
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit(d => mutation.mutate(d))} loading={mutation.isPending} icon={<FileText size={16} />}>
            Enviar a AFIP
          </Button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Invoice type */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '13px' }}>Tipo de Comprobante *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {invoiceTypes.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setInvoiceType(t.value)}
                style={{
                  padding: '12px 8px', borderRadius: '8px', border: invoiceType === t.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: invoiceType === t.value ? 'var(--blue-bg)' : 'var(--bg-base)',
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <span style={{ display: 'block', fontWeight: 800, fontSize: '14px', color: invoiceType === t.value ? 'var(--blue)' : 'var(--text-primary)' }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {saleOrderId && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--accent)" />
            <span style={{ fontSize: '13px' }}>Vinculado a Venta <strong style={{ fontFamily: 'monospace' }}>{saleOrderId}</strong></span>
          </div>
        )}

        {/* Fiscal receiver data */}
        <fieldset style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
          <legend style={{ padding: '0 8px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> Datos Fiscales del Receptor
          </legend>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Razón Social / Nombre *"
              {...register('receiverName', { required: 'Campo obligatorio' })}
              error={errors.receiverName?.message}
            />

            <div className="grid-responsive grid-cols-120-1" style={{ gap: "12px" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Tipo Doc.</label>
                <select {...register('receiverDocType')} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="DNI">DNI</option>
                </select>
              </div>
              <Input
                label="Número de Documento *"
                {...register('receiverDocNumber', {
                  required: 'Requerido',
                  pattern: { value: /^\d{7,11}$/, message: 'Solo números (7–11 dígitos)' }
                })}
                error={errors.receiverDocNumber?.message}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Condición IVA</label>
              <select {...register('receiverIvaCondition')} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
                {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Address (optional for Factura A) */}
        {(invoiceType === 'FACTURA_A' || invoiceType === 'NOTA_CREDITO_A') && (
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <legend style={{ padding: '0 8px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Domicilio Fiscal (Factura A — Requerido)
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Calle y Número"
                {...register('receiverAddress.street', { required: invoiceType === 'FACTURA_A' ? 'Requerido para Factura A' : false })}
                error={errors.receiverAddress?.street?.message}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', gap: '12px' }}>
                <Input label="Ciudad" {...register('receiverAddress.city')} />
                <Input label="Provincia" {...register('receiverAddress.state')} />
                <Input label="C.P." {...register('receiverAddress.zipCode')} />
              </div>
            </div>
          </fieldset>
        )}

        <div style={{ padding: '12px 16px', background: 'var(--orange-bg)', borderRadius: '8px', border: '1px solid var(--orange)', fontSize: '13px', color: 'var(--orange)' }}>
          <strong>Nota:</strong> Una vez enviado a AFIP, el comprobante queda registrado en el libro fiscal y no puede eliminarse. Para anular, se emite una Nota de Crédito.
        </div>

      </form>
    </Drawer>
  );
}
