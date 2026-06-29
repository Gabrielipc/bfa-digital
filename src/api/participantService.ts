import { apiClient } from "./axios";
import { useEvaluationStore } from "../store/evaluationStore";
import { ParticipantEvaluationAccessDTO } from "../routes/evaluacion.$token";
import {
  ParticipantAccessRequest,
  ParticipantAccessResponse,
  StartAttemptRequest,
  SaveAnswerRequest,
  FinishRequest,
  ApiResponse,
  Participante
} from "./types";

export interface ParticipantItemDTO {
  itemId: string;
  subtestId: string;
  ordinal: number;
  prompt?: string;
  instruction?: string;
  resources: Array<{
    id: string;
    kind: "IMAGE" | "TEXT";
    url: string;
    altText?: string;
  }>;
  options: Array<{
    id: string;
    label?: string;
    text?: string;
  }>;
  selectedOptionId?: string;
}

function toBackendSubtestId(subtestId: string): number {
  const parsed = Number(subtestId);
  if (!Number.isNaN(parsed)) return parsed;
  if (subtestId === "figuras") return 1;
  if (subtestId === "desplazamiento") return 2;
  return 3;
}

export const participantService = {
  // 1. Validar acceso con el token
  async validateAccess(tokenInput: string): Promise<ParticipantEvaluationAccessDTO> {
    try {
      // Intentamos parsear "assignmentId-token"
      let assignmentId = 9921; // fallback default
      let token = tokenInput;
      
      if (tokenInput.includes("-")) {
        const parts = tokenInput.split("-");
        const parsedId = parseInt(parts[0]);
        if (!isNaN(parsedId)) {
          assignmentId = parsedId;
          token = parts.slice(1).join("-");
        }
      }

      // Validar acceso del participante
      const accessResponse = await apiClient.post<ApiResponse<ParticipantAccessResponse>>("/acceso-participante/validar", {
        assignmentId,
        token
      } as ParticipantAccessRequest);

      const accessResult = accessResponse.data.data;
      
      // Guardar token de participante separado para no reemplazar la sesión administrativa.
      useEvaluationStore.getState().setParticipantToken(accessResult.accessToken);
      
      // Guardar el assignmentId en el store del examen para usarlo después
      useEvaluationStore.getState().setAccessData({
        assignmentId: String(accessResult.assignmentId),
        sessionName: "Sesión Autorizada BFA",
        sessionStatus: "ACTIVA",
        attemptStatus: "NO_INICIADO",
        allowedActions: ["start"],
        subtests: []
      } as any);

      // Obtener detalles del intento o el perfil del participante con /evaluacion-participante/yo
      const meResponse = await apiClient.get<ApiResponse<any>>("/evaluacion-participante/yo");
      const meData = meResponse.data.data;

      // Guardar el attemptId si ya existe en el backend
      if (meData.id) {
        useEvaluationStore.getState().setAttemptId(meData.id);
      }

      // Retorna DTO compatible mapeando los datos reales de Spring Boot
      return {
        assignmentId: String(accessResult.assignmentId),
        participantDisplayName: meData.participantDisplayName || `${meData.participante?.nombres || "Participante"} ${meData.participante?.apellidos || ""}`.trim(),
        sessionName: meData.sessionName || meData.session?.name || "Sesión UAM",
        sessionStatus: meData.sessionStatus || meData.session?.status || "ACTIVA",
        attemptStatus: meData.attemptStatus || meData.status || "NO_INICIADO",
        allowedActions: ["start"],
        subtests: (meData.subtests || []).map((s: any) => ({
          id: String(s.id || s.subtestId || s.code),
          name: s.name,
          instructionsAvailable: true,
          status: s.status || "NO_INICIADO",
          totalItems: s.items?.length || s.totalItems || 5,
          answeredItems: s.answeredItems || 0,
          timeLimitSeconds: s.timeLimitSeconds || 120
        }))
      };
    } catch (error: any) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || "Código de acceso inválido o error del servidor."
      };
    }
  },

  // Auxiliar para obtener o crear el attemptId desde el store o el backend
  async getOrCreateAttemptId(): Promise<number> {
    let attemptId = useEvaluationStore.getState().attemptId;
    if (!attemptId) {
      const accessData = useEvaluationStore.getState().accessData;
      if (accessData?.assignmentId) {
        const attemptResponse = await apiClient.post<ApiResponse<any>>("/evaluacion-participante/iniciar", {
          assignmentId: parseInt(accessData.assignmentId),
          deviceInfo: "Browser"
        });
        attemptId = attemptResponse.data.data.id;
        if (attemptId) {
          useEvaluationStore.getState().setAttemptId(attemptId);
        }
      }
    }
    if (!attemptId) {
      throw new Error("No active attempt ID found");
    }
    return attemptId;
  },

  // 2. Iniciar el intento oficial
  async startAttempt(assignmentId: number, deviceInfo: string = "Browser"): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<any>>("/evaluacion-participante/iniciar", {
        assignmentId,
        deviceInfo
      } as StartAttemptRequest);
      return response.data.data.id; // Retorna el attemptId real del backend
    } catch (error) {
      throw error;
    }
  },

  // 3. Iniciar subtest
  async startSubtest(token: string, subtestId: string): Promise<void> {
    try {
      const attemptId = await this.getOrCreateAttemptId();
      
      // Mapeo del subtestId al ID numérico del backend
      const subtestIdNum = toBackendSubtestId(subtestId);

      await apiClient.post(`/intentos/${attemptId}/subtests/${subtestIdNum}/iniciar`);
    } catch (error) {
      throw error;
    }
  },

  // 4. Obtener reactivo
  async getItem(token: string, subtestId: string, itemIdStr: string): Promise<ParticipantItemDTO> {
    try {
      const attemptId = await this.getOrCreateAttemptId();
      const subtestIdNum = toBackendSubtestId(subtestId);

      // Obtener todos los reactivos del subtest
      const response = await apiClient.get<ApiResponse<any>>(`/intentos/${attemptId}/subtests/${subtestIdNum}/items`);
      const subtestPayload = response.data.data;
      const items = Array.isArray(subtestPayload) ? subtestPayload : (subtestPayload.items || []);
      
      const ordinal = parseInt(itemIdStr.replace("it-", "")) || 1;
      const realItem = items.find((it: any) => it.order === ordinal) || items[ordinal - 1];

      return {
        itemId: String(realItem.itemId || realItem.id),
        subtestId,
        ordinal: realItem.order,
        prompt: realItem.prompt || "Observe la figura modelo y seleccione la opción idéntica.",
        instruction: realItem.instruction || "",
        resources: realItem.resources || [],
        options: (realItem.options || []).map((o: any) => ({
          id: String(o.optionId || o.id),
          label: o.code,
          text: o.text
        })),
        selectedOptionId: realItem.selectedOptionId ? String(realItem.selectedOptionId) : undefined
      };
    } catch (error) {
      throw error;
    }
  },

  // 5. Guardar respuesta con cola local resiliente
  async saveAnswer(token: string, subtestId: string, itemIdStr: string, optionIdStr: string): Promise<void> {
    const store = useEvaluationStore.getState();
    const itemId = parseInt(itemIdStr);
    const optionId = parseInt(optionIdStr);

    const answerRequest: SaveAnswerRequest = {
      itemId,
      selectedOptionIds: isNaN(optionId) ? [] : [optionId],
      timeUsedSeconds: 1
    };

    // Si detectamos offline previamente o no hay red, encolar de inmediato
    if (!navigator.onLine || store.isOffline) {
      store.addToQueue(answerRequest);
      store.setOffline(true);
      console.warn("Offline: respuesta agregada a la cola local.");
      return;
    }

    try {
      const attemptId = await this.getOrCreateAttemptId();

      await apiClient.put(`/intentos/${attemptId}/items/${itemId}/respuesta`, answerRequest);
      store.setOffline(false);
    } catch (error: any) {
      // Si el error es de red (servidor inalcanzable), encolar localmente
      const isNetworkError = error.code === "ERR_NETWORK" || !error.response;
      if (isNetworkError) {
        store.addToQueue(answerRequest);
        store.setOffline(true);
        console.warn("Error de red: guardando en la cola local temporal.");
      } else {
        throw error;
      }
    }
  },

  // Sincronizar respuestas pendientes de la cola local en batch (bulk sync)
  async syncPendingAnswers(token: string): Promise<void> {
    const store = useEvaluationStore.getState();
    const queue = store.syncQueue;

    if (!queue || queue.length === 0) {
      store.setOffline(false);
      return;
    }

    try {
      const attemptId = await this.getOrCreateAttemptId();

      // Llamada bulk-sync de Swagger
      await apiClient.post(`/intentos/${attemptId}/respuestas/bulk-sync`, queue);
      
      // Limpiar cola si fue exitoso
      store.clearQueue();
      store.setOffline(false);
    } catch (error) {
      store.setOffline(true);
    }
  },

  // 6. Finalizar subtest
  async finishSubtest(token: string, subtestId: string, timeUsedSeconds: number = 0): Promise<void> {
    try {
      const attemptId = await this.getOrCreateAttemptId();
      const subtestIdNum = toBackendSubtestId(subtestId);

      await apiClient.post(`/intentos/${attemptId}/subtests/${subtestIdNum}/finalizar`, {
        timeSeconds: timeUsedSeconds
      } as FinishRequest);
    } catch (error) {
      throw error;
    }
  },

  // 7. Finalizar evaluación
  async finishEvaluation(token: string, timeUsedSeconds: number = 0): Promise<void> {
    try {
      const attemptId = await this.getOrCreateAttemptId();

      await apiClient.post(`/intentos/${attemptId}/finalizar`, {
        timeSeconds: timeUsedSeconds
      } as FinishRequest);
    } catch (error) {
      throw error;
    }
  }
};
