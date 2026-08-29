import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { giftCardsApi } from '@/api/gift-cards.api';
import { queryKeys } from '@/api/queryKeys';
import type { GiftCardTemplateSettings } from '@/features/gift-cards/types/giftCardTemplate.types';
import toast from 'react-hot-toast';

export function useGiftCardTemplate() {
  return useQuery({
    queryKey: queryKeys.giftCards.template(),
    queryFn: async () => {
      const res = await giftCardsApi.getTemplate();
      return res.template;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateGiftCardTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: GiftCardTemplateSettings) => giftCardsApi.updateTemplate(template),
    onSuccess: () => {
      toast.success('Plantilla guardada');
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.template() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.get() });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Error al guardar la plantilla';
      toast.error(typeof msg === 'string' ? msg : 'Error al validar la plantilla');
    },
  });
}
