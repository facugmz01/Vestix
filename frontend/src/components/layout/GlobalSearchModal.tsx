import React, { useEffect, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './GlobalSearchModal.module.css';

export function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Mock navigation or real search logic here
      console.log('Searching for:', query);
      setIsOpen(false);
      // Example: navigate(`/admin/catalog?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <Search size={20} className={styles.icon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar en el sistema... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
          />
          <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </form>
        {query && (
          <div className={styles.results}>
            <p className={styles.helperText}>Presiona Enter para buscar "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
