/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  interface RegisterSWResult {
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  }

  export function useRegisterSW(options?: unknown): RegisterSWResult;
}
