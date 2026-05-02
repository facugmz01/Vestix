/** Shared layout components used by every settings section panel */
import { Save } from 'lucide-react';
import { Button } from '@/components/ui';

export function SettingsSection({ title, description, children, onSave, isSaving }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{title}</h3>
          {description && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{description}</p>}
        </div>
        <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={onSave} loading={isSaving}>
          Guardar
        </Button>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{label}</p>
        {hint && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsDivider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '0 -24px' }} />;
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
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: value ? 'var(--accent)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        display: 'block', width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', position: 'absolute', top: '3px',
        left: value ? '23px' : '3px', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
