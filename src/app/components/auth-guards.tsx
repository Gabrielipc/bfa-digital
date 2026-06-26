import { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGateProps extends GuardProps {
  permission: string;
}

interface RoleGuardProps extends GuardProps {
  allowedRoles: string[];
}

/**
 * Renderiza su contenido solo si el usuario autenticado posee el permiso especificado.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission(permission));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Renderiza su contenido solo si el usuario autenticado posee alguno de los roles especificados.
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <>{fallback}</>;
  }

  const hasRole = user.roles.some((r) => allowedRoles.includes(r));

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
