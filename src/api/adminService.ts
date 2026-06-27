import { apiClient } from "./axios";
import { ApiResponse } from "./types";

export interface UserDTO {
  n: string; // nombre
  e: string; // correo/email
  r: string; // rol
  s: boolean; // activo/estado
}

export interface PermissionMatrixDTO {
  k: string; // clave/permiso
  roles: string[];
}

export interface AuditLogDTO {
  d: string; // fecha
  u: string; // usuario
  a: string; // acción
  e: string; // entidad
  ip: string; // IP
}

export interface BackupDTO {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  status: "COMPLETO" | "FALLIDO";
}

export const adminService = {
  // Obtener lista de usuarios del sistema
  async getUsers(): Promise<UserDTO[]> {
    // Usamos el endpoint de matriz de permisos porque incluye la lista de todos los usuarios
    // con sus roles asignados, lo cual es necesario para mapear 'r' (rol).
    const response = await apiClient.get<ApiResponse<any>>("/users/permission-matrix");
    const users = response.data.data?.users || [];
    return users.map((u: any) => ({
      n: u.fullName,
      e: u.email,
      r: u.roles && u.roles.length > 0 ? u.roles[0] : "Aplicador",
      s: u.status === "ACTIVO"
    }));
  },

  // Crear usuario y asignarle su rol en el backend real
  async createUser(userData: any): Promise<UserDTO> {
    const username = userData.e.split("@")[0];
    
    // 1. Crear el usuario en /users
    const createResponse = await apiClient.post<ApiResponse<any>>("/users", {
      username,
      email: userData.e,
      fullName: userData.n,
      password: "defaultPassword123!" // contraseña temporal
    });
    const createdUser = createResponse.data.data;

    // 2. Mapear el nombre del rol a ID
    let roleId = 3; // por defecto APLICADOR
    const cleanRole = userData.r.toUpperCase();
    if (cleanRole.includes("ADMIN")) {
      roleId = 1;
    } else if (cleanRole.includes("PSICOLOGO") || cleanRole.includes("COORDINADOR")) {
      roleId = 2;
    } else if (cleanRole.includes("APLICADOR")) {
      roleId = 3;
    } else if (cleanRole.includes("CONSULTOR") || cleanRole.includes("REPORTE")) {
      roleId = 4;
    }

    // 3. Asignar el rol al usuario
    await apiClient.post(`/users/${createdUser.id}/roles`, { roleId });

    return {
      n: createdUser.fullName,
      e: createdUser.email,
      r: userData.r,
      s: true
    };
  },

  // Obtener la matriz de permisos de forma dinámica desde el backend
  async getPermissionsMatrix(): Promise<PermissionMatrixDTO[]> {
    const response = await apiClient.get<ApiResponse<any>>("/users/permission-matrix");
    const data = response.data.data;
    
    const permsMap = new Map<string, Set<string>>();
    
    // Inicializar columnas de permisos
    if (data.permissionColumns) {
      data.permissionColumns.forEach((col: string) => {
        permsMap.set(col, new Set<string>());
      });
    }

    // Poblar según los roles que tienen asociados dichos permisos
    if (data.users) {
      data.users.forEach((user: any) => {
        if (user.permissions && user.roles) {
          user.permissions.forEach((perm: string) => {
            const rolesSet = permsMap.get(perm) || new Set<string>();
            user.roles.forEach((role: string) => rolesSet.add(role));
            permsMap.set(perm, rolesSet);
          });
        }
      });
    }

    return Array.from(permsMap.entries()).map(([k, rolesSet]) => ({
      k,
      roles: Array.from(rolesSet)
    }));
  },

  // Obtener logs de auditoría con filtros y mapearlos a lo esperado por el frontend
  async getAuditLogs(filters: any = {}): Promise<AuditLogDTO[]> {
    // Si filters está vacío, enviamos null o vacíos para que listAll funcione en el backend
    const params = filters && Object.keys(filters).length > 0 ? filters : {};
    const response = await apiClient.get<ApiResponse<any[]>>("/auditoria", { params });
    const logs = response.data.data || [];
    return logs.map((item: any) => ({
      d: item.creadoEn || "",
      u: item.usuario?.nombreUsuario || "Sistema",
      a: item.accion || "",
      e: item.entidad || "",
      ip: item.direccionIp || ""
    }));
  },

  // Copias de seguridad (mantenemos simulado o básico ya que no hay backend directo para esto)
  async getBackups(): Promise<BackupDTO[]> {
    return [];
  },

  async createBackup(): Promise<BackupDTO> {
    return {
      id: "backup-sim",
      filename: "backup_simulated.sql",
      sizeBytes: 1024,
      createdAt: new Date().toISOString(),
      status: "COMPLETO"
    };
  },

  async restoreBackup(_backupId: string): Promise<void> {
    return Promise.resolve();
  }
};
