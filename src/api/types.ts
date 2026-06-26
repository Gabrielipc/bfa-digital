export interface ApiError {
  code?: string;
  message?: string;
  details?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
  correlationId?: string;
}

// Auth DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  userId: string;
  username: string;
  permissions: string[];
}

export interface MeResponse {
  userId: string;
  username: string;
  permissions: string[];
  roles: string[];
}

// Participant Access DTOs
export interface ParticipantAccessRequest {
  assignmentId: number;
  token: string;
}

export interface ParticipantAccessResponse {
  assignmentId: number;
  participantId: string;
  accessToken: string;
  tokenType: string;
}

// Participant Exam Runner DTOs
export interface StartAttemptRequest {
  assignmentId: number;
  deviceInfo: string;
}

export interface SaveAnswerRequest {
  itemId: number;
  selectedOptionIds: number[];
  textAnswer?: string;
  numericAnswer?: number;
  timeUsedSeconds?: number;
}

export interface FinishRequest {
  timeSeconds: number;
}

// Session Administration DTOs
export interface CreateSessionRequest {
  versionTestId: number;
  code: string;
  name: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  location?: string;
}

export interface SessionSubtestRequest {
  subtestId: number;
  order: number;
  timeLimitSeconds?: number;
  randomizeItems?: boolean;
  randomizeOptions?: boolean;
}

export interface AssignParticipantRequest {
  participantId: string;
  ttlHours?: number;
}

// Participant Admin DTOs
export interface ParticipantRequest {
  code: string;
  firstNames: string;
  lastNames: string;
}

export interface Carrera {
  id?: number;
  codigoCarrera: string;
  nombreCarrera: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface CatalogoSexo {
  id?: number;
  codigo: string;
  nombre: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface Cohorte {
  id?: number;
  codigoCohorte: string;
  nombreCohorte: string;
  anio: number;
  periodo: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface GrupoAcademico {
  id?: number;
  carrera?: Carrera;
  codigoGrupo: string;
  nombreGrupo: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface Participante {
  id?: string;
  codigoParticipante: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  sexo?: CatalogoSexo;
  carrera?: Carrera;
  cohorte?: Cohorte;
  grupoAcademico?: GrupoAcademico;
  estado: "ACTIVO" | "INACTIVO";
  creadoEn?: string;
  actualizadoEn?: string;
}

// Instrument Editor DTOs
export interface TestRequest {
  code: string;
  name: string;
  description?: string;
}

export interface VersionRequest {
  number: string;
  strategyId?: number;
  instructions?: string;
  timeLimitSeconds?: number;
  randomizeSubtests?: boolean;
  randomizeItems?: boolean;
}

export interface SubtestRequest {
  code: string;
  name: string;
  description?: string;
  instructions?: string;
  order: number;
  timeLimitSeconds?: number;
  randomizeItems?: boolean;
  randomizeOptions?: boolean;
  required?: boolean;
  strategyId?: number;
}

export interface OptionRequest {
  code: string;
  text?: string;
  order: number;
  ordinalValue?: number;
}

export interface AnswerKeyRequest {
  ruleId: number;
  correctOptionId: number;
  expectedText?: string;
  expectedNumber?: number;
  numericTolerance?: number;
  score?: number;
  requiresManualReview?: boolean;
}

export interface ScoringRuleRequest {
  strategyId: number;
  ruleType: "CLAVE_ITEM" | "OPCION_DIMENSION" | "LIKERT" | "NUMERICA_RANGO" | "REVISION_MANUAL" | "RUBRICA" | "FORMULA";
  itemId?: number;
  priority?: number;
  parametersJson?: string;
  observation?: string;
}

export interface BaremoRequest {
  versionId: number;
  dimensionId: number;
  code: string;
  name: string;
  description?: string;
  normativeGroup?: string;
}

export interface BaremoRangeRequest {
  minScore: number;
  maxScore: number;
  percentile: number;
  category: string;
  interpretation?: string;
  recommendation?: string;
  order: number;
}

export interface ReportRequest {
  type: string;
  format: "PDF" | "XLSX" | "CSV";
  storagePath: string;
  filtersJson?: string;
  attemptId?: number;
  resultId?: number;
  sessionId?: number;
}
