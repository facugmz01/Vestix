import { useEffect, useState } from 'react';

/**
 * Overload 1: returns the debounced value (for use with controlled state)
 * Overload 2: calls a callback after the delay (for SearchInput)
 */
export function useDebounce<T>(value: T, delayMs?: number): T;
export function useDebounce<T>(value: T, delayMs: number, onChange: (v: T) => void): void;
export function useDebounce<T>(value: T, delayMs = 350, onChange?: (v: T) => void): T | void {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => {
      if (onChange) onChange(value);
      else setDebounced(value);
    }, delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!onChange) return debounced as T;
}
