import {
  Banknote, CreditCard, QrCode, ArrowLeftRight, Wallet, Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PosPaymentMethodId =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'QR_MERCADOPAGO'
  | 'BANK_TRANSFER'
  | 'CUSTOMER_CREDIT'
  | 'MULTIPLE';

export interface PosPaymentMethodConfig {
  id: PosPaymentMethodId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  cssClass: string;
  requiresCustomer?: boolean;
  opensMixedModal?: boolean;
  opensQrModal?: boolean;
}

export const POS_PAYMENT_METHODS: PosPaymentMethodConfig[] = [
  { id: 'CASH', label: 'Efectivo', shortLabel: 'Efectivo', icon: Banknote, cssClass: 'bgCash' },
  { id: 'CREDIT_CARD', label: 'Tarjeta', shortLabel: 'Tarjeta', icon: CreditCard, cssClass: 'bgCredit' },
  { id: 'QR_MERCADOPAGO', label: 'QR MercadoPago', shortLabel: 'QR MercadoPago', icon: QrCode, cssClass: 'bgQr', opensQrModal: true },
  { id: 'BANK_TRANSFER', label: 'Transferencia', shortLabel: 'Transferencia', icon: ArrowLeftRight, cssClass: 'bgTransfer' },
  { id: 'CUSTOMER_CREDIT', label: 'Cuenta Corriente', shortLabel: 'Cuenta corriente', icon: Wallet, cssClass: 'bgAccount', requiresCustomer: true },
  { id: 'MULTIPLE', label: 'Pago Mixto', shortLabel: 'Pago mixto', icon: Layers, cssClass: 'bgMultiple', opensMixedModal: true },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  QR_MERCADOPAGO: 'QR MercadoPago',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CUSTOMER_CREDIT: 'Cuenta Corriente',
  MULTIPLE: 'Pago Mixto',
  GIFT_CARD: 'Gift Card / Puntos',
  LOYALTY: 'Puntos Fidelización',
  DEBIT_CARD: 'Tarjeta de Débito',
  STORE_CREDIT: 'Crédito a Favor',
};
