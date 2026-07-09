import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';

interface Props {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}

/**
 * Protects storefront routes that require an authenticated customer session.
 */
export function StorefrontRequireAuth({ children, requireCompleteProfile = false }: Props) {
  const { isAuthenticated, isLoading, customer } = useStorefrontAuthStore();
  const location = useLocation();
  const prefix = storePrefix();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={32} className="spin" color="var(--accent)" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`${prefix}/login`} replace state={{ from: location.pathname }} />;
  }

  if (requireCompleteProfile && customer && customer.profileComplete === false) {
    return <Navigate to={`${prefix}/profile`} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
