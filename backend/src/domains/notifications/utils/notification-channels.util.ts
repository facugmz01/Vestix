import { NotificationChannel } from '../models/notification.model';
import { NotificationSettings, NotificationChannelPreference } from '../../../modules/settings/settings.service';

export type EventChannelKey =
  | 'saleChannels'
  | 'purchaseChannels'
  | 'deliveryChannels'
  | 'lowStockChannels'
  | 'transferChannels'
  | 'storeLoginChannels';

export const NOTIFICATION_CHANNEL_ORDER: NotificationChannel[] = [
  NotificationChannel.EMAIL,
  NotificationChannel.WHATSAPP,
  NotificationChannel.SMS,
];

const DEFAULT_CHANNELS: Record<EventChannelKey, NotificationChannel[]> = {
  saleChannels: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
  purchaseChannels: [NotificationChannel.EMAIL],
  deliveryChannels: [NotificationChannel.WHATSAPP],
  lowStockChannels: [NotificationChannel.EMAIL],
  transferChannels: [NotificationChannel.EMAIL],
  storeLoginChannels: [NotificationChannel.WHATSAPP],
};

export interface ContactRecipients {
  email?: string | null;
  phone?: string | null;
}

export function getEventChannels(
  settings: NotificationSettings,
  key: EventChannelKey,
): NotificationChannel[] {
  const configured = settings[key];
  if (Array.isArray(configured) && configured.length > 0) {
    const valid = new Set<string>(Object.values(NotificationChannel));
    return NOTIFICATION_CHANNEL_ORDER.filter(
      (channel) => configured.includes(channel as NotificationChannelPreference) && valid.has(channel),
    );
  }
  return DEFAULT_CHANNELS[key];
}

export function resolveRecipient(
  channel: NotificationChannel,
  contact: ContactRecipients,
  normalizePhone: (raw?: string | null) => string | null,
): string | null {
  switch (channel) {
    case NotificationChannel.EMAIL: {
      const email = contact.email?.trim();
      return email && email.includes('@') ? email : null;
    }
    case NotificationChannel.WHATSAPP:
    case NotificationChannel.SMS:
      return normalizePhone(contact.phone);
    default:
      return null;
  }
}

export function pickPrimaryChannel(
  settings: NotificationSettings,
  key: EventChannelKey,
): NotificationChannel | null {
  const channels = getEventChannels(settings, key);
  return channels[0] ?? null;
}
