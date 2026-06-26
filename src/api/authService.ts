import { apiClient } from "./axios";
import { useAuthStore, CurrentUserDTO } from "../store/authStore";
import { LoginRequest, LoginResult, MeResponse, ApiResponse } from "./types";

export const authService = {
  async login(username: string, password: string): Promise<{ token: string; user: CurrentUserDTO }> {
    try {
      // 1. Intentar login real con el Backend
      const loginResponse = await apiClient.post<ApiResponse<LoginResult>>("/auth/login", {
        username,
        password
      } as LoginRequest);
      
      const loginResult = loginResponse.data.data;
      const token = loginResult.accessToken;

      // Guardar temporalmente el token en la memoria del store para que el interceptor de Axios
      // lo inyecte en la llamada subsiguiente de /auth/me
      useAuthStore.getState().setToken(token);

      // 2. Obtener información completa de roles y permisos del usuario autenticado
      const meResponse = await apiClient.get<ApiResponse<MeResponse>>("/auth/me");
      const meData = meResponse.data.data;

      const user: CurrentUserDTO = {
        id: meData.userId,
        displayName: meData.username,
        roles: meData.roles,
        permissions: meData.permissions
      };

      return { token, user };
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || "Error al intentar iniciar sesión.";
      throw new Error(backendMessage);
    }
  },

  async getCurrentUser(): Promise<CurrentUserDTO> {
    try {
      const response = await apiClient.get<ApiResponse<MeResponse>>("/auth/me");
      const meData = response.data.data;
      return {
        id: meData.userId,
        displayName: meData.username,
        roles: meData.roles,
        permissions: meData.permissions
      };
    } catch (error) {
      throw error;
    }
  }
};

