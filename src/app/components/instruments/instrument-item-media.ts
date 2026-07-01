import type { TipoItem } from "../../../api/types";

type ImageDraftLike = {
  file: unknown | null;
  altText: string;
  existingId?: number;
  existingUrl?: string;
};

type ItemWithImageDrafts = {
  image: ImageDraftLike;
  options: { image: ImageDraftLike }[];
};

type ItemWithOptionText = {
  options: { text: string }[];
};

const imageItemTypes: TipoItem[] = [
  "SOLO_IMAGEN",
  "TEXTO_E_IMAGEN",
  "COMPARACION_IMAGENES",
];

const imageOnlyOptionItemTypes: TipoItem[] = [
  "SOLO_IMAGEN",
  "COMPARACION_IMAGENES",
];

export function itemTypeSupportsImages(itemType: TipoItem | string) {
  return imageItemTypes.includes(itemType as TipoItem);
}

export function itemTypeUsesOptionText(itemType: TipoItem | string) {
  return !imageOnlyOptionItemTypes.includes(itemType as TipoItem);
}

export function withoutImageDrafts<T extends ItemWithImageDrafts>(item: T): T {
  return {
    ...item,
    image: emptyImageDraft(),
    options: item.options.map((option) => ({
      ...option,
      image: emptyImageDraft(),
    })),
  } as T;
}

export function withoutOptionText<T extends ItemWithOptionText>(item: T): T {
  return {
    ...item,
    options: item.options.map((option) => ({
      ...option,
      text: "",
    })),
  };
}

export function existingImageDraft(source: unknown, preferredOrder = 1): ImageDraftLike {
  const image = pickExistingImage(source, preferredOrder);
  if (!image) return emptyImageDraft();

  return {
    file: null,
    altText: stringValue(firstDefined(image, ["textoAlternativo", "altText", "textoAlt", "descripcion"])) ?? "",
    existingId: numberValue(firstDefined(image, ["id", "imagenId", "imageId", "recursoMultimediaId"])),
    existingUrl: stringValue(firstDefined(image, ["url", "publicUrl", "signedUrl", "rutaPublica", "rutaAlmacenamiento"])),
  };
}

export function hasPendingImageUpload<T extends ImageDraftLike>(image: T): image is T & { file: Exclude<T["file"], null> } {
  return !!image.file;
}

function emptyImageDraft() {
  return { file: null, altText: "" };
}

function pickExistingImage(source: unknown, preferredOrder: number) {
  if (!isRecord(source)) return null;
  const candidates = [
    ...arrayValue(source.imagenes),
    ...arrayValue(source.images),
    ...arrayValue(source.recursosMultimedia),
  ].filter(isRecord);
  if (candidates.length === 0) return null;

  return candidates.find((candidate) => {
    const order = numberValue(firstDefined(candidate, ["numeroOrden", "order", "orden"]));
    return order === preferredOrder;
  }) ?? candidates[0];
}

function firstDefined(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
