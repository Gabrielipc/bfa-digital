import { apiClient } from "./axios";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: { message?: string };
};

async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await request;
    if (!response.data.success) {
      throw new Error(response.data.error?.message || response.data.message || "Operacion no completada.");
    }
    return response.data.data;
  } catch (error: any) {
    const data = error.response?.data;
    if (data?.error?.code === "UNAUTHORIZED") {
      throw new Error("Sesión administrativa no autenticada. Inicie sesión nuevamente.");
    }
    if (data?.error?.message || data?.message) {
      throw new Error(data.error?.message || data.message);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export function downloadDataFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(disposition?: string, fallback = "download") {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Array.from(rows.reduce((keys, row) => {
    Object.keys(row).forEach((key) => keys.add(key));
    return keys;
  }, new Set<string>()));

  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export const adminService = {
  listTests: () => unwrap<any[]>(apiClient.get("/tests")),
  createTest: (payload: { code: string; name: string; description?: string }) =>
    unwrap<any>(apiClient.post("/tests", payload)),
  listVersions: (testId: number | string) => unwrap<any[]>(apiClient.get(`/tests/${testId}/versions`)),
  createVersion: (testId: number | string, payload: {
    number: string;
    strategyId?: number;
    instructions?: string;
    timeLimitSeconds?: number;
    randomizeSubtests?: boolean;
    randomizeItems?: boolean;
  }) => unwrap<any>(apiClient.post(`/tests/${testId}/versions`, payload)),
  publishVersion: (versionId: number | string) => unwrap<any>(apiClient.post(`/test-versions/${versionId}/publish`)),
  approveVersion: (versionId: number | string) => unwrap<any>(apiClient.post(`/test-versions/${versionId}/approve`)),
  getVersionConfiguration: (versionId: number | string) =>
    unwrap<any>(apiClient.get(`/test-versions/${versionId}/configuration`)),
  listSubtests: (versionId: number | string) => unwrap<any[]>(apiClient.get(`/test-versions/${versionId}/subtests`)),
  createSubtest: (versionId: number | string, payload: {
    code: string;
    name: string;
    description?: string;
    instructions?: string;
    order: number;
    timeLimitSeconds?: number;
    randomizeItems?: boolean;
    randomizeOptions?: boolean;
    required?: boolean;
  }) => unwrap<any>(apiClient.post(`/test-versions/${versionId}/subtests`, payload)),
  updateSubtest: (subtestId: number | string, payload: {
    code: string;
    name: string;
    description?: string;
    instructions?: string;
    order: number;
    timeLimitSeconds?: number;
    randomizeItems?: boolean;
    randomizeOptions?: boolean;
    required?: boolean;
  }) => unwrap<any>(apiClient.patch(`/subtests/${subtestId}`, payload)),
  deleteSubtest: (subtestId: number | string) => unwrap<void>(apiClient.delete(`/subtests/${subtestId}`)),
  listItems: (subtestId: number | string) => unwrap<any[]>(apiClient.get(`/subtests/${subtestId}/items`)),
  createItem: (subtestId: number | string, payload: {
    code: string;
    itemType: string;
    responseType: string;
    prompt?: string;
    instruction?: string;
    order: number;
    baseScore?: number;
    timeLimitSeconds?: number;
    required?: boolean;
    confidential?: boolean;
  }) => unwrap<any>(apiClient.post(`/subtests/${subtestId}/items`, payload)),
  updateItem: (itemId: number | string, payload: {
    code: string;
    itemType: string;
    responseType: string;
    prompt?: string;
    instruction?: string;
    order: number;
    baseScore?: number;
    timeLimitSeconds?: number;
    required?: boolean;
    confidential?: boolean;
  }) => unwrap<any>(apiClient.patch(`/items/${itemId}`, payload)),
  deleteItem: (itemId: number | string) => unwrap<void>(apiClient.delete(`/items/${itemId}`)),
  createOption: (itemId: number | string, payload: {
    code: string;
    text?: string;
    order: number;
    ordinalValue?: number;
  }) => unwrap<any>(apiClient.post(`/items/${itemId}/options`, payload)),
  updateOption: (optionId: number | string, payload: {
    code: string;
    text?: string;
    order: number;
    ordinalValue?: number;
  }) => unwrap<any>(apiClient.patch(`/options/${optionId}`, payload)),
  deleteOption: (optionId: number | string) => unwrap<void>(apiClient.delete(`/options/${optionId}`)),
  upsertAnswerKey: (itemId: number | string, payload: {
    ruleId?: number | string;
    correctOptionId?: number | string;
    expectedText?: string;
    expectedNumber?: number;
    numericTolerance?: number;
    score?: number;
    requiresManualReview?: boolean;
  }) => unwrap<any>(apiClient.patch(`/items/${itemId}/answer-key`, payload)),
  listUsers: () => unwrap<any[]>(apiClient.get("/users")),
  createUser: (payload: { username: string; email: string; fullName: string; password: string }) =>
    unwrap<any>(apiClient.post("/users", payload)),
  setUserStatus: (id: string, status: "ACTIVO" | "INACTIVO") =>
    unwrap<any>(apiClient.patch(`/users/${id}/status`, { status })),
  listRoles: () => unwrap<any[]>(apiClient.get("/roles")),
  listPermissions: () => unwrap<any[]>(apiClient.get("/permissions")),
  listRolePermissionIds: (roleId: number) => unwrap<number[]>(apiClient.get(`/roles/${roleId}/permissions`)),
  replaceRolePermissions: (roleId: number, permissionIds: number[]) =>
    unwrap<void>(apiClient.put(`/roles/${roleId}/permissions`, { permissionIds })),
  listAudit: (params?: { entity?: string; entityId?: string }) =>
    unwrap<any[]>(apiClient.get("/auditoria", { params })),
  listReports: (params?: { attemptId?: number; resultId?: number; sessionId?: number }) =>
    unwrap<any[]>(apiClient.get("/reports", { params })),
  registerAggregateReport: (payload: {
    type: string;
    format: "PDF" | "XLSX" | "CSV";
    storagePath: string;
    filtersJson?: string;
    sessionId: number;
  }) => unwrap<any>(apiClient.post("/reports/aggregate", payload)),
  getAttemptResult: (attemptId: number | string) => unwrap<any>(apiClient.get(`/attempts/${attemptId}/result`)),
  sendAttemptResult: (attemptId: number | string) => unwrap<any>(apiClient.post(`/attempts/${attemptId}/result/send`)),
  getSessionSummary: (sessionId: number | string) => unwrap<any>(apiClient.get(`/analytics/sessions/${sessionId}/summary`)),
  getDimensionAverages: (sessionId: number | string) =>
    unwrap<any[]>(apiClient.get("/analytics/results", { params: { sessionId } })),
  exportReport: async (params: { type: string; format: "PDF" | "XLSX" | "CSV"; attemptId?: number | string; sessionId?: number | string }) => {
    const response = await apiClient.get("/reports/export", { params, responseType: "blob" });
    const fallback = `${params.type}.${params.format.toLowerCase()}`;
    downloadBlob(filenameFromDisposition(response.headers["content-disposition"], fallback), response.data);
  },
  listItemImages: (itemId: number | string) => unwrap<any[]>(apiClient.get(`/items/${itemId}/images`)),
  listTestImages: (testId: number | string) => unwrap<any[]>(apiClient.get(`/tests/${testId}/images`)),
  listSubtestImages: (subtestId: number | string) => unwrap<any[]>(apiClient.get(`/subtests/${subtestId}/images`)),
  uploadItemImage: (itemId: number | string, payload: { file: File; role: string; altText?: string }) => {
    const form = new FormData();
    form.append("file", payload.file);
    form.append("role", payload.role);
    if (payload.altText) form.append("altText", payload.altText);
    return unwrap<any>(apiClient.post(`/items/${itemId}/images`, form));
  },
  loadItemImageObjectUrl: async (url: string) => {
    const response = await apiClient.get(url, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
  deleteItemImage: (imageId: number | string) => unwrap<void>(apiClient.delete(`/items/images/${imageId}`)),
  listPendingReviews: () => unwrap<any[]>(apiClient.get("/manual-review/pending")),
  resolveManualReview: (reviewId: number | string, payload: { score: number; comment?: string; approved: boolean }) =>
    unwrap<any>(apiClient.put(`/manual-review/${reviewId}`, payload)),
  listBackups: () => unwrap<any[]>(apiClient.get("/backups")),
  generateBackup: () => unwrap<any>(apiClient.post("/backups")),
  downloadBackup: async (fileName: string) => {
    const response = await apiClient.get(`/backups/${encodeURIComponent(fileName)}`, { responseType: "blob" });
    downloadBlob(filenameFromDisposition(response.headers["content-disposition"], fileName), response.data);
  },
  requestBackupRestore: (fileName: string) => unwrap<any>(apiClient.post(`/backups/${encodeURIComponent(fileName)}/restore-requests`)),
  searchGlobal: (q: string) => unwrap<any[]>(apiClient.get("/search", { params: { q } })),
  listNotifications: () => unwrap<any[]>(apiClient.get("/notifications")),
  revokeAssignment: (sessionId: number | string, assignmentId: number | string) =>
    unwrap<any>(apiClient.post(`/sesiones/${sessionId}/asignaciones/${assignmentId}/revocar`)),
  recordSessionIncidence: (sessionId: number | string, payload: { participantId?: string; text: string }) =>
    unwrap<any>(apiClient.post(`/sesiones/${sessionId}/incidencias`, payload)),
};
