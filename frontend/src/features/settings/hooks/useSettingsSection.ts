/**
 * useSettingsSection
 *
 * Generic hook to load a typed settings section, submit a PATCH, and keep
 * the form in sync with the server state.
 *
 * Usage:
 *   const { form, onSubmit, isSaving } = useSettingsSection({
 *     key: 'general',
 *     queryFn: () => settingsApi.getSettings().then(d => d.general),
 *     mutateFn: settingsApi.updateGeneral,
 *   });
 */
import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/api/queryKeys';

interface Options<T extends Record<string, any>> {
  key: string;
  queryFn: () => Promise<T>;
  mutateFn: (dto: Partial<T>) => Promise<T>;
}

interface Result<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  isSaving: boolean;
  isLoading: boolean;
  onSubmit: () => void;
}

export function useSettingsSection<T extends Record<string, any>>({
  key,
  queryFn,
  mutateFn,
}: Options<T>): Result<T> {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [queryKeys.settings.get(), key],
    queryFn,
  });

  const form = useForm<T>();

  useEffect(() => {
    if (data) form.reset(data as any);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (values: T) => mutateFn(values),
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: [queryKeys.settings.get()] });
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar'),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return { form, isSaving: mutation.isPending, isLoading, onSubmit };
}
