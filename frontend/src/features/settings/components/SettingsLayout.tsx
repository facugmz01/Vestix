/** Shared layout components used by every settings section panel */

import clsx from 'clsx';
import styles from './SettingsShared.module.css';

export function SettingsSection({ title, description, children }: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.settingsSection}>
      <div className={styles.settingsSectionHeader}>
        <div>
          <h3 className={styles.settingsSectionTitle}>{title}</h3>
          {description && <p className={styles.settingsSectionDescription}>{description}</p>}
        </div>
      </div>
      <div className={styles.settingsSectionBody}>
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({ label, hint, children }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx('grid-responsive grid-cols-settings', styles.settingsRow)}>
      <div>
        <p className={styles.settingsRowLabel}>{label}</p>
        {hint && <p className={styles.settingsRowHint}>{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsDivider() {
  return <div className={styles.settingsDivider} />;
}

export function ToggleSwitch({ value, onChange, disabled }: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={clsx(styles.legacyToggle, value && styles.legacyToggleOn)}
    >
      <span className={clsx(styles.legacyToggleKnob, value && styles.legacyToggleKnobOn)} />
    </button>
  );
}
