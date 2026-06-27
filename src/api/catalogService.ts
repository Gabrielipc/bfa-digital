import { apiClient } from "./axios";
import { ApiResponse, Carrera, CatalogoSexo, Cohorte, GrupoAcademico } from "./types";

export const catalogService = {
  // Carreras
  async getCarreras(): Promise<Carrera[]> {
    const response = await apiClient.get<ApiResponse<Carrera[]>>("/catalogos/carreras");
    return response.data.data;
  },
  async createCarrera(carrera: Omit<Carrera, "id">): Promise<Carrera> {
    const response = await apiClient.post<ApiResponse<Carrera>>("/catalogos/carreras", carrera);
    return response.data.data;
  },
  async deleteCarrera(id: number): Promise<void> {
    await apiClient.delete(`/catalogos/carreras/${id}`);
  },

  // Grupos Académicos
  async getGrupos(): Promise<GrupoAcademico[]> {
    const response = await apiClient.get<ApiResponse<GrupoAcademico[]>>("/catalogos/grupos-academicos");
    return response.data.data;
  },
  async createGrupo(grupo: Omit<GrupoAcademico, "id">): Promise<GrupoAcademico> {
    const response = await apiClient.post<ApiResponse<GrupoAcademico>>("/catalogos/grupos-academicos", grupo);
    return response.data.data;
  },
  async deleteGrupo(id: number): Promise<void> {
    await apiClient.delete(`/catalogos/grupos-academicos/${id}`);
  },

  // Cohortes
  async getCohortes(): Promise<Cohorte[]> {
    const response = await apiClient.get<ApiResponse<Cohorte[]>>("/catalogos/cohortes");
    return response.data.data;
  },
  async createCohorte(cohorte: Omit<Cohorte, "id">): Promise<Cohorte> {
    const response = await apiClient.post<ApiResponse<Cohorte>>("/catalogos/cohortes", cohorte);
    return response.data.data;
  },
  async deleteCohorte(id: number): Promise<void> {
    await apiClient.delete(`/catalogos/cohortes/${id}`);
  },

  // Sexos
  async getSexos(): Promise<CatalogoSexo[]> {
    const response = await apiClient.get<ApiResponse<CatalogoSexo[]>>("/catalogos/sexos");
    return response.data.data;
  },
  async createSexo(sexo: Omit<CatalogoSexo, "id">): Promise<CatalogoSexo> {
    const response = await apiClient.post<ApiResponse<CatalogoSexo>>("/catalogos/sexos", sexo);
    return response.data.data;
  },
  async deleteSexo(id: number): Promise<void> {
    await apiClient.delete(`/catalogos/sexos/${id}`);
  }
};
