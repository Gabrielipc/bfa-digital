import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Crear instancia de Axios
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/', // Ajusta esto según tu Spring Boot
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el JWT a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
      if (!isLoginRequest) {
        // Manejar cierre de sesión o token expirado
        useAuthStore.getState().logout();
        window.location.href = '/login'; // O redirigir con el router
      }
    }
    return Promise.reject(error);
  }
);
