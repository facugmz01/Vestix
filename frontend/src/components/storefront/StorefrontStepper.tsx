import clsx from 'clsx';
import { User, Truck, CreditCard, Check } from 'lucide-react';
import styles from './storefront.module.css';

type Props = {
  steps: string[];
  currentStep: number;
  variant?: 'numbered' | 'dots';
};

function getStepIcon(label: string, stepNum: number) {
  const norm = label.toLowerCase();
  if (
    norm.includes('dato') ||
    norm.includes('comprador') ||
    norm.includes('cliente') ||
    norm.includes('user') ||
    stepNum === 1
  ) {
    return <User size={16} />;
  }
  if (
    norm.includes('env') ||
    norm.includes('entrega') ||
    norm.includes('despacho') ||
    norm.includes('truck') ||
    stepNum === 2
  ) {
    return <Truck size={16} />;
  }
  if (
    norm.includes('pago') ||
    norm.includes('tarjeta') ||
    norm.includes('card') ||
    norm.includes('credit') ||
    stepNum === 3
  ) {
    return <CreditCard size={16} />;
  }
  return stepNum;
}

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

  const progressPercent =
    steps.length > 1
      ? Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))
      : 0;

  return (
    <div className={styles.stepper} aria-label="Progreso del checkout">
      <div className={styles.stepperTrack} aria-hidden>
        <div
          className={styles.stepperProgress}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;
        const isUpcoming = currentStep < stepNum;

        return (
          <div key={label} className={styles.stepperItem}>
            <div
              className={clsx(
                styles.stepperCircle,
                isCompleted && styles.stepperCircleCompleted,
                isCurrent && styles.stepperCircleCurrent,
                isUpcoming && styles.stepperCircleUpcoming
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCompleted ? (
                <Check size={16} strokeWidth={2.6} />
              ) : (
                getStepIcon(label, stepNum)
              )}
            </div>
            <span
              className={clsx(
                styles.stepperLabel,
                isCurrent && styles.stepperLabelCurrent,
                isCompleted && styles.stepperLabelCompleted
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
