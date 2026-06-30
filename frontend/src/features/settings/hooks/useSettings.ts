import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, type SystemSettings } from '@/api/settings.api';
import toast from 'react-hot-toast';
import { queryKeys } from '@/api/queryKeys';

export function useGetSettings() {
  return useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: () => settingsApi.getSettings(),
    staleTime: 5 * 60 * 1000, 
  });
}

export function useUpdateSettingsSection<K extends keyof SystemSettings>(section: K) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SystemSettings[K]) => settingsApi.patchSection(section, data),
    onSuccess: () => {
      toast.success('Configuración guardada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.get() });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Error al guardar';
      toast.error(`Error: ${msg}`);
    }
  });
}
