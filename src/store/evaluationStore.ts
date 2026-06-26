import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParticipantEvaluationAccessDTO } from '../routes/evaluacion.$token';
import { SaveAnswerRequest } from '../api/types';

interface EvaluationState {
  accessData: ParticipantEvaluationAccessDTO | null;
  attemptId: number | null;
  timeLeft: number;
  activeSubtestId: string | null;
  answers: Record<string, string>; // subtestId-itemId -> optionId
  
  // Cola local temporal de resiliencia
  syncQueue: SaveAnswerRequest[];
  isOffline: boolean;
  
  setAccessData: (accessData: ParticipantEvaluationAccessDTO | null) => void;
  setAttemptId: (attemptId: number | null) => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setActiveSubtestId: (id: string | null) => void;
  setAnswer: (subtestId: string, itemId: string, optionId: string) => void;
  
  // Manejo de la cola y red
  setOffline: (isOffline: boolean) => void;
  addToQueue: (answer: SaveAnswerRequest) => void;
  clearQueue: () => void;
  clearStore: () => void;
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set, get) => ({
      accessData: null,
      attemptId: null,
      timeLeft: 0,
      activeSubtestId: null,
      answers: {},
      syncQueue: [],
      isOffline: false,

      setAccessData: (accessData) => set({ accessData }),
      
      setAttemptId: (attemptId) => set({ attemptId }),

      setTimeLeft: (time) => set((state) => ({
        timeLeft: typeof time === 'function' ? time(state.timeLeft) : time
      })),

      setActiveSubtestId: (id) => set({ activeSubtestId: id }),

      setAnswer: (subtestId, itemId, optionId) => set((state) => ({
        answers: {
          ...state.answers,
          [`${subtestId}-${itemId}`]: optionId
        }
      })),

      setOffline: (isOffline) => set({ isOffline }),

      addToQueue: (answer) => set((state) => {
        // Evitar duplicados del mismo itemId en la cola, reemplazando el viejo
        const filtered = state.syncQueue.filter(item => item.itemId !== answer.itemId);
        return {
          syncQueue: [...filtered, answer]
        };
      }),

      clearQueue: () => set({ syncQueue: [] }),

      clearStore: () => set({
        accessData: null,
        attemptId: null,
        timeLeft: 0,
        activeSubtestId: null,
        answers: {},
        syncQueue: []
      })
    }),
    {
      name: 'bfa-digital-evaluation-storage', // Persistido en localStorage para sobrevivir caídas de PC
      partialize: (state) => ({
        // Solo persistimos lo crítico de la prueba para no saturar localStorage
        accessData: state.accessData,
        attemptId: state.attemptId,
        timeLeft: state.timeLeft,
        activeSubtestId: state.activeSubtestId,
        answers: state.answers,
        syncQueue: state.syncQueue
      })
    }
  )
);
