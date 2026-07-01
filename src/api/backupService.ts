import { apiClient } from "./axios";
import { ApiResponse } from "./types";

export interface BackupFileDTO {
  fileName: string;
  sizeBytes: number;
  generatedAt: string;
}

export interface BackupRestoreRequestDTO {
  auditId?: number | string;
}

function readPayload<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || response.message || "Operacion no completada.");
  }
  return response.data;
}

function filenameFromDisposition(disposition?: string, fallback = "backup") {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeBackup(row: any): BackupFileDTO {
  return {
    fileName: row.fileName || row.filename || row.name || row.id,
    sizeBytes: Number(row.sizeBytes ?? row.size ?? 0),
    generatedAt: row.generatedAt || row.createdAt || row.date || "",
  };
}

export const backupService = {
  async listBackups(): Promise<BackupFileDTO[]> {
    const response = await apiClient.get<ApiResponse<any[]>>("/backups");
    return readPayload(response.data).map(normalizeBackup);
  },

  async generateBackup(): Promise<BackupFileDTO> {
    const response = await apiClient.post<ApiResponse<any>>("/backups");
    return normalizeBackup(readPayload(response.data));
  },

  async downloadBackup(fileName: string): Promise<void> {
    const response = await apiClient.get(`/backups/${encodeURIComponent(fileName)}`, {
      responseType: "blob",
    });
    downloadBlob(filenameFromDisposition(response.headers["content-disposition"], fileName || "backup"), response.data);
  },

  async requestRestore(fileName: string): Promise<BackupRestoreRequestDTO> {
    const response = await apiClient.post<ApiResponse<BackupRestoreRequestDTO>>(
      `/backups/${encodeURIComponent(fileName)}/restore-requests`,
    );
    return readPayload(response.data);
  },
};
