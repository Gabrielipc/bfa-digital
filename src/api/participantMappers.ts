export type ParticipantSessionStatus = "ACTIVA" | "PAUSADA" | "CERRADA" | "VENCIDA";
export type ParticipantAttemptStatus = "NO_INICIADO" | "EN_PROGRESO" | "FINALIZADO";
export type ParticipantSubtestStatus = "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO" | "BLOQUEADO";
export type ParticipantResourceKind = "IMAGE" | "TEXT";

export interface ParticipantResourceDTO {
  id: string;
  kind: ParticipantResourceKind;
  url?: string;
  text?: string;
  altText?: string;
}

export interface ParticipantOptionDTO {
  id: string;
  label?: string;
  text?: string;
  resources: ParticipantResourceDTO[];
}

export interface ParticipantItemDTO {
  itemId: string;
  subtestId: string;
  ordinal: number;
  prompt?: string;
  instruction?: string;
  resources: ParticipantResourceDTO[];
  options: ParticipantOptionDTO[];
  selectedOptionId?: string;
}

export interface ParticipantSubtestDTO {
  id: string;
  slug: string;
  name: string;
  instructionsAvailable: boolean;
  status: ParticipantSubtestStatus;
  totalItems: number;
  answeredItems: number;
  timeLimitSeconds?: number;
  instructions?: string;
  description?: string;
}

export interface ParticipantEvaluationAccessDTO {
  assignmentId: string;
  participantDisplayName?: string;
  sessionName: string;
  sessionStatus: ParticipantSessionStatus;
  attemptStatus: ParticipantAttemptStatus;
  allowedActions: string[];
  subtests: ParticipantSubtestDTO[];
}

export interface ParsedParticipantAccessCode {
  assignmentId: number;
  token: string;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const firstValue = (record: UnknownRecord, keys: string[]): unknown => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
};

const asString = (value: unknown, fallback = ""): string => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const asOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
};

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatus = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => {
  const normalized = asString(value, fallback).toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
};

const slugify = (value: string): string => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "subtest";
};

export function parseParticipantAccessCode(input: string): ParsedParticipantAccessCode {
  const trimmed = input.trim();
  const separatorIndex = trimmed.indexOf("-");
  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
    throw new Error("El codigo de acceso debe tener el formato assignmentId-token.");
  }

  const assignmentPart = trimmed.slice(0, separatorIndex);
  const token = trimmed.slice(separatorIndex + 1).trim();
  const assignmentId = Number(assignmentPart);

  if (!Number.isInteger(assignmentId) || assignmentId <= 0 || !token) {
    throw new Error("El codigo de acceso debe iniciar con un assignmentId numerico valido.");
  }

  return { assignmentId, token };
}

const getAbsoluteUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) {
    return url;
  }
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");
  const cleanUrl = url.replace(/^\/+/, "");
  return `${apiBase}/${cleanUrl}`;
};

export function normalizeResource(raw: unknown, index = 0): ParticipantResourceDTO | null {
  const record = asRecord(raw);
  const urlRaw = asOptionalString(firstValue(record, [
    "url",
    "publicUrl",
    "signedUrl",
    "rutaPublica",
    "rutaAlmacenamiento",
    "storageUrl",
    "downloadUrl",
    "path",
    "ruta",
    "src"
  ]));
  const text = asOptionalString(firstValue(record, ["text", "texto", "content", "contenido", "value", "valor"]));
  const mimeType = asString(firstValue(record, ["mimeType", "contentType", "tipoMime"])).toLowerCase();
  const rawKind = asString(firstValue(record, ["kind", "type", "tipo", "resourceType", "role"])).toUpperCase();
  const kind: ParticipantResourceKind =
    rawKind.includes("TEXT") || rawKind.includes("TEXTO") || (!urlRaw && text && !mimeType.startsWith("image/"))
      ? "TEXT"
      : "IMAGE";

  const url = getAbsoluteUrl(urlRaw);

  if (kind === "IMAGE" && !url) return null;
  if (kind === "TEXT" && !text && !url) return null;

  return {
    id: asString(firstValue(record, ["id", "resourceId", "imagenId"]), `resource-${index + 1}`),
    kind,
    url,
    text,
    altText: asOptionalString(firstValue(record, ["altText", "textoAlternativo", "descripcion", "description"])),
  };
}

const collectResources = (record: UnknownRecord): ParticipantResourceDTO[] => {
  const candidates = [
    ...asArray(record.resources),
    ...asArray(record.imagenes),
    ...asArray(record.images),
    ...asArray(record.media),
  ];

  const hasDirectResourceField = [
    "url", "publicUrl", "signedUrl", "rutaPublica", "rutaAlmacenamiento",
    "storageUrl", "downloadUrl", "path", "ruta", "src",
    "kind", "type", "tipo", "resourceType", "mimeType", "contentType", "tipoMime"
  ].some((key) => record[key] !== undefined && record[key] !== null && record[key] !== "");
  const directResource = hasDirectResourceField ? normalizeResource(record, candidates.length) : null;
  const normalized = candidates
    .map((resource, index) => normalizeResource(resource, index))
    .filter((resource): resource is ParticipantResourceDTO => Boolean(resource));

  if (normalized.length === 0 && directResource && (directResource.url || directResource.text)) {
    return [directResource];
  }

  return normalized;
};

const getOrdinal = (record: UnknownRecord, fallback: number): number =>
  asNumber(firstValue(record, ["ordinal", "order", "numeroOrden", "orden", "position", "posicion"]), fallback);

const normalizeOption = (raw: unknown, index: number): ParticipantOptionDTO => {
  const record = asRecord(raw);
  return {
    id: asString(firstValue(record, ["optionId", "id", "opcionId"])),
    label: asOptionalString(firstValue(record, ["label", "code", "codigoOpcion", "codigo", "letter"])),
    text: asOptionalString(firstValue(record, ["text", "textoOpcion", "texto", "description", "descripcion"])),
    resources: collectResources(record),
  };
};

export function normalizeParticipantItem(raw: unknown, subtestSlug: string): ParticipantItemDTO {
  const record = asRecord(raw);
  const ordinal = getOrdinal(record, 1);
  const options = asArray(firstValue(record, ["options", "opciones", "respuestas"]))
    .map((option, index) => normalizeOption(option, index))
    .filter((option) => option.id);

  const selectedOption = firstValue(record, [
    "selectedOptionId",
    "opcionSeleccionadaId",
    "selectedOption",
    "respuestaSeleccionada",
  ]);

  return {
    itemId: asString(firstValue(record, ["itemId", "id", "reactivoId"])),
    subtestId: subtestSlug,
    ordinal,
    prompt: asOptionalString(firstValue(record, ["prompt", "enunciado", "statement", "texto"])),
    instruction: asOptionalString(firstValue(record, ["instruction", "instruccion", "instrucciones"])),
    resources: collectResources(record),
    options,
    selectedOptionId: selectedOption === undefined || selectedOption === null
      ? undefined
      : asString(asRecord(selectedOption).id ?? selectedOption),
  };
}

export function normalizeParticipantEvaluation(
  raw: unknown,
  assignmentId: number | string,
): ParticipantEvaluationAccessDTO {
  const record = asRecord(raw);
  const participant = asRecord(firstValue(record, ["participante", "participant"]));
  const session = asRecord(firstValue(record, ["session", "sesion"]));
  const subtests = asArray(record.subtests).map((rawSubtest, index) => {
    const subtest = asRecord(rawSubtest);
    const id = asString(firstValue(subtest, ["id", "subtestId", "subtest_id"]));
    const code = asString(firstValue(subtest, ["slug", "codigoSubtest", "code", "codigo"]), id || `subtest-${index + 1}`);
    const name = asString(firstValue(subtest, ["name", "nombreSubtest", "nombre"]), `Subtest ${index + 1}`);
    const slugBase = slugify(code);

    return {
      id,
      slug: id ? `${slugBase}-${id}` : slugBase,
      name,
      instructionsAvailable: Boolean(
        firstValue(subtest, ["instructionsAvailable", "instruccionesDisponibles"]) ??
        firstValue(subtest, ["instructions", "instrucciones"])
      ),
      status: normalizeStatus(
        firstValue(subtest, ["status", "estado"]),
        ["NO_INICIADO", "EN_PROGRESO", "COMPLETADO", "BLOQUEADO"] as const,
        "NO_INICIADO",
      ),
      totalItems: asNumber(firstValue(subtest, ["totalItems", "cantidadItems", "itemsCount"]), asArray(subtest.items).length),
      answeredItems: asNumber(firstValue(subtest, ["answeredItems", "itemsRespondidos", "respondidos"]), 0),
      timeLimitSeconds: asNumber(firstValue(subtest, ["timeLimitSeconds", "tiempoLimiteSegundos"]), 0) || undefined,
      instructions: asOptionalString(firstValue(subtest, ["instructions", "instrucciones"])),
      description: asOptionalString(firstValue(subtest, ["description", "descripcion"])),
    };
  });

  const firstName = asString(firstValue(participant, ["nombres", "firstNames", "firstName"]));
  const lastName = asString(firstValue(participant, ["apellidos", "lastNames", "lastName"]));
  const participantDisplayName = asOptionalString(firstValue(record, ["participantDisplayName", "participantName"])) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Participante";

  return {
    assignmentId: asString(firstValue(record, ["assignmentId", "asignacionId"]), asString(assignmentId)),
    participantDisplayName,
    sessionName: asString(firstValue(record, ["sessionName", "sesionNombre"]) ?? firstValue(session, ["name", "nombre"]), "Sesion UAM"),
    sessionStatus: normalizeStatus(
      firstValue(record, ["sessionStatus", "estadoSesion"]) ?? firstValue(session, ["status", "estado"]),
      ["ACTIVA", "PAUSADA", "CERRADA", "VENCIDA"] as const,
      "ACTIVA",
    ),
    attemptStatus: normalizeStatus(
      firstValue(record, ["attemptStatus", "estadoIntento", "status", "estado"]),
      ["NO_INICIADO", "EN_PROGRESO", "FINALIZADO"] as const,
      "NO_INICIADO",
    ),
    allowedActions: asArray(record.allowedActions).map(String),
    subtests,
  };
}

export function resolveSubtestBySlug(
  accessData: ParticipantEvaluationAccessDTO | null | undefined,
  slug: string,
): ParticipantSubtestDTO {
  const subtest = accessData?.subtests.find((candidate) => candidate.slug === slug || candidate.id === slug);
  if (!subtest) {
    throw new Error(`Subtest no encontrado: ${slug}`);
  }
  if (!subtest.id) {
    throw new Error(`Subtest sin id real de backend: ${slug}`);
  }
  return subtest;
}

export function getItemsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  return asArray(firstValue(record, ["items", "reactivos", "data"]));
}

export function sortItemsByOrdinal(items: unknown[]): unknown[] {
  return [...items].sort((a, b) => getOrdinal(asRecord(a), 0) - getOrdinal(asRecord(b), 0));
}
