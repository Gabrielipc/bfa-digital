import { apiClient } from "./axios";
import { ApiResponse } from "./types";

export interface IndividualResultDTO {
  resultId: string;
  participant: {
    id: string;
    displayName: string;
    demographicSummary: string;
  };
  session: { id: string; name: string };
  status: string;
  totalScore: number;
  dimensions: Array<{
    dimensionName: string;
    rawScore: number;
    percentile: number;
    category: string;
    interpretation: string;
  }>;
  disclaimer: string;
}

export interface DashboardMetricsDTO {
  bySubtest: Array<{ sub: string; media: number }>;
  byAge: Array<{ age: number; m: number }>;
  bySex: Array<{ n: string; v: number }>;
}

export const resultsService = {
  // Obtener lista de resultados con filtros
  async getResults(filters: any = {}): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>("/resultados", { params: filters });
    return response.data.data;
  },

  // Obtener detalle individual de un resultado
  async getResultDetail(resultadoId: string): Promise<IndividualResultDTO> {
    const response = await apiClient.get<ApiResponse<IndividualResultDTO>>(`/resultados/${resultadoId}`);
    return response.data.data;
  },

  // Obtener métricas agregadas del dashboard
  async getDashboardData(filters: any = {}): Promise<DashboardMetricsDTO> {
    const response = await apiClient.get<ApiResponse<DashboardMetricsDTO>>("/resultados/dashboard", { params: filters });
    return response.data.data;
  },

  // Descargar reporte seguro
  async downloadReport(type: string, format: "PDF" | "XLSX" | "CSV", filters: any = {}): Promise<void> {
    const response = await apiClient.get(`/reportes/descargar`, {
      params: { type, format, ...filters },
      responseType: "blob"
    });
    
    // Iniciar descarga del archivo en el navegador
    const blob = new Blob([response.data], { type: response.headers["content-type"] });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `reporte_${type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
    link.click();
  },

  // Obtener revisiones pendientes
  async getPendingReviews(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>("/resultados/revisiones-pendientes");
    return response.data.data;
  },

  // Enviar calificación manual
  async submitReview(reviewId: string, status: "CORRECTA" | "INCORRECTA"): Promise<void> {
    await apiClient.put(`/resultados/revisiones/${reviewId}`, { status });
  }
};
