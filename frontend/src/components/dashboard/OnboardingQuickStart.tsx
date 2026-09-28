import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Building2,
  PackagePlus,
  Calculator,
  Receipt,
  Check,
  ChevronRight,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import styles from './OnboardingQuickStart.module.css';

const STORAGE_STEPS_KEY = 'vestix_onboarding_steps';
const STORAGE_DISMISSED_KEY = 'vestix_onboarding_dismissed';

interface StepItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  linkLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ONBOARDING_STEPS: StepItem[] = [
  {
    id: 'branches',
    title: 'Configurar Sucursal y Empresa',
    desc: 'Definí tus datos fiscales, puntos de venta y depósitos.',
    link: '/admin/branches',
    linkLabel: 'Configurar Sucursales',
    icon: Building2,
  },
  {
    id: 'product',
    title: 'Cargar Primer Producto',
    desc: 'Creá productos base, variantes de talle/color y listas de precios.',
    link: '/admin/catalog/new',
    linkLabel: 'Cargar Producto',
    icon: PackagePlus,
  },
  {
    id: 'pos',
    title: 'Abrir Caja en POS',
    desc: 'Iniciá un turno de cobro rápido en mostrador y probá una venta.',
    link: '/pos',
    linkLabel: 'Abrir Terminal POS',
    icon: Calculator,
  },
  {
    id: 'afip',
    title: 'Facturación AFIP y Pagos',
    desc: 'Vinculá tu CUIT, certificados ARCA/AFIP y medios de pago.',
    link: '/admin/integrations',
    linkLabel: 'Configurar Integraciones',
    icon: Receipt,
  },
];

export function OnboardingQuickStart() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_STEPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId];
      try {
        localStorage.setItem(STORAGE_STEPS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving onboarding step', e);
      }
      return next;
    });
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch (e) {
      console.error('Error dismissing onboarding', e);
    }
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  const completedCount = completedSteps.length;
  const totalCount = ONBOARDING_STEPS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isAllDone = completedCount === totalCount;

  return (
    <div className={styles.container} aria-label="Guía de inicio rápido de Vestix">
      <div className={styles.topDecor} />

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.badgeRow}>
            <span className={styles.quickStartBadge}>
              <Sparkles size={12} /> Primeros Pasos
            </span>
          </div>
          <h2 className={styles.title}>Comenzá con Vestix: Guía Rápida de Configuración</h2>
          <p className={styles.subtitle}>
            Completá estos 4 pasos esenciales para configurar tu sistema y empezar a operar.
          </p>
        </div>

        <div className={styles.actionsArea}>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={handleDismiss}
            title="Ocultar esta guía del panel"
          >
            <EyeOff size={14} /> Ocultar guía
          </button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>
            {completedCount} de {totalCount} pasos completados
          </span>
          <span
            className={clsx(
              styles.percentLabel,
              isAllDone && styles.percentLabelDone
            )}
          >
            {progressPercent}% completado
          </span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isAllDone && (
        <div className={styles.allDoneCelebration}>
          <CheckCircle2 size={18} />
          <span>¡Excelente trabajo! Has completado todos los pasos de configuración inicial.</span>
        </div>
      )}

      <div className={styles.stepsGrid}>
        {ONBOARDING_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div
              key={step.id}
              className={clsx(
                styles.stepCard,
                isCompleted && styles.stepCardCompleted
              )}
            >
              <div
                className={styles.checkboxContainer}
                onClick={() => toggleStep(step.id)}
                role="checkbox"
                aria-checked={isCompleted}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleStep(step.id);
                  }
                }}
                title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
              >
                <div
                  className={clsx(
                    styles.checkbox,
                    isCompleted && styles.checkboxChecked
                  )}
                >
                  {isCompleted && <Check size={14} strokeWidth={3} />}
                </div>
              </div>

              <div
                className={clsx(
                  styles.stepIcon,
                  isCompleted && styles.stepIconCompleted
                )}
              >
                <Icon size={18} />
              </div>

              <div className={styles.stepContent}>
                <h4
                  className={clsx(
                    styles.stepTitle,
                    isCompleted && styles.stepTitleCompleted
                  )}
                >
                  {step.title}
                </h4>
                <p className={styles.stepDesc}>{step.desc}</p>
                <Link to={step.link} className={styles.stepLink}>
                  <span>{step.linkLabel}</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OnboardingQuickStart;
