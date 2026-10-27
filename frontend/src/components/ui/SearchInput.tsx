import { Search, X } from 'lucide-react';
import { useState }   from 'react';
import styles from './SearchInput.module.css';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  placeholder?: string;
  onSearch?:     (value: string) => void;
  onChange?:     (value: string) => void;
  delay?:       number;
  id?:          string;
  value?:       string;
}

/**
 * Debounced search input. Fires onSearch/onChange after the user stops typing.
 * Includes a clear button when the field has content.
 */
export function SearchInput({ placeholder = 'Buscar…', onSearch, onChange, delay = 350, id = 'search', value: controlledValue }: Props) {
  const [raw, setRaw] = useState(controlledValue ?? '');
  const handleCallback = onSearch || onChange || (() => {});

  // Fire onSearch/onChange with debounce
  useDebounce<string>(raw, delay, handleCallback);

  const handleClear = () => { setRaw(''); handleCallback(''); };

  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.icon} aria-hidden />
      <input
        id={id}
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        autoComplete="off"
        aria-label={placeholder}
      />
      {raw && (
        <button className={styles.clear} onClick={handleClear} aria-label="Limpiar búsqueda">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
