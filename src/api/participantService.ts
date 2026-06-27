import { apiClient } from "./axios";
import { useAuthStore } from "../store/authStore";
import { useEvaluationStore } from "../store/evaluationStore";
import {
  getItemsFromPayload,
  normalizeParticipantEvaluation,
  normalizeParticipantItem,
  parseParticipantAccessCode,
  ParticipantEvaluationAccessDTO,
  ParticipantItemDTO,
  resolveSubtestBySlug,
  sortItemsByOrdinal,
} from "./participantMappers";
import {
  ParticipantAccessRequest,
  ParticipantAccessResponse,
  StartAttemptRequest,
  SaveAnswerRequest,
  FinishRequest,
  ApiResponse,
} from "./types";

export type { ParticipantEvaluationAccessDTO, ParticipantItemDTO } from "./participantMappers";

const toNumericId = (value: string, label: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} invalido: ${value}`);
  }
  return parsed;
};

const getApiMessage = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { data?: { message?: string; error?: { message?: string } } };
    message?: string;
  };

  return candidate.response?.data?.message ||
    candidate.response?.data?.error?.message ||
    candidate.message ||
    fallback;
};

export const participantService = {
  async validateAccess(tokenInput: string): Promise<ParticipantEvaluationAccessDTO> {
    try {
      const { assignmentId, token } = parseParticipantAccessCode(tokenInput);

      const accessResponse = await apiClient.post<ApiResponse<ParticipantAccessResponse>>(
        "/acceso-participante/validar",
        { assignmentId, token } as ParticipantAccessRequest,
      );

      const accessResult = accessResponse.data.data;
      useAuthStore.getState().setToken(accessResult.accessToken);

      const meResponse = await apiClient.get<ApiResponse<unknown>>("/evaluacion-participante/yo");
      const meData = meResponse.data.data;
      const normalized = normalizeParticipantEvaluation(meData, accessResult.assignmentId);

      const attemptRecord = meData && typeof meData === "object" ? meData as Record<string, unknown> : {};
      const attemptId = Number(
        attemptRecord.attemptId ??
        attemptRecord.intentoId ??
        attemptRecord.id,
      );
      if (Number.isInteger(attemptId) && attemptId > 0) {
        useEvaluationStore.getState().setAttemptId(attemptId);
      }

      return {
        ...normalized,
        assignmentId: String(accessResult.assignmentId),
      };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status || 500;
      throw {
        status,
        message: getApiMessage(error, "Codigo de acceso invalido o error del servidor."),
      };
    }
  },

  async getOrCreateAttemptId(): Promise<number> {
    let attemptId = useEvaluationStore.getState().attemptId;
    if (!attemptId) {
      const accessData = useEvaluationStore.getState().accessData;
      if (accessData?.assignmentId) {
        const attemptResponse = await apiClient.post<ApiResponse<unknown>>(
          "/evaluacion-participante/iniciar",
          {
            assignmentId: toNumericId(accessData.assignmentId, "assignmentId"),
            deviceInfo: "Browser",
          } as StartAttemptRequest,
        );
        const attempt = attemptResponse.data.data as Record<string, unknown>;
        attemptId = Number(attempt?.id ?? attempt?.attemptId ?? attempt?.intentoId);
        if (Number.isInteger(attemptId) && attemptId > 0) {
          useEvaluationStore.getState().setAttemptId(attemptId);
        }
      }
    }
    if (!attemptId) {
      throw new Error("No active attempt ID found");
    }
    return attemptId;
  },

  async startAttempt(assignmentId: number, deviceInfo: string = "Browser"): Promise<number> {
    const response = await apiClient.post<ApiResponse<unknown>>(
      "/evaluacion-participante/iniciar",
      { assignmentId, deviceInfo } as StartAttemptRequest,
    );
    const attempt = response.data.data as Record<string, unknown>;
    return Number(attempt?.id ?? attempt?.attemptId ?? attempt?.intentoId);
  },

  async startSubtest(_token: string, subtestSlug: string): Promise<void> {
    const attemptId = await this.getOrCreateAttemptId();
    const accessData = useEvaluationStore.getState().accessData;
    const subtest = resolveSubtestBySlug(accessData, subtestSlug);

    await apiClient.post(`/intentos/${attemptId}/subtests/${toNumericId(subtest.id, "subtestId")}/iniciar`);
  },

  async getItem(_token: string, subtestSlug: string, itemRouteId: string): Promise<ParticipantItemDTO> {
    const attemptId = await this.getOrCreateAttemptId();
    const accessData = useEvaluationStore.getState().accessData;
    const subtest = resolveSubtestBySlug(accessData, subtestSlug);

    const response = await apiClient.get<ApiResponse<unknown>>(
      `/intentos/${attemptId}/subtests/${toNumericId(subtest.id, "subtestId")}/items`,
    );
    const items = sortItemsByOrdinal(getItemsFromPayload(response.data.data));
    const ordinal = Number(itemRouteId.replace("it-", "")) || 1;
    const rawItem = items[ordinal - 1];

    if (!rawItem) {
      throw new Error(`Reactivo no encontrado: ${itemRouteId}`);
    }

    return normalizeParticipantItem(rawItem, subtestSlug);
  },

  async saveAnswer(_token: string, _subtestSlug: string, itemIdStr: string, optionIdStr: string): Promise<void> {
    const store = useEvaluationStore.getState();
    const itemId = toNumericId(itemIdStr, "itemId");
    const optionId = toNumericId(optionIdStr, "optionId");

    const answerRequest: SaveAnswerRequest = {
      itemId,
      selectedOptionIds: [optionId],
      timeUsedSeconds: 1,
    };

    if (!navigator.onLine || store.isOffline) {
      store.addToQueue(answerRequest);
      store.setOffline(true);
      return;
    }

    try {
      const attemptId = await this.getOrCreateAttemptId();
      await apiClient.put(`/intentos/${attemptId}/items/${itemId}/respuesta`, answerRequest);
      store.setOffline(false);
    } catch (error: unknown) {
      const candidate = error as { code?: string; response?: unknown };
      const isNetworkError = candidate.code === "ERR_NETWORK" || !candidate.response;
      if (isNetworkError) {
        store.addToQueue(answerRequest);
        store.setOffline(true);
      } else {
        throw error;
      }
    }
  },

  async syncPendingAnswers(_token: string): Promise<void> {
    const store = useEvaluationStore.getState();
    const queue = store.syncQueue;

    if (!queue || queue.length === 0) {
      store.setOffline(false);
      return;
    }

    try {
      const attemptId = await this.getOrCreateAttemptId();
      await apiClient.post(`/intentos/${attemptId}/respuestas/bulk-sync`, queue);
      store.clearQueue();
      store.setOffline(false);
    } catch {
      store.setOffline(true);
    }
  },

  async finishSubtest(_token: string, subtestSlug: string, timeUsedSeconds: number = 0): Promise<void> {
    const attemptId = await this.getOrCreateAttemptId();
    const accessData = useEvaluationStore.getState().accessData;
    const subtest = resolveSubtestBySlug(accessData, subtestSlug);

    await apiClient.post(
      `/intentos/${attemptId}/subtests/${toNumericId(subtest.id, "subtestId")}/finalizar`,
      { timeSeconds: timeUsedSeconds } as FinishRequest,
    );
  },

  async finishEvaluation(_token: string, timeUsedSeconds: number = 0): Promise<void> {
    const attemptId = await this.getOrCreateAttemptId();
    await apiClient.post(`/intentos/${attemptId}/finalizar`, {
      timeSeconds: timeUsedSeconds,
    } as FinishRequest);
  },
};
