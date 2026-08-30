import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SidebarState {
  isCollapsed: boolean; // Estado colapsado en desktop (mini-bar vs ancho completo)
  isMobileOpen: boolean; // Estado drawer en móvil
  expandedGroups: string[]; // Lista de IDs/keys de menús padre abiertos (acordeones)

  // Acciones principales requeridas
  toggleSidebar: () => void; // Acción única para desktop
  toggleMobileSidebar: () => void; // Acción para mobile
  toggleGroup: (groupId: string) => void; // Abrir/cerrar submenú padre
  closeGroup: (groupId: string) => void;
  setCollapsed: (value: boolean) => void;

  // Métodos de compatibilidad y control granular
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
  setGroupExpanded: (groupId: string, expanded: boolean) => void;
  isGroupExpanded: (groupId: string) => boolean;

  // Alias para retrocompatibilidad
  toggleCollapse: () => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      isMobileOpen: false,
      expandedGroups: ['catalog'],

      toggleSidebar: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
        })),

      toggleMobileSidebar: () =>
        set((state) => ({
          isMobileOpen: !state.isMobileOpen,
        })),

      toggleGroup: (groupId: string) =>
        set((state) => {
          const isExpanded = state.expandedGroups.includes(groupId);
          return {
            expandedGroups: isExpanded
              ? state.expandedGroups.filter((id) => id !== groupId)
              : [...state.expandedGroups, groupId],
          };
        }),

      closeGroup: (groupId: string) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.filter((id) => id !== groupId),
        })),

      setCollapsed: (isCollapsed: boolean) =>
        set({ isCollapsed }),

      setMobileOpen: (isMobileOpen: boolean) =>
        set({ isMobileOpen }),

      closeMobile: () =>
        set({ isMobileOpen: false }),

      setGroupExpanded: (groupId: string, expanded: boolean) =>
        set((state) => {
          const exists = state.expandedGroups.includes(groupId);
          if (expanded && !exists) {
            return { expandedGroups: [...state.expandedGroups, groupId] };
          }
          if (!expanded && exists) {
            return { expandedGroups: state.expandedGroups.filter((id) => id !== groupId) };
          }
          return state;
        }),

      isGroupExpanded: (groupId: string) => {
        return get().expandedGroups.includes(groupId);
      },

      // Aliases for seamless backward compatibility
      toggleCollapse: () => get().toggleSidebar(),
      toggleMobile: () => get().toggleMobileSidebar(),
    }),
    {
      name: 'vestix_sidebar_state_v2',
      storage: createJSONStorage(() => localStorage),
      // No persistir el estado del drawer móvil entre recargas
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedGroups: state.expandedGroups,
      }),
    }
  )
);
