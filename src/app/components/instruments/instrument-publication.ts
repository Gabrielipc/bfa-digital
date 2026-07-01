import type {
  AnswerKeyDTO,
  BaremoDTO,
  BaremoRangeDTO,
  ItemDTO,
  OptionDTO,
  SubtestDTO,
  TestPsicologicoDTO,
  VersionTestDTO,
} from "../../../api/types";

const optionResponseTypes = ["OPCION_UNICA", "OPCION_MULTIPLE", "VERDADERO_FALSO"];

export type PublicationChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
};

export type PublicationChecklist = {
  ready: boolean;
  items: PublicationChecklistItem[];
};

export type PublicationItem = ItemDTO & {
  options?: OptionDTO[];
  answerKey?: AnswerKeyDTO | null;
};

export type PublicationSubtest = SubtestDTO & {
  items?: PublicationItem[];
};

export type PublicationChecklistInput = {
  test: TestPsicologicoDTO | null;
  version: VersionTestDTO | null;
  subtests: PublicationSubtest[];
  baremo: BaremoDTO | null;
  baremoRanges: BaremoRangeDTO[];
  hasUnsavedChanges?: boolean;
};

export type BaremoRangeDraftLike = {
  id?: number;
  minScore?: number | string;
  maxScore?: number | string;
  percentile?: number | string;
  category?: string;
  interpretation?: string;
  recommendation?: string;
  order?: number;
  puntajeMinimo?: number | string;
  puntajeMaximo?: number | string;
  percentil?: number | string;
  categoria?: string;
  interpretacion?: string;
  recomendacion?: string;
  orden?: number;
};

export type NormalizedBaremoRange = {
  id?: number;
  minScore: number;
  maxScore: number;
  percentile?: number;
  category: string;
  interpretation?: string;
  recommendation?: string;
  order: number;
};

export function buildPublicationChecklist(input: PublicationChecklistInput): PublicationChecklist {
  const items = [
    checklistItem(
      "test-identity",
      "Test con codigo y nombre",
      !!input.test?.codigoTest?.trim() && !!input.test?.nombreTest?.trim(),
      "Complete los datos principales del test.",
    ),
    checklistItem(
      "version-instructions",
      "Version con instrucciones",
      !!input.version?.numeroVersion?.trim() && !!input.version?.instruccionesGenerales?.trim(),
      "Guarde numero de version e instrucciones generales.",
    ),
    checklistItem(
      "subtests-present",
      "Subtests configurados",
      input.subtests.length > 0,
      "Agregue al menos un subtest.",
    ),
    checklistItem(
      "subtests-items",
      "Cada subtest tiene items",
      input.subtests.length > 0 && input.subtests.every((subtest) => (subtest.items ?? []).length > 0),
      "Revise los subtests sin items.",
    ),
    checklistItem(
      "items-response-types",
      "Items con tipos definidos",
      allItems(input.subtests).length > 0 && allItems(input.subtests).every((item) => !!item.tipoItem && !!item.tipoRespuesta),
      "Revise tipo de item y tipo de respuesta.",
    ),
    checklistItem(
      "items-options",
      "Items de opcion con opciones",
      allItems(input.subtests).every((item) => !requiresOptions(item) || (item.options ?? []).length > 0),
      "Agregue opciones a los items de seleccion.",
    ),
    checklistItem(
      "items-keys",
      "Items automaticos con clave",
      allItems(input.subtests).every((item) => hasAnswerKeyOrManualReview(item)),
      "Configure clave o revision manual por item.",
    ),
    checklistItem(
      "items-scores",
      "Puntajes definidos",
      allItems(input.subtests).every((item) => hasScore(item)),
      "Complete puntaje base o puntaje de clave.",
    ),
    checklistItem(
      "baremo-present",
      "Baremo general creado",
      !!input.baremo?.codigoBaremo?.trim() && !!input.baremo?.nombre?.trim(),
      "Cree el baremo general de la version.",
    ),
    checklistItem(
      "baremo-ranges",
      "Baremo con rangos validos",
      normalizeBaremoRanges(input.baremoRanges).errors.length === 0,
      "Agregue al menos un rango valido al baremo.",
    ),
    checklistItem(
      "no-unsaved-changes",
      "Sin cambios pendientes",
      !input.hasUnsavedChanges,
      "Guarde la cabecera, orden, items y baremo antes de publicar.",
    ),
  ];

  return {
    ready: items.every((item) => item.complete),
    items,
  };
}

export function normalizeBaremoRanges(rangeDrafts: BaremoRangeDraftLike[]): {
  ranges: NormalizedBaremoRange[];
  errors: string[];
} {
  if (rangeDrafts.length === 0) {
    return { ranges: [], errors: ["Agregue al menos un rango de baremo."] };
  }

  const errors: string[] = [];
  const ranges = rangeDrafts
    .map((range, index) => {
      const minScore = numberValue(range.minScore ?? range.puntajeMinimo);
      const maxScore = numberValue(range.maxScore ?? range.puntajeMaximo);
      const percentile = optionalNumberValue(range.percentile ?? range.percentil);
      const category = stringValue(range.category ?? range.categoria);
      const normalized = {
        id: range.id,
        minScore,
        maxScore,
        percentile,
        category,
        interpretation: stringValue(range.interpretation ?? range.interpretacion),
        recommendation: stringValue(range.recommendation ?? range.recomendacion),
        order: range.order ?? range.orden ?? index + 1,
      };

      if (!Number.isFinite(minScore)) {
        errors.push(`El rango ${index + 1} requiere puntaje minimo.`);
      }
      if (!Number.isFinite(maxScore)) {
        errors.push(`El rango ${index + 1} requiere puntaje maximo.`);
      }
      if (Number.isFinite(minScore) && Number.isFinite(maxScore) && minScore > maxScore) {
        errors.push(`El rango ${index + 1} tiene puntaje minimo mayor que puntaje maximo.`);
      }
      if (!category) {
        errors.push(`El rango ${index + 1} requiere categoria.`);
      }

      return normalized;
    })
    .sort((a, b) => a.order - b.order || a.minScore - b.minScore);

  return { ranges, errors };
}

function checklistItem(id: string, label: string, complete: boolean, detail: string): PublicationChecklistItem {
  return { id, label, complete, detail };
}

function allItems(subtests: PublicationSubtest[]) {
  return subtests.flatMap((subtest) => subtest.items ?? []);
}

function requiresOptions(item: PublicationItem) {
  return optionResponseTypes.includes(item.tipoRespuesta);
}

function hasAnswerKeyOrManualReview(item: PublicationItem) {
  if (item.answerKey?.requiereRevisionManual) return true;
  if (item.tipoRespuesta === "TEXTO_ABIERTO") return item.answerKey?.requiereRevisionManual === true;
  if (item.tipoRespuesta === "NUMERICA") return !!item.answerKey;
  if (requiresOptions(item)) return !!item.answerKey?.opcionCorrectaId;
  return true;
}

function hasScore(item: PublicationItem) {
  const keyScore = item.answerKey?.puntaje;
  const baseScore = item.puntajeBase;
  return (
    (typeof keyScore === "number" && Number.isFinite(keyScore)) ||
    (typeof baseScore === "number" && Number.isFinite(baseScore))
  );
}

function numberValue(value: string | number | undefined) {
  if (value === undefined || value === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function optionalNumberValue(value: string | number | undefined) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringValue(value: string | undefined) {
  return value?.trim() ?? "";
}
