import { Carrera, CatalogoSexo, Cohorte, GrupoAcademico } from "../api/types";
import type { Participant } from "./adminStore";

interface ParticipantCatalogs {
  carreras: Carrera[];
  cohortes: Cohorte[];
  gruposAcademicos: GrupoAcademico[];
  sexos: CatalogoSexo[];
}

const toNumber = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const firstDefined = <T>(...values: (T | undefined | null)[]): T | undefined =>
  values.find((value): value is T => value != null);

const getAge = (fechaNacimiento?: string): number => {
  if (!fechaNacimiento) return 0;
  const birthDate = new Date(fechaNacimiento);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

export function mapParticipant(raw: any, catalogs: ParticipantCatalogs): Participant {
  const carreraId = toNumber(firstDefined(raw.carrera?.id, raw.carreraId, raw.idCarrera));
  const cohorteId = toNumber(firstDefined(raw.cohorte?.id, raw.cohorteId, raw.idCohorte));
  const grupoId = toNumber(firstDefined(raw.grupoAcademico?.id, raw.grupoAcademicoId, raw.grupoId, raw.idGrupoAcademico));
  const sexoId = toNumber(firstDefined(raw.sexo?.id, raw.sexoId, raw.idSexo));

  const carrera = raw.carrera ?? catalogs.carreras.find((item) => item.id === carreraId);
  const cohorte = raw.cohorte ?? catalogs.cohortes.find((item) => item.id === cohorteId);
  const grupo = raw.grupoAcademico ?? catalogs.gruposAcademicos.find((item) => item.id === grupoId);
  const sexo = raw.sexo ?? catalogs.sexos.find((item) => item.id === sexoId);

  return {
    id: raw.id,
    code: raw.codigoParticipante || raw.code || raw.codigo || raw.id,
    name: [raw.nombres || raw.firstNames, raw.apellidos || raw.lastNames].filter(Boolean).join(" ").trim() || raw.nombre || "Participante",
    age: getAge(raw.fechaNacimiento),
    sex: sexo?.codigo || raw.sexoCodigo || raw.sex || "-",
    carreraId,
    carrera: carrera?.nombreCarrera || raw.nombreCarrera || raw.carreraNombre || "-",
    cohorteId,
    cohorte: cohorte?.nombreCohorte || raw.nombreCohorte || raw.cohorteNombre || "Sin cohorte",
    grupoId,
    grupo: grupo?.nombreGrupo || raw.nombreGrupo || raw.grupoNombre || "-",
    registeredAt: raw.creadoEn ? raw.creadoEn.split("T")[0] : "",
    latestAttemptStatus: raw.estado || "NO_INICIADO",
  };
}
