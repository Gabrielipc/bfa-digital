import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/axios';

export interface Participant {
  id: string; // UUID string
  name: string;
  age: number;
  sex: 'F' | 'M' | 'O';
  carrera: string;
  grupo: string;
  registeredAt: string;
  latestAttemptStatus: string;
}

export interface Session {
  id: string; // numeric ID as string
  code: string;
  name: string;
  group: string;
  date: string;
  time: string;
  location: string;
  applicator: string;
  status: 'PLANIFICADA' | 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
  subtests: string[]; // subtest codes
}

export interface SessionAssignment {
  participantId: string;
  participantName: string;
  token: string;
  status: 'GENERADO' | 'ACTIVO' | 'VENCIDO' | 'REVOCADO';
  currentSubtestId: string; // id o '—'
  overallProgress: number; // 0 a 100
  state: 'no-iniciado' | 'en-progreso' | 'completado' | 'interrumpido' | 'anulado';
  lastActivity: string;
  assignmentId: number;
}

export interface Incidence {
  id: string;
  sessionId: string;
  participantId: string;
  participantName: string;
  timestamp: string;
  text: string;
}

interface AdminState {
  participants: Participant[];
  sessions: Session[];
  assignments: Record<string, SessionAssignment[]>; // sessionId -> assignments
  incidences: Incidence[];
  generatedTokens: Record<string, string>; // assignmentId -> rawToken
  publishedVersions: any[];
  versionSubtests: Record<string, any[]>;
  simulationActive: Record<string, boolean>;
  loading: boolean;
  error: string | null;

  fetchParticipants: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchAssignments: (sessionId: string) => Promise<void>;
  fetchPublishedVersions: () => Promise<void>;
  fetchVersionSubtests: (versionId: string) => Promise<void>;
  addParticipant: (participant: { code: string; firstNames: string; lastNames: string }) => Promise<void>;
  createSession: (
    sessionData: {
      versionTestId: number;
      code: string;
      name: string;
      description?: string;
      scheduledStart: string;
      scheduledEnd: string;
      location?: string;
    },
    subtestConfigs: {
      subtestId: number;
      order: number;
      timeLimitSeconds: number;
      randomizeItems: boolean;
      randomizeOptions: boolean;
    }[],
    participantIds: string[]
  ) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: Session['status']) => Promise<void>;
  assignParticipantToSession: (sessionId: string, participantId: string) => Promise<void>;
  updateAssignmentStatus: (sessionId: string, participantId: string, status: SessionAssignment['status']) => Promise<void>;
  addIncidence: (sessionId: string, participantId: string, text: string) => void;
  setSimulationActive: (sessionId: string, active: boolean) => void;
  tickSimulation: (sessionId: string) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      participants: [],
      sessions: [],
      assignments: {},
      incidences: [],
      generatedTokens: {},
      publishedVersions: [],
      versionSubtests: {},
      simulationActive: {},
      loading: false,
      error: null,

      fetchParticipants: async () => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/participantes');
          if (res.data.success) {
            const mapped = res.data.data.map((p: any) => ({
              id: p.id,
              name: `${p.nombres} ${p.apellidos}`,
              age: p.fechaNacimiento ? new Date().getFullYear() - new Date(p.fechaNacimiento).getFullYear() : 21,
              sex: p.sexo?.codigo || 'F',
              carrera: p.carrera?.nombreCarrera || 'Psicología',
              grupo: p.grupoAcademico?.nombreGrupo || '3A',
              registeredAt: p.creadoEn ? p.creadoEn.split('T')[0] : new Date().toISOString().split('T')[0],
              latestAttemptStatus: p.estado || 'NO_INICIADO',
            }));
            set({ participants: mapped, loading: false });
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchSessions: async () => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/sesiones');
          if (res.data.success) {
            const mapped = res.data.data.map((s: any) => {
              let status: Session['status'] = 'PLANIFICADA';
              if (s.estado === 'ABIERTA') status = 'ACTIVA';
              if (s.estado === 'CERRADA') status = 'FINALIZADA';
              if (s.estado === 'CANCELADA') status = 'PAUSADA';

              return {
                id: String(s.id),
                code: s.codigoSesion,
                name: s.nombreSesion || s.codigoSesion,
                group: 'BFA - General',
                date: s.inicioProgramado ? s.inicioProgramado.split('T')[0] : '',
                time: s.inicioProgramado ? s.inicioProgramado.split('T')[1]?.slice(0, 5) : '',
                location: s.ubicacion || 'Virtual',
                applicator: 'Aplicador',
                status,
                subtests: ['figuras', 'desplazamiento', 'espacial']
              };
            });
            set({ sessions: mapped, loading: false });
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchAssignments: async (sessionId: string) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.get(`/sesiones/${sessionId}/asignaciones`);
          if (res.data.success) {
            const localTokens = get().generatedTokens || {};
            const mapped: SessionAssignment[] = res.data.data.map((a: any) => {
              const assignmentId = String(a.assignmentId);
              let rawToken = localTokens[assignmentId];
              if (!rawToken || rawToken.includes("undefined")) {
                rawToken = `${assignmentId}-***`;
              }

              return {
                participantId: a.participantId,
                participantName: a.participantName,
                token: rawToken,
                status: a.status as SessionAssignment['status'],
                currentSubtestId: a.currentSubtestId || '—',
                overallProgress: a.overallProgress || 0,
                state: a.state as SessionAssignment['state'],
                lastActivity: a.lastActivity ? (a.lastActivity.includes('T') ? a.lastActivity.split('T')[1].slice(0, 5) : a.lastActivity) : 'Nunca',
                assignmentId: a.assignmentId
              };
            });
            set((state) => ({
              assignments: {
                ...state.assignments,
                [sessionId]: mapped
              },
              loading: false
            }));
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchPublishedVersions: async () => {
        try {
          const res = await apiClient.get('/tests/1/versions');
          if (res.data.success) {
            const published = res.data.data.filter((v: any) => v.estado === 'PUBLICADO');
            set({ publishedVersions: published });
          }
        } catch (err) {
          console.error('Error fetching versions:', err);
        }
      },

      fetchVersionSubtests: async (versionId: string) => {
        try {
          const res = await apiClient.get(`/test-versions/${versionId}/subtests`);
          if (res.data.success) {
            set((state) => ({
              versionSubtests: {
                ...state.versionSubtests,
                [versionId]: res.data.data
              }
            }));
          }
        } catch (err) {
          console.error('Error fetching subtests:', err);
        }
      },

      addParticipant: async (p) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.post('/participantes', p);
          if (res.data.success) {
            await get().fetchParticipants();
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      createSession: async (sessionData, subtestConfigs, participantIds) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.post('/sesiones', sessionData);
          if (!res.data.success) throw new Error(res.data.message);
          const newSession = res.data.data;
          const sessionId = newSession.id;

          await apiClient.put(`/sesiones/${sessionId}/subtests`, subtestConfigs);

          const newTokens: Record<string, string> = { ...get().generatedTokens };
          for (const pId of participantIds) {
            const assignRes = await apiClient.post(`/sesiones/${sessionId}/asignaciones`, {
              participantId: pId
            });
            if (assignRes.data.success) {
              const assigned = assignRes.data.data;
              const assignmentId = String(assigned.assignmentId);
              newTokens[assignmentId] = `${assignmentId}-${assigned.rawToken}`;
            }
          }

          set({ generatedTokens: newTokens });
          await get().fetchSessions();
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updateSessionStatus: async (sessionId, status) => {
        set({ loading: true, error: null });
        try {
          let url = `/sesiones/${sessionId}/activar`;
          if (status === 'PAUSADA') url = `/sesiones/${sessionId}/cancelar`;
          if (status === 'FINALIZADA') url = `/sesiones/${sessionId}/cerrar`;
          
          const res = await apiClient.post(url);
          if (res.data.success) {
            await get().fetchSessions();
            await get().fetchAssignments(sessionId);
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      assignParticipantToSession: async (sessionId, participantId) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.post(`/sesiones/${sessionId}/asignaciones`, {
            participantId
          });
          if (res.data.success) {
            const assigned = res.data.data;
            const assignmentId = String(assigned.assignmentId);
            const newTokens = {
              ...get().generatedTokens,
              [assignmentId]: `${assignmentId}-${assigned.rawToken}`
            };
            set({ generatedTokens: newTokens });
            await get().fetchAssignments(sessionId);
          } else {
            throw new Error(res.data.message);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      updateAssignmentStatus: async (sessionId, participantId, status) => {
        set((state) => {
          const sessionAsgs = state.assignments[sessionId] || [];
          const updated = sessionAsgs.map((a) => {
            if (a.participantId === participantId) {
              return {
                ...a,
                status,
                state: status === 'REVOCADO' ? 'anulado' as const : a.state
              };
            }
            return a;
          });
          return {
            assignments: {
              ...state.assignments,
              [sessionId]: updated
            }
          };
        });
      },

      addIncidence: (sessionId, participantId, text) => {
        const participantName = get().participants.find(p => p.id === participantId)?.name || 'Participante';
        const newIncidence: Incidence = {
          id: `inc-${Date.now()}`,
          sessionId,
          participantId,
          participantName,
          timestamp: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
          text
        };
        set((state) => ({
          incidences: [newIncidence, ...state.incidences]
        }));
      },

      setSimulationActive: (sessionId, active) => {
        set((state) => ({
          simulationActive: {
            ...state.simulationActive,
            [sessionId]: active
          }
        }));
      },

      tickSimulation: () => {}
    }),
    {
      name: 'bfa-digital-admin-storage',
      partialize: (state) => ({
        generatedTokens: state.generatedTokens,
        incidences: state.incidences
      })
    }
  )
);
