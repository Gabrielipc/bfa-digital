import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useEvaluationStore } from '../store/evaluationStore';

// Crear instancia de Axios
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el JWT a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      const headers = config.headers as any;
      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }
    const url = String(config.url || "");
    const isParticipantRequest = url.startsWith("/evaluacion-participante")
      || url.startsWith("/intentos/");
    const token = isParticipantRequest
      ? useEvaluationStore.getState().participantToken
      : useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas globales (ej. 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const isSessionCheck = error.config?.url?.includes("/auth/me");
      if (!isLoginRequest && isSessionCheck) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
