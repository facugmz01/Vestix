import React from 'react';
import { MessageCircle, Sparkles, Flame, Tag, Truck } from 'lucide-react';
import clsx from 'clsx';
import styles from './ThemeStoriesBar.module.css';

interface ThemeStoriesBarProps {
  categories?: Array<{ id: string; name: string }>;
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
  whatsappNumber?: string;
}

export function ThemeStoriesBar({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  whatsappNumber = '',
}: ThemeStoriesBarProps) {
  const cleanWhatsAppNumber = whatsappNumber.replace(/\D/g, '');
  const waUrl = cleanWhatsAppNumber
    ? `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent('Hola! Quiero consultar el catálogo.')}`
    : '#';

  return (
    <div className={styles.storiesContainer}>
      <div className={styles.storiesTrack}>
        {/* Story: Todos */}
        <button
          type="button"
          onClick={() => onSelectCategory?.('')}
          className={styles.storyItem}
        >
          <div className={clsx(styles.storyRing, !selectedCategory && styles.storyRingActive)}>
            <div className={styles.storyInner}>
              <Sparkles size={20} className={styles.storyIcon} />
            </div>
          </div>
          <span className={clsx(styles.storyLabel, !selectedCategory && styles.storyLabelActive)}>
            Todos
          </span>
        </button>

        {/* Story: WhatsApp Direct */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.storyItem}
        >
          <div className={clsx(styles.storyRing, styles.waRing)}>
            <div className={clsx(styles.storyInner, styles.waInner)}>
              <MessageCircle size={20} className={styles.waIcon} />
            </div>
          </div>
          <span className={styles.storyLabel}>WhatsApp</span>
        </a>

        {/* Story items from Categories */}
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory?.(isSelected ? '' : cat.id)}
              className={styles.storyItem}
            >
              <div className={clsx(styles.storyRing, isSelected && styles.storyRingActive)}>
                <div className={styles.storyInner}>
                  {idx % 3 === 0 ? (
                    <Flame size={20} className={styles.storyIcon} />
                  ) : idx % 3 === 1 ? (
                    <Tag size={20} className={styles.storyIcon} />
                  ) : (
                    <span className={styles.storyInitial}>{cat.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className={clsx(styles.storyLabel, isSelected && styles.storyLabelActive)}>
                {cat.name}
              </span>
            </button>
          );
        })}

        {/* Story: Envíos */}
        <div className={styles.storyItem}>
          <div className={styles.storyRing}>
            <div className={styles.storyInner}>
              <Truck size={20} className={styles.storyIcon} />
            </div>
          </div>
          <span className={styles.storyLabel}>Envíos</span>
        </div>
      </div>
    </div>
  );
}
