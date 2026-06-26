import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrentUserDTO {
  id: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export const normalizeRole = (role: string): string => {
  const clean = role.toUpperCase().replace(/^ROLE_/, "");
  if (clean.includes("ADMINISTRADOR") || clean === "ADMIN") return "admin";
  if (clean.includes("APLICADOR")) return "aplicador";
  if (clean.includes("PSICOLOGO") || clean.includes("COORDINADOR")) return "psicologo";
  if (clean.includes("CONSULTOR") || clean.includes("REPORTE")) return "consultor";
  return clean.toLowerCase();
};

interface AuthState {
  token: string | null;
  user: CurrentUserDTO | null;
  setToken: (token: string | null) => void;
  setUser: (user: CurrentUserDTO | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => {
        if (user) {
          user.roles = user.roles.map(normalizeRole);
        }
        set({ user });
      },
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        // Si el usuario es administrador, por defecto tiene todos los permisos en el frontend
        const normalizedRoles = user.roles.map(normalizeRole);
        if (normalizedRoles.includes('admin')) return true;
        return user.permissions.includes(permission);
      },
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        const normalizedRoles = user.roles.map(normalizeRole);
        const normalizedTarget = normalizeRole(role);
        return normalizedRoles.includes(normalizedTarget);
      },
    }),
    {
      name: 'bfa-digital-auth-storage',
    }
  )
);
