import { useEffect } from 'react';
import type { PosPaymentMethodId } from '../constants/posPaymentMethods';

interface PosKeyboardHandlers {
  onFocusSearch: () => void;
  onQuickCash: () => void;
  onDuplicateLastSale: () => void;
  onFavoriteSlot: (index: number) => void;
  onEscape: () => void;
}

export function usePosKeyboard(handlers: PosKeyboardHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F2') {
        e.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        handlers.onQuickCash();
        return;
      }

      if (e.key === 'Escape') {
        handlers.onEscape();
        return;
      }

      if (e.ctrlKey && e.key === 'd' && !isInput) {
        e.preventDefault();
        handlers.onDuplicateLastSale();
        return;
      }

      const fMatch = e.key.match(/^F([1-8])$/);
      if (fMatch && !isInput) {
        e.preventDefault();
        handlers.onFavoriteSlot(parseInt(fMatch[1], 10) - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers]);
}

export type { PosPaymentMethodId };
