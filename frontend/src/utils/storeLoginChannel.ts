import type { LucideIcon } from 'lucide-react';
import { Mail, MessageCircle, Smartphone } from 'lucide-react';

export type StoreLoginChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface StoreLoginChannelConfig {
  channel: StoreLoginChannel;
  icon: LucideIcon;
  subtitle: string;
  inputLabel: string;
  inputType: 'email' | 'tel';
  inputMode: 'email' | 'tel';
  placeholder: string;
  hint: string;
  buttonLabel: string;
  resendLabel: string;
  changeLabel: string;
  sentToLabel: (identifier: string) => string;
  validate: (raw: string) => string | null;
  buildPayload: (identifier: string) => { phone?: string; email?: string };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return digits;
  if (digits.startsWith('54') && digits.length > 11) return digits;
  if (digits.startsWith('0')) return '54' + digits.slice(1);
  return '549' + digits;
}

const CHANNEL_CONFIG: Record<StoreLoginChannel, StoreLoginChannelConfig> = {
  EMAIL: {
    channel: 'EMAIL',
    icon: Mail,
    subtitle: 'Ingresá con tu correo para ver tus pedidos',
    inputLabel: 'Tu correo electrónico',
    inputType: 'email',
    inputMode: 'email',
    placeholder: 'tu@email.com',
    hint: 'Te enviaremos un código de verificación a tu casilla.',
    buttonLabel: 'Enviar código por correo',
    resendLabel: 'Reenviar código por correo',
    changeLabel: 'Cambiar correo',
    sentToLabel: (identifier) => identifier,
    validate: (raw) => {
      const email = raw.trim().toLowerCase();
      if (!email || !email.includes('@') || !email.includes('.')) {
        return 'Ingresá un correo electrónico válido';
      }
      return null;
    },
    buildPayload: (identifier) => ({ email: identifier.trim().toLowerCase() }),
  },
  SMS: {
    channel: 'SMS',
    icon: Smartphone,
    subtitle: 'Ingresá con tu celular para ver tus pedidos',
    inputLabel: 'Tu número de celular',
    inputType: 'tel',
    inputMode: 'tel',
    placeholder: '11 2233 4455',
    hint: 'Ingresá tu número sin el 0 inicial ni el 15. Ejemplo: 11 2233 4455',
    buttonLabel: 'Enviar código por SMS',
    resendLabel: 'Reenviar código por SMS',
    changeLabel: 'Cambiar número',
    sentToLabel: (identifier) => `+54 ${identifier}`,
    validate: (raw) => {
      if (!raw.trim() || raw.replace(/\D/g, '').length < 8) {
        return 'Ingresá un número válido (ej: 11 2233 4455)';
      }
      return null;
    },
    buildPayload: (identifier) => ({ phone: normalizePhone(identifier) }),
  },
  WHATSAPP: {
    channel: 'WHATSAPP',
    icon: MessageCircle,
    subtitle: 'Ingresá con WhatsApp para ver tus pedidos',
    inputLabel: 'Tu número de WhatsApp',
    inputType: 'tel',
    inputMode: 'tel',
    placeholder: '11 2233 4455',
    hint: 'Ingresá tu número sin el 0 inicial ni el 15. Ejemplo: 11 2233 4455',
    buttonLabel: 'Enviar código por WhatsApp',
    resendLabel: 'Reenviar código por WhatsApp',
    changeLabel: 'Cambiar número',
    sentToLabel: (identifier) => `+54 ${identifier}`,
    validate: (raw) => {
      if (!raw.trim() || raw.replace(/\D/g, '').length < 8) {
        return 'Ingresá un número válido (ej: 11 2233 4455)';
      }
      return null;
    },
    buildPayload: (identifier) => ({ phone: normalizePhone(identifier) }),
  },
};

export function getStoreLoginChannelConfig(
  channels?: StoreLoginChannel[] | null,
): StoreLoginChannelConfig {
  const primary = channels?.[0];
  if (primary && primary in CHANNEL_CONFIG) {
    return CHANNEL_CONFIG[primary];
  }
  return CHANNEL_CONFIG.WHATSAPP;
}
