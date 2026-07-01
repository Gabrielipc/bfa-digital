import { apiClient } from "./axios";
import { ApiResponse } from "./types";

export interface RoleDTO {
  id: number;
  code: string;
  name: string;
}

export interface PermissionDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
}

function readPayload<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || response.message || "Operacion no completada.");
  }
  return response.data;
}

function normalizeRole(row: any): RoleDTO {
  return {
    id: Number(row.id),
    code: row.code || row.codigo || row.nombreRol || row.name || String(row.id),
    name: row.name || row.nombre || row.nombreRol || row.code || String(row.id),
  };
}

function normalizePermission(row: any): PermissionDTO {
  return {
    id: Number(row.id),
    code: row.code || row.codigo || row.clave || row.name || String(row.id),
    name: row.name || row.nombre || row.descripcion || row.code || String(row.id),
    description: row.description || row.descripcion,
  };
}

export const roleService = {
  async listRoles(): Promise<RoleDTO[]> {
    const response = await apiClient.get<ApiResponse<any[]>>("/roles");
    return readPayload(response.data).map(normalizeRole);
  },

  async listPermissions(): Promise<PermissionDTO[]> {
    const response = await apiClient.get<ApiResponse<any[]>>("/permissions");
    return readPayload(response.data).map(normalizePermission);
  },

  async listRolePermissionIds(roleId: number): Promise<number[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/roles/${roleId}/permissions`);
    return readPayload(response.data).map((value: any) => Number(value.id ?? value.permissionId ?? value));
  },

  async replaceRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const response = await apiClient.put<ApiResponse<void>>(`/roles/${roleId}/permissions`, { permissionIds });
    readPayload(response.data);
  },
};
