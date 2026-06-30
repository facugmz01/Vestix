import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Shared hook for delete mutations with confirmation state.
 * Eliminates the repetitive useMutation+toast pattern duplicated
 * in Customers, Suppliers, Branches, Locations, and other CRUD pages.
 */

export interface UseDeleteMutationOptions {
  /** API function that performs the delete (receives id) */
  mutationFn: (id: string) => Promise<unknown>;
  /** Query key to invalidate after successful deletion */
  invalidateKey: unknown[];
  /** Success toast message */
  successMessage: string;
  /** Default error message if the API doesn't provide one */
  errorMessage?: string;
  /** Callback after successful deletion */
  onSuccess?: () => void;
}

export function useDeleteMutation(options: UseDeleteMutationOptions) {
  const queryClient = useQueryClient();
  const {
    mutationFn,
    invalidateKey,
    successMessage,
    errorMessage = 'Error al eliminar el recurso',
    onSuccess,
  } = options;

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || errorMessage);
    },
  });

  return mutation;
}
