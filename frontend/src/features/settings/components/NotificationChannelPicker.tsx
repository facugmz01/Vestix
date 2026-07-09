import clsx from 'clsx';
import { Mail, MessageSquare, Smartphone } from 'lucide-react';
import styles from './SettingsShared.module.css';

export type NotificationChannelOption = 'EMAIL' | 'WHATSAPP' | 'SMS';

const CHANNEL_OPTIONS: Array<{
  value: NotificationChannelOption;
  label: string;
  icon: typeof Mail;
}> = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { value: 'SMS', label: 'SMS', icon: Smartphone },
];

interface NotificationChannelPickerProps {
  label: string;
  hint?: string;
  value: NotificationChannelOption[];
  onChange: (channels: NotificationChannelOption[]) => void;
  singleSelect?: boolean;
}

export function NotificationChannelPicker({
  label,
  hint,
  value,
  onChange,
  singleSelect = false,
}: NotificationChannelPickerProps) {
  const toggle = (channel: NotificationChannelOption) => {
    if (singleSelect) {
      onChange([channel]);
      return;
    }

    if (value.includes(channel)) {
      const next = value.filter((item) => item !== channel);
      onChange(next.length > 0 ? next : [channel]);
      return;
    }

    const next = CHANNEL_OPTIONS
      .map((option) => option.value)
      .filter((option) => option === channel || value.includes(option));
    onChange(next);
  };

  return (
    <div className={styles.channelPicker}>
      <div>
        <p className={styles.channelPickerLabel}>{label}</p>
        {hint && <p className={styles.channelPickerHint}>{hint}</p>}
      </div>
      <div className={styles.channelPickerOptions}>
        {CHANNEL_OPTIONS.map(({ value: channel, label: channelLabel, icon: Icon }) => {
          const active = value.includes(channel);
          return (
            <button
              key={channel}
              type="button"
              className={clsx(styles.channelOption, { [styles.channelOptionActive]: active })}
              onClick={() => toggle(channel)}
              aria-pressed={active}
            >
              <Icon size={16} />
              <span>{channelLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
