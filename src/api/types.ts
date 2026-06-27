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
  fechaNacimiento?: string;
  sexoId?: number;
  carreraId?: number;
  cohorteId?: number;
  grupoAcademicoId?: number;
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
export type EstadoVersionTest = "BORRADOR" | "APROBADO" | "PUBLICADA" | "HISTORICA";
export type EstadoGeneral = "ACTIVO" | "INACTIVO";
export type EstadoConfiguracion = "BORRADOR" | "APROBADO" | "PUBLICADO" | "INACTIVO";
export type TipoItem =
  | "SOLO_TEXTO"
  | "SOLO_IMAGEN"
  | "TEXTO_E_IMAGEN"
  | "COMPARACION_IMAGENES"
  | "RAZONAMIENTO_VERBAL";
export type TipoRespuesta =
  | "OPCION_UNICA"
  | "OPCION_MULTIPLE"
  | "TEXTO_ABIERTO"
  | "NUMERICA"
  | "VERDADERO_FALSO";
export type TipoReglaCalificacion =
  | "CLAVE_ITEM"
  | "OPCION_DIMENSION"
  | "LIKERT"
  | "NUMERICA_RANGO"
  | "REVISION_MANUAL"
  | "RUBRICA"
  | "FORMULA";

export interface TestPsicologicoDTO {
  id: number;
  codigoTest: string;
  nombreTest: string;
  descripcion?: string;
  estado?: EstadoGeneral;
  creadoEn?: string;
}

export interface VersionTestDTO {
  id: number;
  testId?: number;
  estrategiaCalificacionId?: number;
  numeroVersion: string;
  estado: EstadoVersionTest;
  instruccionesGenerales?: string;
  tiempoLimiteSegundos?: number;
  permiteAleatorizarItems?: boolean;
  permiteAleatorizarSubtests?: boolean;
  creadoEn?: string;
}

export interface EstrategiaCalificacionDTO {
  id: number;
  codigo?: string;
  nombre?: string;
  tipoEstrategia?: string;
  descripcion?: string;
}

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

export interface SubtestDTO {
  id: number;
  versionTestId?: number;
  estrategiaCalificacionId?: number;
  codigoSubtest: string;
  nombreSubtest: string;
  descripcion?: string;
  instrucciones?: string;
  numeroOrden: number;
  tiempoLimiteSegundos?: number;
  permiteAleatorizarItems?: boolean;
  permiteAleatorizarOpciones?: boolean;
  esObligatorio?: boolean;
  estado?: EstadoGeneral;
}

export interface ItemRequest {
  code: string;
  itemType: TipoItem;
  responseType: TipoRespuesta;
  prompt?: string;
  instruction?: string;
  order: number;
  baseScore?: number;
  timeLimitSeconds?: number;
  required?: boolean;
  confidential?: boolean;
}

export interface ItemDTO {
  id: number;
  subtestId?: number;
  codigoItem: string;
  tipoItem: TipoItem;
  tipoRespuesta: TipoRespuesta;
  enunciado?: string;
  instruccion?: string;
  numeroOrden: number;
  puntajeBase?: number;
  tiempoLimiteSegundos?: number;
  esObligatorio?: boolean;
  esConfidencial?: boolean;
  estado?: EstadoGeneral;
  imagenes?: ImageResourceDTO[];
  images?: ImageResourceDTO[];
}

export interface OptionRequest {
  code: string;
  text?: string;
  order: number;
  ordinalValue?: number;
}

export interface OptionDTO {
  id: number;
  itemId?: number;
  codigoOpcion: string;
  textoOpcion?: string;
  numeroOrden: number;
  valorOrdinal?: number;
  estado?: EstadoGeneral;
  imagenes?: ImageResourceDTO[];
  images?: ImageResourceDTO[];
}

export interface ImageResourceDTO {
  id?: number;
  imagenId?: number;
  imageId?: number;
  recursoMultimediaId?: number;
  numeroOrden?: number;
  order?: number;
  orden?: number;
  textoAlternativo?: string;
  altText?: string;
  textoAlt?: string;
  descripcion?: string;
  url?: string;
  publicUrl?: string;
  signedUrl?: string;
  rutaPublica?: string;
  rutaAlmacenamiento?: string;
}

export interface AnswerKeyRequest {
  ruleId: number;
  correctOptionId?: number;
  expectedText?: string;
  expectedNumber?: number;
  numericTolerance?: number;
  score?: number;
  requiresManualReview?: boolean;
}

export interface AnswerKeyDTO {
  id: number;
  reglaCalificacionId?: number;
  itemId?: number;
  opcionCorrectaId?: number;
  textoEsperado?: string;
  valorNumericoEsperado?: number;
  toleranciaNumerica?: number;
  puntaje?: number;
  requiereRevisionManual?: boolean;
}

export interface ScoringRuleRequest {
  strategyId: number;
  ruleType: TipoReglaCalificacion;
  itemId?: number;
  priority?: number;
  parametersJson?: string;
  observation?: string;
}

export interface ScoringRuleDTO {
  id: number;
  versionTestId?: number;
  subtestId?: number;
  itemId?: number;
  estrategiaCalificacionId?: number;
  tipoRegla: TipoReglaCalificacion;
  prioridad: number;
  activa?: boolean;
  estado?: EstadoConfiguracion;
  parametros?: string;
  observacion?: string;
}

export interface BaremoRequest {
  versionId: number;
  dimensionId?: number;
  code: string;
  name: string;
  description?: string;
  normativeGroup?: string;
}

export interface BaremoDTO {
  id: number;
  versionTestId?: number;
  dimensionResultadoId?: number;
  codigoBaremo: string;
  nombre: string;
  descripcion?: string;
  grupoNormativo?: string;
  estado?: EstadoConfiguracion;
}

export interface BaremoRangeRequest {
  minScore: number;
  maxScore: number;
  percentile?: number;
  category: string;
  interpretation?: string;
  recommendation?: string;
  order: number;
}

export interface BaremoRangeDTO {
  id: number;
  baremoId?: number;
  puntajeMinimo: number;
  puntajeMaximo: number;
  percentil?: number;
  categoria: string;
  interpretacion?: string;
  recomendacion?: string;
  orden: number;
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
