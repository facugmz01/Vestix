import { NotificationChannel } from '../models/notification.model';
import {
  getEventChannels,
  resolveRecipient,
  NOTIFICATION_CHANNEL_ORDER,
} from './notification-channels.util';
import { NotificationSettings } from '../../../modules/settings/settings.service';

describe('notification-channels.util', () => {
  const baseSettings = {
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    pushEnabled: false,
    lowStockThreshold: 5,
    notifyOnSale: true,
    notifyOnPurchase: true,
    notifyOnLowStock: true,
    notifyOnTransfer: true,
    notifyOnDelivery: true,
  } as NotificationSettings;

  it('returns configured channels in stable order', () => {
    const channels = getEventChannels(
      { ...baseSettings, saleChannels: ['SMS', 'EMAIL', 'WHATSAPP'] },
      'saleChannels',
    );
    expect(channels).toEqual([
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
      NotificationChannel.SMS,
    ]);
  });

  it('falls back to defaults when channels are missing', () => {
    expect(getEventChannels(baseSettings, 'storeLoginChannels')).toEqual([
      NotificationChannel.WHATSAPP,
    ]);
  });

  it('resolves recipients per channel', () => {
    const normalize = (phone?: string | null) => (phone ? '5491122334455' : null);
    expect(resolveRecipient(
      NotificationChannel.EMAIL,
      { email: 'a@test.com', phone: '111' },
      normalize,
    )).toBe('a@test.com');
    expect(resolveRecipient(
      NotificationChannel.SMS,
      { email: 'a@test.com', phone: '111' },
      normalize,
    )).toBe('5491122334455');
  });

  it('keeps channel order constant', () => {
    expect(NOTIFICATION_CHANNEL_ORDER).toEqual([
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
      NotificationChannel.SMS,
    ]);
  });
});
