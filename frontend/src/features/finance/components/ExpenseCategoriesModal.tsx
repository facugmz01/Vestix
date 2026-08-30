import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Button,
  Badge,
  ToggleSwitch,
} from '@/components/ui';
import { financeApi, type CreateExpenseCategoryPayload } from '@/api/finance.api';
import { Plus, Tag, AlertTriangle, Layers } from 'lucide-react';
import styles from './ExpenseCategoriesModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExpenseCategoriesModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: rawCategories, isLoading } = useQuery({
    queryKey: ['expenses', 'categories', 'all'],
    queryFn: () => financeApi.getExpenseCategories(true),
    enabled: open,
  });
  const categories = Array.isArray(rawCategories)
    ? rawCategories
    : Array.isArray(rawCategories?.data)
    ? rawCategories.data
    : [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpenseCategoryPayload) =>
      financeApi.createExpenseCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] });
      setIsCreating(false);
      setName('');
      setCode('');
      setDescription('');
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al crear la categoría';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      financeApi.updateExpenseCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !code.trim()) {
      setFormError('El nombre y el código son obligatorios.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      isActive: true,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Categorías de Gastos Operativos"
      width="lg"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        {/* Toggle Create Form Bar */}
        <div className={styles.topBar}>
          <p className={styles.topDesc}>
            Clasificá los egresos operativos para obtener reportes precisos por centro de costo.
          </p>
          <Button
            variant={isCreating ? 'secondary' : 'primary'}
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              setIsCreating(!isCreating);
              setFormError(null);
            }}
          >
            {isCreating ? 'Cancelar' : 'Nueva Categoría'}
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <form onSubmit={handleSubmit} className={styles.createForm}>
            <span className={styles.formTitle}>Crear Categoría de Gasto</span>
            {formError && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre de la Categoría *</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Ej: Insumos de Tienda"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) {
                      setCode('EXP-' + e.target.value.substring(0, 4).toUpperCase());
                    }
                  }}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Código / Identificador *</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Ej: EXP-SUPPLIES"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Descripción (Opcional)</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Detalle de los gastos comprendidos en este rubro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={createMutation.isPending}
              >
                Guardar Categoría
              </Button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className={styles.categoriesList}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`${styles.categoryCard} ${!cat.isActive ? styles.categoryInactive : ''}`}
            >
              <div className={styles.catLeft}>
                <div className={styles.catIconWrapper}>
                  <Tag size={16} />
                </div>
                <div>
                  <div className={styles.catNameRow}>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catCode}>{cat.code}</span>
                    {!cat.isActive && <Badge color="red">Inactiva</Badge>}
                  </div>
                  {cat.description && (
                    <p className={styles.catDesc}>{cat.description}</p>
                  )}
                </div>
              </div>

              <div className={styles.catRight}>
                {cat._count?.expenses !== undefined && (
                  <span className={styles.catExpenseCount}>
                    {cat._count.expenses} gastos
                  </span>
                )}
                <div className={styles.switchWrapper}>
                  <ToggleSwitch
                    checked={cat.isActive}
                    onChange={(checked) =>
                      toggleStatusMutation.mutate({ id: cat.id, isActive: checked })
                    }
                    title={cat.isActive ? 'Desactivar categoría' : 'Activar categoría'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
