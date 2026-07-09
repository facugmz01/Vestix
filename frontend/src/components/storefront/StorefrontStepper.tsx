import clsx from 'clsx';
import styles from './storefront.module.css';

type Props = {
  steps: string[];
  currentStep: number;
  variant?: 'numbered' | 'dots';
};

export function StorefrontStepper({ steps, currentStep, variant = 'numbered' }: Props) {
  if (variant === 'dots') {
    return (
      <div className={styles.dotStepper} aria-label="Progreso">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={clsx(styles.dot, currentStep === idx + 1 && styles.dotActive)}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.stepper} aria-label="Progreso del checkout">
      <div className={styles.stepperTrack} aria-hidden />
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const active = currentStep >= stepNum;
        return (
          <div key={label} className={styles.stepperItem}>
            <div
              className={clsx(styles.stepperCircle, active && styles.stepperCircleActive)}
              aria-current={currentStep === stepNum ? 'step' : undefined}
            >
              {stepNum}
            </div>
            <span className={clsx(styles.stepperLabel, active && styles.stepperLabelActive)}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
