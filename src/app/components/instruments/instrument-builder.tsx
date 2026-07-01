import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardCheck,
  Eye,
  GripVertical,
  ImageUp,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { instrumentService } from "../../../api/instrumentService";
import {
  AnswerKeyDTO,
  BaremoDTO,
  BaremoRangeDTO,
  EstrategiaCalificacionDTO,
  ItemDTO,
  OptionDTO,
  ScoringRuleDTO,
  SubtestDTO,
  TestPsicologicoDTO,
  TipoItem,
  TipoReglaCalificacion,
  TipoRespuesta,
  VersionTestDTO,
} from "../../../api/types";
import {
  existingImageDraft,
  hasPendingImageUpload,
  itemTypeSupportsImages,
  itemTypeUsesOptionText,
  withoutImageDrafts,
  withoutOptionText,
} from "./instrument-item-media";
import {
  buildPublicationChecklist,
  normalizeBaremoRanges,
  type PublicationSubtest,
} from "./instrument-publication";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";


const DND_SUBTEST_ROW = "instrument-subtest-row";
const DND_ITEM_ROW = "instrument-item-row";

const itemTypes: { value: TipoItem; label: string }[] = [
  { value: "SOLO_TEXTO", label: "Solo texto" },
  { value: "SOLO_IMAGEN", label: "Solo imagen" },
  { value: "TEXTO_E_IMAGEN", label: "Texto e imagen" },
  { value: "COMPARACION_IMAGENES", label: "Comparacion de imagenes" },
  { value: "RAZONAMIENTO_VERBAL", label: "Razonamiento verbal" },
];

const responseTypes: { value: TipoRespuesta; label: string }[] = [
  { value: "OPCION_UNICA", label: "Opcion unica" },
  { value: "OPCION_MULTIPLE", label: "Opcion multiple" },
  { value: "TEXTO_ABIERTO", label: "Texto abierto" },
  { value: "NUMERICA", label: "Numerica" },
  { value: "VERDADERO_FALSO", label: "Verdadero / falso" },
];

const optionResponseTypes: TipoRespuesta[] = ["OPCION_UNICA", "OPCION_MULTIPLE", "VERDADERO_FALSO"];

type VersionSummary = {
  version: VersionTestDTO;
  test: TestPsicologicoDTO;
};

type InstrumentRow = TestPsicologicoDTO & {
  versions: VersionTestDTO[];
  draftVersion?: VersionTestDTO;
  latestVersion?: VersionTestDTO;
};

type CreateInstrumentForm = {
  code: string;
  name: string;
  description: string;
  versionNumber: string;
  instructions: string;
  timeLimitSeconds: string;
  randomizeItems: boolean;
  randomizeSubtests: boolean;
};

type VersionHeaderForm = {
  number: string;
  instructions: string;
  timeLimitSeconds: string;
  randomizeItems: boolean;
  randomizeSubtests: boolean;
};

type BaremoForm = {
  code: string;
  name: string;
  description: string;
  normativeGroup: string;
};

type BaremoRangeDraft = {
  key: string;
  id?: number;
  minScore: string;
  maxScore: string;
  percentile: string;
  category: string;
  interpretation: string;
  recommendation: string;
  order: number;
};

type SubtestForm = {
  code: string;
  name: string;
  description: string;
  instructions: string;
  timeLimitSeconds: string;
  required: boolean;
  randomizeItems: boolean;
  randomizeOptions: boolean;
};

type OptionDraft = {
  key: string;
  id?: number;
  code: string;
  text: string;
  isCorrect: boolean;
  image: ImageDraft;
};

type ImageDraft = {
  file: File | null;
  altText: string;
  existingId?: number;
  existingUrl?: string;
};

type ItemScoringDraft = {
  useCustomRule: boolean;
  requiresManualReview: boolean;
  score: string;
  existingAnswerKeyId?: number;
  existingRuleId?: number;
};

type ItemDraft = {
  key: string;
  id?: number;
  code: string;
  itemType: TipoItem;
  responseType: TipoRespuesta;
  prompt: string;
  instruction: string;
  baseScore: string;
  timeLimitSeconds: string;
  required: boolean;
  confidential: boolean;
  image: ImageDraft;
  options: OptionDraft[];
  scoring: ItemScoringDraft;
};

let tempCounter = 0;

export function InstrumentBuilderScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [notice, setNotice] = useState<string | null>(null);
  const [versionToCreateFor, setVersionToCreateFor] = useState<InstrumentRow | null>(null);
  const [form, setForm] = useState<CreateInstrumentForm>({
    code: "",
    name: "",
    description: "",
    versionNumber: "v1.0",
    instructions: "",
    timeLimitSeconds: "",
    randomizeItems: false,
    randomizeSubtests: false,
  });

  const strategiesQuery = useQuery({
    queryKey: ["scoring-strategies"],
    queryFn: instrumentService.getStrategies,
  });

  const rowsQuery = useQuery({
    queryKey: ["instrument-index"],
    queryFn: loadInstrumentRows,
  });

  const simpleStrategyId = findSimpleStrategyId(strategiesQuery.data ?? []);
  const testHref = (id: number | string) => `/app/instrumentos/${id}`;
  const goToTest = (id: number | string) => {
    window.location.assign(testHref(id));
  };

  const createInstrument = useMutation({
    mutationFn: async () => {
      const test = await instrumentService.createTest({
        code: form.code.trim(),
        name: form.name.trim(),
        description: blank(form.description),
      });
      const version = await instrumentService.createVersion(test.id, {
        number: form.versionNumber.trim(),
        strategyId: simpleStrategyId,
        instructions: blank(form.instructions),
        timeLimitSeconds: numberOrUndefined(form.timeLimitSeconds),
        randomizeItems: form.randomizeItems,
        randomizeSubtests: form.randomizeSubtests,
      });
      return { test, version };
    },
    onSuccess: ({ test }) => {
      queryClient.invalidateQueries({ queryKey: ["instrument-index"] });
      goToTest(test.id);
    },
  });

  const openVersion = (row: InstrumentRow) => {
    const target = row.draftVersion ?? row.latestVersion;
    if (!target) {
      setNotice("Este test aun no tiene versiones. Cree una version inicial desde Nuevo test.");
      return;
    }
    goToTest(row.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Instrumentos</h2>
          <p className="text-sm text-muted-foreground">
            Gestione tests, versiones, subtests, items y claves desde un flujo unico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/carga-imagenes">
              <ImageUp className="mr-2 h-4 w-4" />
              Imagenes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/revision-manual">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Revision manual
            </Link>
          </Button>
          <Button onClick={() => setMode("create")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo test
          </Button>
        </div>
      </div>

      {notice && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Accion no disponible</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {createInstrument.isError && (
        <Alert className="border-destructive/40 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo crear el test</AlertTitle>
          <AlertDescription>{errorMessage(createInstrument.error)}</AlertDescription>
        </Alert>
      )}

      {mode === "create" ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Nuevo test</CardTitle>
              <CardDescription>
                Cree el test y su primera version en un formulario dedicado. Al guardar se abrira el editor de la version.
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setMode("list")}>Cancelar</Button>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                createInstrument.mutate();
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Codigo">
                  <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
                </Field>
                <Field label="Nombre">
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </Field>
              </div>
              <Field label="Descripcion">
                <Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </Field>
              <Separator />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Version inicial">
                  <Input value={form.versionNumber} onChange={(event) => setForm({ ...form, versionNumber: event.target.value })} required />
                </Field>
                <Field label="Tiempo limite global (seg)">
                  <Input type="number" value={form.timeLimitSeconds} onChange={(event) => setForm({ ...form, timeLimitSeconds: event.target.value })} />
                </Field>
              </div>
              <Field label="Instrucciones generales">
                <Textarea rows={4} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckField
                  label="Permitir aleatorizar subtests"
                  checked={form.randomizeSubtests}
                  onChange={(randomizeSubtests) => setForm({ ...form, randomizeSubtests })}
                />
                <CheckField
                  label="Permitir aleatorizar items"
                  checked={form.randomizeItems}
                  onChange={(randomizeItems) => setForm({ ...form, randomizeItems })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMode("list")}>Volver</Button>
                <Button type="submit" disabled={createInstrument.isPending || !form.code.trim() || !form.name.trim() || !form.versionNumber.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  Crear y configurar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Tests registrados</CardTitle>
              <CardDescription>Seleccione un test para ver o modificar su version borrador.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => rowsQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
          </CardHeader>
          <CardContent>
            {rowsQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Cargando instrumentos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Versiones</TableHead>
                    <TableHead>Ultima version</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rowsQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No hay tests registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rowsQuery.data?.map((row) => {
                      const targetVersion = row.draftVersion ?? row.latestVersion;
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-xs">{row.codigoTest}</TableCell>
                          <TableCell className="font-medium">{row.nombreTest}</TableCell>
                          <TableCell><Badge variant="secondary">{row.estado ?? "ACTIVO"}</Badge></TableCell>
                          <TableCell>{row.versions.length}</TableCell>
                          <TableCell>
                            {row.latestVersion ? (
                              <span className="text-sm">
                                {row.latestVersion.numeroVersion} <span className="text-muted-foreground">({row.latestVersion.estado})</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin versiones</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {targetVersion ? (
                                <>
                                  <a
                                    href={testHref(row.id)}
                                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Ver
                                  </a>
                                  <a
                                    href={testHref(row.id)}
                                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <Settings2 className="h-4 w-4" />
                                    Modificar
                                  </a>
                                  {!row.draftVersion && row.latestVersion && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setVersionToCreateFor(row)}
                                    >
                                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                                      Nueva versión
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => openVersion(row)}>
                                  Crear version
                                </Button>
                              )}
                              <Button type="button" variant="ghost" size="sm" disabled title="No hay endpoint disponible para dar de baja tests">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Baja
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      {versionToCreateFor && (
        <CreateVersionDialog
          open={!!versionToCreateFor}
          onOpenChange={(open) => {
            if (!open) setVersionToCreateFor(null);
          }}
          test={versionToCreateFor}
          onCreated={(newVersion) => {
            setVersionToCreateFor(null);
            goToTest(versionToCreateFor.id);
          }}
        />
      )}
    </div>
  );
}

interface SubtestDraftState extends SubtestDTO {
  draftId?: string;
  sourceId?: number | null;
  status: "EXISTING" | "CREATED" | "UPDATED" | "DELETED";
  items?: any[];
}

export function InstrumentVersionEditorScreen({ testId }: { testId: string }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateVersionDialogOpen, setIsCreateVersionDialogOpen] = useState(false);
  const [selectedSubtestId, setSelectedSubtestId] = useState<number | string | null>(null);
  const [subtestsDraft, setSubtestsDraft] = useState<SubtestDraftState[]>([]);
  const [subtestOrderDirty, setSubtestOrderDirty] = useState(false);
  const [itemDraftDirty, setItemDraftDirty] = useState(false);
  const [baremoDirty, setBaremoDirty] = useState(false);
  const [isSubtestDialogOpen, setIsSubtestDialogOpen] = useState(false);
  const [isReuseDialogOpen, setIsReuseDialogOpen] = useState(false);
  const [editingSubtest, setEditingSubtest] = useState<SubtestDraftState | null>(null);
  const [importingSubtest, setImportingSubtest] = useState(false);
  const [header, setHeader] = useState<VersionHeaderForm>({
    number: "",
    instructions: "",
    timeLimitSeconds: "",
    randomizeItems: false,
    randomizeSubtests: false,
  });
  const [baremoForm, setBaremoForm] = useState<BaremoForm>({
    code: "GENERAL",
    name: "Baremo general",
    description: "",
    normativeGroup: "",
  });
  const [baremoRangesDraft, setBaremoRangesDraft] = useState<BaremoRangeDraft[]>([]);

  const contextQuery = useQuery({
    queryKey: ["instrument-version-context", testId],
    queryFn: () => loadVersionContext(Number(testId)),
  });

  const strategiesQuery = useQuery({
    queryKey: ["scoring-strategies"],
    queryFn: instrumentService.getStrategies,
  });

  const version = contextQuery.data?.version ?? null;
  const test = contextQuery.data?.test ?? null;

  const subtestsQuery = useQuery({
    queryKey: ["instrument-subtests", version?.id],
    queryFn: () => instrumentService.getSubtests(version!.id),
    enabled: !!version,
  });

  const baremosQuery = useQuery({
    queryKey: ["instrument-baremos", version?.id],
    queryFn: () => instrumentService.getBaremos(version!.id),
    enabled: !!version,
  });

  const activeBaremo = [...(baremosQuery.data ?? [])].sort((a, b) => a.id - b.id)[0] ?? null;

  const baremoRangesQuery = useQuery({
    queryKey: ["instrument-baremo-ranges", activeBaremo?.id],
    queryFn: () => instrumentService.getBaremoRanges(activeBaremo!.id),
    enabled: !!activeBaremo,
  });

  const publicationSubtestsQuery = useQuery({
    queryKey: ["instrument-publication-subtests", version?.id],
    queryFn: () => loadPublicationSubtests(version!.id),
    enabled: !!version,
  });

  const selectedSubtest = subtestsDraft.find((subtest) => {
    if (subtest.status === "DELETED") return false;
    if (subtest.id && subtest.id === selectedSubtestId) return true;
    if (subtest.draftId && subtest.draftId === selectedSubtestId) return true;
    return false;
  }) ?? null;
  const isDraftVersion = version?.estado === "BORRADOR";
  const canRandomizeSubtestContent = header.randomizeItems;
  const simpleStrategyId = findSimpleStrategyId(strategiesQuery.data ?? []);
  const headerDirty = !!version && (
    header.number !== version.numeroVersion ||
    header.instructions !== (version.instruccionesGenerales ?? "") ||
    numberOrUndefined(header.timeLimitSeconds) !== version.tiempoLimiteSegundos ||
    header.randomizeItems !== !!version.permiteAleatorizarItems ||
    header.randomizeSubtests !== !!version.permiteAleatorizarSubtests
  );
  const hasUnsavedChanges = headerDirty || subtestOrderDirty || itemDraftDirty || baremoDirty;
  const checklist = buildPublicationChecklist({
    test,
    version: version ? { ...version, numeroVersion: header.number, instruccionesGenerales: header.instructions } : null,
    subtests: publicationSubtestsQuery.data ?? [],
    baremo: activeBaremo,
    baremoRanges: activeBaremo ? (baremoRangesQuery.data ?? []) : [],
    hasUnsavedChanges,
  });

  useEffect(() => {
    if (version) {
      setHeader({
        number: version.numeroVersion,
        instructions: version.instruccionesGenerales ?? "",
        timeLimitSeconds: version.tiempoLimiteSegundos ? String(version.tiempoLimiteSegundos) : "",
        randomizeItems: !!version.permiteAleatorizarItems,
        randomizeSubtests: !!version.permiteAleatorizarSubtests,
      });
    }
  }, [version]);

  useEffect(() => {
    if (activeBaremo) {
      setBaremoForm({
        code: activeBaremo.codigoBaremo,
        name: activeBaremo.nombre,
        description: activeBaremo.descripcion ?? "",
        normativeGroup: activeBaremo.grupoNormativo ?? "",
      });
    } else {
      setBaremoForm({
        code: "GENERAL",
        name: "Baremo general",
        description: "",
        normativeGroup: "",
      });
    }
    setBaremoDirty(false);
  }, [activeBaremo]);

  useEffect(() => {
    setBaremoRangesDraft((baremoRangesQuery.data ?? []).sort((a, b) => a.orden - b.orden).map(baremoRangeToDraft));
    setBaremoDirty(false);
  }, [baremoRangesQuery.data]);

  useEffect(() => {
    if (subtestsQuery.data) {
      const ordered = [...subtestsQuery.data]
        .sort((a, b) => a.numeroOrden - b.numeroOrden)
        .map((subtest) => ({
          ...subtest,
          status: "EXISTING" as const,
        }));
      setSubtestsDraft(ordered);
      setSubtestOrderDirty(false);
      setSelectedSubtestId((current) => {
        if (!ordered.length) return null;
        const exists = ordered.some((subtest) => subtest.id === current || subtest.draftId === current);
        if (!current || !exists) return ordered[0].id;
        return current;
      });
    }
  }, [subtestsQuery.data]);

  const updateVersion = useMutation({
    mutationFn: () => instrumentService.updateVersion(version!.id, {
      number: header.number.trim(),
      strategyId: simpleStrategyId,
      instructions: blank(header.instructions),
      timeLimitSeconds: numberOrUndefined(header.timeLimitSeconds),
      randomizeItems: header.randomizeItems,
      randomizeSubtests: header.randomizeSubtests,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument-version-context", testId] });
      setNotice("Cabecera de version guardada.");
    },
  });

  const saveConfiguration = useMutation({
    mutationFn: async () => {
      const payloadSubtests = subtestsDraft.map((subtest, index) => {
        const isCreated = subtest.status === "CREATED";
        const isDeleted = subtest.status === "DELETED";
        
        // Map items
        const payloadItems = (subtest.items || []).map((item, itemIdx) => {
          return {
            id: item.id || null,
            draftId: item.draftId,
            sourceId: item.sourceId || null,
            status: item.status,
            code: item.code,
            itemType: item.itemType,
            responseType: item.responseType,
            prompt: item.prompt,
            instruction: item.instruction,
            order: item.order || itemIdx + 1,
            baseScore: numberOrUndefined(item.baseScore),
            timeLimitSeconds: numberOrUndefined(item.timeLimitSeconds),
            required: item.required,
            confidential: item.confidential,
            images: (item.images || []).map((img: any) => ({
              id: img.id || null,
              draftId: img.draftId,
              sourceId: img.sourceId || null,
              status: img.status,
              resourceId: img.resourceId,
              order: img.order,
              altText: img.altText,
              role: img.role,
            })),
            options: (item.options || []).map((opt: any) => ({
              id: opt.id || null,
              draftId: opt.draftId,
              sourceId: opt.sourceId || null,
              status: opt.status,
              code: opt.code,
              text: opt.text,
              order: opt.order,
              ordinalValue: opt.ordinalValue,
              images: (opt.images || []).map((img: any) => ({
                id: img.id || null,
                draftId: img.draftId,
                sourceId: img.sourceId || null,
                status: img.status,
                resourceId: img.resourceId,
                order: img.order,
                altText: img.altText,
                role: img.role,
              })),
            })),
          };
        });

        return {
          id: subtest.id || null,
          draftId: subtest.draftId || String(subtest.id),
          sourceId: subtest.sourceId || null,
          status: isDeleted ? "DELETED" : (subtest.status === "CREATED" ? "CREATED" : "UPDATED"),
          code: subtest.codigoSubtest,
          name: subtest.nombreSubtest,
          description: subtest.descripcion,
          instructions: subtest.instrucciones,
          order: index + 1,
          timeLimitSeconds: subtest.tiempoLimiteSegundos,
          randomizeItems: canRandomizeSubtestContent ? !!subtest.permiteAleatorizarItems : false,
          randomizeOptions: canRandomizeSubtestContent ? !!subtest.permiteAleatorizarOpciones : false,
          required: subtest.esObligatorio ?? true,
          strategyId: subtest.estrategiaCalificacionId || simpleStrategyId,
          items: payloadItems,
        };
      });

      await instrumentService.saveVersionConfiguration(version!.id, {
        subtests: payloadSubtests,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument-subtests", version?.id] });
      queryClient.invalidateQueries({ queryKey: ["instrument-publication-subtests", version?.id] });
      setSubtestOrderDirty(false);
      setNotice("Configuración de subtests guardada exitosamente.");
    },
  });

  const handleImportSubtest = async (sourceSubtestId: number) => {
    setImportingSubtest(true);
    try {
      const template = await instrumentService.getSubtestCloneTemplate(sourceSubtestId);
      
      const newDraft: SubtestDraftState = {
        id: undefined as any,
        draftId: `subtest-tmp-${Date.now()}`,
        sourceId: template.sourceSubtestId,
        status: "CREATED",
        codigoSubtest: `${template.code}-COPY`,
        nombreSubtest: `${template.name} Copia`,
        descripcion: template.description || "",
        instrucciones: template.instructions || "",
        numeroOrden: subtestsDraft.filter(s => s.status !== "DELETED").length + 1,
        tiempoLimiteSegundos: template.timeLimitSeconds,
        permiteAleatorizarItems: template.randomizeItems,
        permiteAleatorizarOpciones: template.randomizeOptions,
        esObligatorio: template.required,
        estado: template.estado || "ACTIVO",
        items: (template.items || []).map((item: any, itemIdx: number) => {
          return {
            id: undefined,
            draftId: `item-tmp-${Date.now()}-${itemIdx}`,
            sourceId: item.sourceItemId,
            status: "CREATED",
            code: item.code,
            itemType: item.itemType,
            responseType: item.responseType,
            prompt: item.prompt || "",
            instruction: item.instruction || "",
            order: item.order || itemIdx + 1,
            baseScore: item.baseScore !== undefined ? String(item.baseScore) : "1",
            timeLimitSeconds: item.timeLimitSeconds !== undefined && item.timeLimitSeconds !== null ? String(item.timeLimitSeconds) : "",
            required: item.required !== undefined ? item.required : true,
            confidential: item.confidential !== undefined ? item.confidential : true,
            images: (item.images || []).map((img: any, imgIdx: number) => ({
              id: undefined,
              draftId: `img-tmp-${Date.now()}-${itemIdx}-${imgIdx}`,
              sourceId: img.sourceImageId,
              status: "CREATED",
              resourceId: img.resourceId,
              order: img.order || 1,
              altText: img.altText || "",
              role: img.role || "ENUNCIADO",
            })),
            options: (item.options || []).map((opt: any, optIdx: number) => {
              const optImages = (opt.images || []).map((img: any, imgIdx: number) => ({
                id: undefined,
                draftId: `optimg-tmp-${Date.now()}-${itemIdx}-${optIdx}-${imgIdx}`,
                sourceId: img.sourceImageId,
                status: "CREATED",
                resourceId: img.resourceId,
                order: img.order || 1,
                altText: img.altText || "",
                role: img.role || "ENUNCIADO",
              }));
              return {
                id: undefined,
                draftId: `opt-tmp-${Date.now()}-${itemIdx}-${optIdx}`,
                sourceId: opt.sourceOptionId,
                status: "CREATED",
                code: opt.code,
                text: opt.text || "",
                order: opt.order || optIdx + 1,
                ordinalValue: opt.ordinalValue,
                isCorrect: item.answerKey?.correctOptionSourceId === opt.sourceOptionId,
                images: optImages,
                image: { file: null, altText: "" }
              };
            }),
            scoring: {
              useCustomRule: !!item.answerKey,
              requiresManualReview: item.answerKey?.requiresManualReview || false,
              score: item.answerKey?.score !== undefined ? String(item.answerKey.score) : "1",
            }
          };
        })
      };

      setSubtestsDraft((current) => [...current, newDraft]);
      setSelectedSubtestId(newDraft.draftId!);
      setSubtestOrderDirty(true);
      setIsReuseDialogOpen(false);
      setNotice("Plantilla de subtest cargada localmente. Guarde la configuración para persistir.");
    } catch (error) {
      console.error(error);
      setNotice(`Error al cargar plantilla: ${errorMessage(error)}`);
    } finally {
      setImportingSubtest(false);
    }
  };

  const handleDeleteSubtest = (subtest: SubtestDraftState) => {
    const updated = subtestsDraft.map((s) => {
      if (subtest.status === "CREATED" && s.draftId === subtest.draftId) {
        return null;
      }
      if (s.id === subtest.id) {
        return { ...s, status: "DELETED" as const };
      }
      return s;
    }).filter(Boolean) as SubtestDraftState[];

    setSubtestsDraft(updated);
    setSubtestOrderDirty(true);

    const remaining = updated.filter((s) => s.status !== "DELETED");
    setSelectedSubtestId((current) => {
      const targetId = subtest.status === "CREATED" ? subtest.draftId : subtest.id;
      if (current === targetId) {
        return remaining.length ? (remaining[0].id || remaining[0].draftId || null) : null;
      }
      return current;
    });
  };

  const createSubtest = useMutation({
    mutationFn: (form: SubtestForm) => instrumentService.addSubtest(version!.id, {
      code: form.code.trim(),
      name: form.name.trim(),
      description: blank(form.description),
      instructions: blank(form.instructions),
      order: subtestsDraft.length + 1,
      timeLimitSeconds: numberOrUndefined(form.timeLimitSeconds),
      randomizeItems: canRandomizeSubtestContent ? form.randomizeItems : false,
      randomizeOptions: canRandomizeSubtestContent ? form.randomizeOptions : false,
      required: form.required,
      strategyId: simpleStrategyId,
    }),
    onSuccess: (subtest) => {
      queryClient.invalidateQueries({ queryKey: ["instrument-subtests", version?.id] });
      queryClient.invalidateQueries({ queryKey: ["instrument-publication-subtests", version?.id] });
      setSelectedSubtestId(subtest.id);
      setIsSubtestDialogOpen(false);
      setNotice("Subtest creado.");
    },
  });

  const saveBaremo = useMutation({
    mutationFn: async () => {
      const normalized = normalizeBaremoRanges(baremoRangesDraft);
      if (normalized.errors.length > 0) {
        throw new Error(normalized.errors[0]);
      }

      const baremoPayload = {
        versionId: version!.id,
        code: baremoForm.code.trim(),
        name: baremoForm.name.trim(),
        description: blank(baremoForm.description),
        normativeGroup: blank(baremoForm.normativeGroup),
      };
      const savedBaremo = activeBaremo
        ? await instrumentService.updateBaremo(activeBaremo.id, baremoPayload)
        : await instrumentService.createBaremo(baremoPayload);

      for (const range of normalized.ranges) {
        const rangePayload = {
          minScore: range.minScore,
          maxScore: range.maxScore,
          percentile: range.percentile,
          category: range.category,
          interpretation: blank(range.interpretation),
          recommendation: blank(range.recommendation),
          order: range.order,
        };
        if (range.id) {
          await instrumentService.updateBaremoRange(range.id, rangePayload);
        } else {
          await instrumentService.addBaremoRange(savedBaremo.id, rangePayload);
        }
      }

      return savedBaremo;
    },
    onSuccess: (savedBaremo) => {
      queryClient.invalidateQueries({ queryKey: ["instrument-baremos", version?.id] });
      queryClient.invalidateQueries({ queryKey: ["instrument-baremo-ranges", savedBaremo.id] });
      setBaremoDirty(false);
      setNotice("Baremo guardado.");
    },
  });

  const publishVersion = useMutation({
    mutationFn: async () => {
      await instrumentService.approveVersion(version!.id);
      return instrumentService.publishVersion(version!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument-version-context", testId] });
      queryClient.invalidateQueries({ queryKey: ["instrument-index"] });
      setNotice("Version publicada. La configuracion queda bloqueada para edicion directa.");
    },
  });

  const moveSubtest = (fromVisibleIndex: number, toVisibleIndex: number) => {
    const visible = subtestsDraft.filter((s) => s.status !== "DELETED");
    const fromSubtest = visible[fromVisibleIndex];
    const toSubtest = visible[toVisibleIndex];
    if (!fromSubtest || !toSubtest) return;

    const fromIndex = subtestsDraft.indexOf(fromSubtest);
    const toIndex = subtestsDraft.indexOf(toSubtest);

    setSubtestsDraft((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setSubtestOrderDirty(true);
  };

  if (contextQuery.isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando version...</div>;
  }

  if (!version || !test) {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Version no encontrada</AlertTitle>
        <AlertDescription>No fue posible ubicar una version para el test {testId}.</AlertDescription>
      </Alert>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/instrumentos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a instrumentos
            </Link>
          </Button>
          <Badge variant={isDraftVersion ? "secondary" : "outline"}>{version.estado}</Badge>
        </div>

        {notice && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Estado actualizado</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {!isDraftVersion && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <LockKeyhole className="h-4 w-4 text-amber-600 animate-pulse" />
            <AlertTitle className="font-semibold text-amber-800">Versión Publicada (Solo Lectura)</AlertTitle>
            <AlertDescription className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Esta versión ya está publicada y sus campos están bloqueados. Para realizar modificaciones, debe crear una nueva versión de este test.
              </span>
              <Button
                size="sm"
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-center"
                onClick={() => setIsCreateVersionDialogOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Crear nueva versión
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {(saveBaremo.isError || publishVersion.isError) && (
          <Alert className="border-destructive/40 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo completar la accion</AlertTitle>
            <AlertDescription>{errorMessage(saveBaremo.error ?? publishVersion.error)}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{test.nombreTest}</CardTitle>
            <CardDescription>
              {test.codigoTest}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Codigo del test">
                <Input value={test.codigoTest} disabled />
              </Field>
              <Field label="Nombre del test">
                <Input value={test.nombreTest} disabled />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Version">
                <Input value={header.number} onChange={(event) => setHeader({ ...header, number: event.target.value })} disabled={!isDraftVersion} />
              </Field>
              <Field label="Tiempo limite global (seg)">
                <Input type="number" value={header.timeLimitSeconds} onChange={(event) => setHeader({ ...header, timeLimitSeconds: event.target.value })} disabled={!isDraftVersion} />
              </Field>
            </div>
            <Field label="Instrucciones generales">
              <Textarea rows={3} value={header.instructions} onChange={(event) => setHeader({ ...header, instructions: event.target.value })} disabled={!isDraftVersion} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <CheckField
                label="Permitir aleatorizar subtests"
                checked={header.randomizeSubtests}
                disabled={!isDraftVersion}
                onChange={(randomizeSubtests) => setHeader({ ...header, randomizeSubtests })}
              />
              <CheckField
                label="Permitir aleatorizar items"
                checked={header.randomizeItems}
                disabled={!isDraftVersion}
                onChange={(randomizeItems) => setHeader({ ...header, randomizeItems })}
              />
            </div>
            <div className="flex items-end">
                <Button className="w-full" onClick={() => updateVersion.mutate()} disabled={!isDraftVersion || updateVersion.isPending || !header.number.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cabecera
                </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="subtests" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="subtests">Configuración de subtests</TabsTrigger>
            <TabsTrigger value="baremos">Baremos</TabsTrigger>
          </TabsList>

          <TabsContent value="subtests" className="space-y-4 pt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Subtests</CardTitle>
                  <CardDescription>El orden se define por la posicion de la tabla.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!subtestOrderDirty || saveConfiguration.isPending || !isDraftVersion} onClick={() => saveConfiguration.mutate()}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveConfiguration.isPending ? "Guardando..." : "Guardar configuración"}
                  </Button>
                  <Dialog open={isSubtestDialogOpen} onOpenChange={setIsSubtestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!isDraftVersion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo subtest
                      </Button>
                    </DialogTrigger>
                    <SubtestDialog
                      canRandomize={canRandomizeSubtestContent}
                      onCancel={() => setIsSubtestDialogOpen(false)}
                      onSubmit={(form) => createSubtest.mutate(form)}
                      saving={createSubtest.isPending}
                    />
                  </Dialog>
                  <Dialog open={isReuseDialogOpen} onOpenChange={setIsReuseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!isDraftVersion} variant="outline">
                        <ChevronsUpDown className="mr-2 h-4 w-4" />
                        Reutilizar subtest
                      </Button>
                    </DialogTrigger>
                    <ReuseSubtestDialog
                      canRandomize={canRandomizeSubtestContent}
                      onCancel={() => setIsReuseDialogOpen(false)}
                      onImport={handleImportSubtest}
                      saving={importingSubtest}
                    />
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Posicion</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tiempo</TableHead>
                      <TableHead>Aleatorizacion</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subtestsDraft.filter(s => s.status !== "DELETED").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          Agregue el primer subtest para empezar a configurar items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subtestsDraft
                        .filter(s => s.status !== "DELETED")
                        .map((subtest, index) => (
                          <DraggableSubtestRow
                            key={subtest.id || subtest.draftId}
                            index={index}
                            subtest={subtest}
                            selected={selectedSubtestId === subtest.id || selectedSubtestId === subtest.draftId}
                            canMove={isDraftVersion}
                            onMove={moveSubtest}
                            onSelect={() => setSelectedSubtestId(subtest.id || subtest.draftId || null)}
                            canRandomize={canRandomizeSubtestContent}
                            onEdit={() => setEditingSubtest(subtest)}
                            onDelete={() => handleDeleteSubtest(subtest)}
                          />
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {editingSubtest && (
              <Dialog open={!!editingSubtest} onOpenChange={(open) => { if (!open) setEditingSubtest(null); }}>
                <SubtestDialog
                  canRandomize={canRandomizeSubtestContent}
                  initialValues={{
                    code: editingSubtest.codigoSubtest,
                    name: editingSubtest.nombreSubtest,
                    description: editingSubtest.descripcion ?? "",
                    instructions: editingSubtest.instrucciones ?? "",
                    timeLimitSeconds: editingSubtest.tiempoLimiteSegundos ? String(editingSubtest.tiempoLimiteSegundos) : "",
                    required: editingSubtest.esObligatorio ?? true,
                    randomizeItems: editingSubtest.permiteAleatorizarItems ?? false,
                    randomizeOptions: editingSubtest.permiteAleatorizarOpciones ?? false,
                  }}
                  onCancel={() => setEditingSubtest(null)}
                  onSubmit={(form) => {
                    setSubtestsDraft((current) =>
                      current.map((s) => {
                        if (
                          (editingSubtest.id && s.id === editingSubtest.id) ||
                          (editingSubtest.draftId && s.draftId === editingSubtest.draftId)
                        ) {
                          return {
                            ...s,
                            codigoSubtest: form.code.trim(),
                            nombreSubtest: form.name.trim(),
                            descripcion: form.description,
                            instrucciones: form.instructions,
                            tiempoLimiteSegundos: numberOrUndefined(form.timeLimitSeconds),
                            permiteAleatorizarItems: form.randomizeItems,
                            permiteAleatorizarOpciones: form.randomizeOptions,
                            esObligatorio: form.required,
                            status: s.status === "CREATED" ? "CREATED" : "UPDATED",
                          };
                        }
                        return s;
                      })
                    );
                    setSubtestOrderDirty(true);
                    setEditingSubtest(null);
                  }}
                  saving={false}
                />
              </Dialog>
            )}

            <ItemDraftEditor
              key={selectedSubtestId ?? "none"}
              subtest={selectedSubtest}
              isDraftVersion={isDraftVersion}
              strategies={strategiesQuery.data ?? []}
              simpleStrategyId={simpleStrategyId}
              onNotice={setNotice}
              onDirtyChange={setItemDraftDirty}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["instrument-publication-subtests", version.id] });
                setItemDraftDirty(false);
              }}
            />
          </TabsContent>

          <TabsContent value="baremos" className="space-y-4 pt-4">
            <BaremoEditor
              baremos={baremosQuery.data ?? []}
              activeBaremo={activeBaremo}
              form={baremoForm}
              ranges={baremoRangesDraft}
              disabled={!isDraftVersion}
              saving={saveBaremo.isPending}
              loading={baremosQuery.isLoading || baremoRangesQuery.isLoading}
              onFormChange={(next) => {
                setBaremoForm(next);
                setBaremoDirty(true);
              }}
              onRangesChange={(next) => {
                setBaremoRangesDraft(next);
                setBaremoDirty(true);
              }}
              onSave={() => saveBaremo.mutate()}
            />
          </TabsContent>
        </Tabs>


        <PublicationReview
          checklist={checklist}
          version={version}
          loading={publicationSubtestsQuery.isLoading || baremosQuery.isLoading || baremoRangesQuery.isLoading}
          publishing={publishVersion.isPending}
          disabled={!isDraftVersion || !checklist.ready || publishVersion.isPending}
          onPublish={() => publishVersion.mutate()}
        />

        {isCreateVersionDialogOpen && (
          <CreateVersionDialog
            open={isCreateVersionDialogOpen}
            onOpenChange={setIsCreateVersionDialogOpen}
            test={{
              ...test,
              latestVersion: version,
            }}
            onCreated={(newVersion) => {
              setIsCreateVersionDialogOpen(false);
              setNotice(`Nueva versión ${newVersion.numeroVersion} creada como borrador.`);
              queryClient.invalidateQueries({ queryKey: ["instrument-version-context", testId] });
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}

function ItemDraftEditor({
  subtest,
  isDraftVersion,
  strategies,
  simpleStrategyId,
  onNotice,
  onDirtyChange,
  onSaved,
}: {
  subtest: SubtestDraftState | null;
  isDraftVersion: boolean;
  strategies: EstrategiaCalificacionDTO[];
  simpleStrategyId?: number;
  onNotice: (message: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const draftQuery = useQuery({
    queryKey: ["instrument-item-draft", subtest?.id],
    queryFn: () => loadItemDraft(subtest!.id),
    enabled: !!subtest && !!subtest.id,
  });

  const selectedItem = items.find((item) => item.key === selectedItemKey) ?? null;

  useEffect(() => {
    const next = draftQuery.data?.items ?? [];
    setItems(next);
    setSelectedItemKey(next[0]?.key ?? null);
    onDirtyChange(false);
  }, [draftQuery.data]);

  const saveDraft = useMutation({
    mutationFn: () => persistItemDraft({
      subtestId: subtest!.id,
      items,
      existingRules: draftQuery.data?.rules ?? [],
      simpleStrategyId: simpleStrategyId ?? strategies[0]?.id,
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["instrument-item-draft", subtest?.id] });
      queryClient.invalidateQueries({ queryKey: ["instrument-items", subtest?.id] });
      onSaved();
      onNotice(result.warnings.length > 0
        ? `Items y opciones guardados. ${result.warnings[0]}`
        : "Configuracion de items, opciones y claves guardada.");
    },
  });

  const updateItems = (updater: (current: ItemDraft[]) => ItemDraft[]) => {
    setItems(updater);
    onDirtyChange(true);
  };

  const moveItem = (from: number, to: number) => updateItems((current) => reorder(current, from, to));

  if (!subtest) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          Seleccione o cree un subtest para configurar sus items.
        </CardContent>
      </Card>
    );
  }

  if (subtest.status === "CREATED") {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div className="font-semibold text-base">Subtest pendiente de guardar</div>
          <p className="text-sm max-w-md text-center text-muted-foreground">
            Este subtest ha sido importado pero aún no se ha guardado en el servidor.
            Por favor, haga clic en el botón <strong>"Guardar configuración"</strong> arriba para persistir los cambios antes de editar sus ítems.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Items y opciones</CardTitle>
          <CardDescription>
            Subtest seleccionado: {subtest.codigoSubtest} · {subtest.nombreSubtest}
          </CardDescription>
        </div>
        <Button disabled={!isDraftVersion || saveDraft.isPending} onClick={() => saveDraft.mutate()}>
          <Save className="mr-2 h-4 w-4" />
          Guardar configuracion
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveDraft.isError && (
          <Alert className="border-destructive/40 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo guardar la configuracion</AlertTitle>
            <AlertDescription>{errorMessage(saveDraft.error)}</AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-200 bg-blue-50 text-blue-950">
          <Settings2 className="h-4 w-4" />
          <AlertTitle>Borrador local</AlertTitle>
          <AlertDescription>
            Los cambios se mantienen en borrador hasta guardar la configuracion del subtest.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button
                size="sm"
                variant="outline"
                disabled={!isDraftVersion}
                onClick={() => {
                  const item = newItemDraft(items.length + 1);
                  updateItems((current) => [...current, item]);
                  setSelectedItemKey(item.key);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Agregue el primer item del subtest.
                </div>
              ) : (
                items.map((item, index) => (
                  <DraggableItemButton
                    key={item.key}
                    item={item}
                    index={index}
                    selected={selectedItemKey === item.key}
                    canMove={isDraftVersion}
                    onMove={moveItem}
                    onSelect={() => setSelectedItemKey(item.key)}
                  />
                ))
              )}
            </div>
          </div>

          {selectedItem ? (
            <ItemEditor
              item={selectedItem}
              disabled={!isDraftVersion}
              onChange={(next) => updateItems((current) => current.map((item) => item.key === next.key ? next : item))}
              onDelete={() => {
                const nextItems = items.filter((item) => item.key !== selectedItem.key);
                updateItems(() => nextItems);
                setSelectedItemKey(nextItems[0]?.key ?? null);
              }}
            />
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Seleccione un item para editar enunciado, opciones y clave.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ItemEditor({
  item,
  disabled,
  onChange,
  onDelete,
}: {
  item: ItemDraft;
  disabled: boolean;
  onChange: (item: ItemDraft) => void;
  onDelete: () => void;
}) {
  const canHaveOptions = optionResponseTypes.includes(item.responseType);
  const supportsImages = itemTypeSupportsImages(item.itemType);
  const usesOptionText = itemTypeUsesOptionText(item.itemType);
  const setOption = (key: string, next: OptionDraft) => {
    onChange({ ...item, options: item.options.map((option) => option.key === key ? next : option) });
  };
  const setItemType = (itemType: TipoItem) => {
    let next: ItemDraft = { ...item, itemType };
    if (!itemTypeSupportsImages(itemType)) {
      next = withoutImageDrafts(next);
    }
    if (!itemTypeUsesOptionText(itemType)) {
      next = withoutOptionText(next);
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Configuracion del item</h3>
          <p className="text-sm text-muted-foreground">El orden es la posicion en la lista izquierda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ ...item, scoring: { ...item.scoring, useCustomRule: false, requiresManualReview: false } })}
          >
            Regla base
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ ...item, scoring: { ...item.scoring, useCustomRule: true, requiresManualReview: false } })}
          >
            Personalizada
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ ...item, scoring: { ...item.scoring, useCustomRule: true, requiresManualReview: true } })}
          >
            Revision manual
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || !!item.id}
            onClick={onDelete}
            title={item.id ? "Eliminar item persistido no disponible" : "Eliminar item del borrador"}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Codigo">
          <Input value={item.code} disabled={disabled} onChange={(event) => onChange({ ...item, code: event.target.value })} />
        </Field>
        <Field label="Puntaje Visual">
          <Input type="number" step="0.01" value={item.baseScore} disabled={disabled} onChange={(event) => onChange({ ...item, baseScore: event.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <EnumSelect value={item.itemType} label="Tipo de item" options={itemTypes} disabled={disabled} onChange={(itemType) => setItemType(itemType as TipoItem)} />
        <EnumSelect
          value={item.responseType}
          label="Tipo de respuesta"
          options={responseTypes}
          disabled={disabled}
          onChange={(responseType) => onChange({
            ...item,
            responseType: responseType as TipoRespuesta,
            options: optionResponseTypes.includes(responseType as TipoRespuesta) ? item.options : [],
          })}
        />
      </div>
      <Field label="Enunciado">
        <Textarea rows={3} value={item.prompt} disabled={disabled} onChange={(event) => onChange({ ...item, prompt: event.target.value })} />
      </Field>
      <Field label="Instruccion especifica">
        <Textarea rows={2} value={item.instruction} disabled={disabled} onChange={(event) => onChange({ ...item, instruction: event.target.value })} />
      </Field>
      {supportsImages && (
        <ImageDraftField
          label="Imagen del item"
          image={item.image}
          disabled={disabled}
          onChange={(image) => onChange({ ...item, image })}
        />
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Tiempo (seg)">
          <Input type="number" value={item.timeLimitSeconds} disabled={disabled} onChange={(event) => onChange({ ...item, timeLimitSeconds: event.target.value })} />
        </Field>
        <CheckField label="Obligatorio" checked={item.required} disabled={disabled} onChange={(required) => onChange({ ...item, required })} />
        <CheckField label="Confidencial" checked={item.confidential} disabled={disabled} onChange={(confidential) => onChange({ ...item, confidential })} />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Opciones</h3>
            <p className="text-sm text-muted-foreground">Opciones de respuesta del item seleccionado.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !canHaveOptions}
            onClick={() => onChange({ ...item, options: [...item.options, newOptionDraft(item.options.length)] })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Opcion
          </Button>
        </div>
        {canHaveOptions ? (
          <div className="space-y-2">
            {item.options.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Agregue opciones de respuesta para este item.
              </div>
            ) : (
              item.options.map((option) => (
                <div key={option.key} className="space-y-3 rounded-md border p-3">
                  <div className={usesOptionText ? "grid gap-2 md:grid-cols-[90px_minmax(0,1fr)_120px_40px]" : "grid gap-2 md:grid-cols-[90px_120px_40px]"}>
                    <Input value={option.code} disabled={disabled} onChange={(event) => setOption(option.key, { ...option, code: event.target.value })} />
                    {usesOptionText && (
                      <Input value={option.text} disabled={disabled} placeholder="Texto de opcion" onChange={(event) => setOption(option.key, { ...option, text: event.target.value })} />
                    )}
                    <CheckField
                      label="Correcta"
                      checked={option.isCorrect}
                      disabled={disabled}
                      onChange={(checked) => onChange({
                        ...item,
                        options: item.options.map((candidate) => ({
                          ...candidate,
                          isCorrect: candidate.key === option.key ? checked : false,
                        })),
                      })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={disabled || !!option.id}
                      onClick={() => onChange({ ...item, options: item.options.filter((candidate) => candidate.key !== option.key) })}
                      title={option.id ? "Eliminar opcion no disponible" : "Eliminar opcion del borrador"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {supportsImages && (
                    <ImageDraftField
                      label={`Imagen de opcion ${option.code || ""}`.trim()}
                      image={option.image}
                      disabled={disabled}
                      onChange={(image) => setOption(option.key, { ...option, image })}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Este tipo de respuesta no usa opciones.
          </div>
        )}
      </div>

      <Separator />

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Regla asociada">
          <Input value={item.scoring.useCustomRule ? "Regla personalizada" : "Regla base"} disabled />
        </Field>
        <Field label="Puntaje de clave">
          <Input type="number" step="0.01" value={item.scoring.score} disabled={disabled} onChange={(event) => onChange({ ...item, scoring: { ...item.scoring, score: event.target.value } })} />
        </Field>
        <CheckField
          label="Revision manual"
          checked={item.scoring.requiresManualReview}
          disabled={disabled}
          onChange={(requiresManualReview) => onChange({ ...item, scoring: { ...item.scoring, requiresManualReview, useCustomRule: requiresManualReview || item.scoring.useCustomRule } })}
        />
      </div>
    </div>
  );
}

function BaremoEditor({
  baremos,
  activeBaremo,
  form,
  ranges,
  disabled,
  saving,
  loading,
  onFormChange,
  onRangesChange,
  onSave,
}: {
  baremos: BaremoDTO[];
  activeBaremo: BaremoDTO | null;
  form: BaremoForm;
  ranges: BaremoRangeDraft[];
  disabled: boolean;
  saving: boolean;
  loading: boolean;
  onFormChange: (form: BaremoForm) => void;
  onRangesChange: (ranges: BaremoRangeDraft[]) => void;
  onSave: () => void;
}) {
  const normalized = normalizeBaremoRanges(ranges);
  const canSave = !disabled && !saving && form.code.trim() && form.name.trim() && normalized.errors.length === 0;
  const setRange = (key: string, next: BaremoRangeDraft) => {
    onRangesChange(ranges.map((range) => range.key === key ? next : range));
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Baremo</CardTitle>
          <CardDescription>
            Configure el baremo general de la version y sus rangos de puntaje directo.
          </CardDescription>
        </div>
        <Button disabled={!canSave} onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Guardar baremo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Cargando baremo...</div>
        ) : (
          <>
            {baremos.length > 1 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Multiples baremos</AlertTitle>
                <AlertDescription>
                  Se usara como baremo activo {activeBaremo?.codigoBaremo ?? "el primero registrado"}. Los demas quedan solo como referencia.
                </AlertDescription>
              </Alert>
            )}

            {normalized.errors.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Baremo incompleto</AlertTitle>
                <AlertDescription>{normalized.errors[0]}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Codigo">
                <Input value={form.code} disabled={disabled} onChange={(event) => onFormChange({ ...form, code: event.target.value })} />
              </Field>
              <Field label="Nombre">
                <Input value={form.name} disabled={disabled} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Grupo normativo">
                <Input value={form.normativeGroup} disabled={disabled} onChange={(event) => onFormChange({ ...form, normativeGroup: event.target.value })} />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={disabled}
                  onClick={() => onRangesChange([...ranges, newBaremoRangeDraft(ranges.length + 1)])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar rango
                </Button>
              </div>
            </div>
            <Field label="Descripcion">
              <Textarea rows={2} value={form.description} disabled={disabled} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
            </Field>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Percentil</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Interpretacion</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Agregue al menos un rango de baremo.
                    </TableCell>
                  </TableRow>
                ) : (
                  ranges.map((range, index) => (
                    <TableRow key={range.key}>
                      <TableCell className="w-20">
                        <Input
                          type="number"
                          value={range.order}
                          disabled={disabled}
                          onChange={(event) => setRange(range.key, { ...range, order: Number(event.target.value) || index + 1 })}
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input type="number" value={range.minScore} disabled={disabled} onChange={(event) => setRange(range.key, { ...range, minScore: event.target.value })} />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input type="number" value={range.maxScore} disabled={disabled} onChange={(event) => setRange(range.key, { ...range, maxScore: event.target.value })} />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input type="number" value={range.percentile} disabled={disabled} onChange={(event) => setRange(range.key, { ...range, percentile: event.target.value })} />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <Input value={range.category} disabled={disabled} onChange={(event) => setRange(range.key, { ...range, category: event.target.value })} />
                      </TableCell>
                      <TableCell className="min-w-48">
                        <Input value={range.interpretation} disabled={disabled} onChange={(event) => setRange(range.key, { ...range, interpretation: event.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled || !!range.id}
                          title={range.id ? "No hay endpoint para eliminar rangos persistidos" : "Quitar rango del borrador"}
                          onClick={() => onRangesChange(ranges.filter((candidate) => candidate.key !== range.key))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PublicationReview({
  checklist,
  version,
  loading,
  publishing,
  disabled,
  onPublish,
}: {
  checklist: ReturnType<typeof buildPublicationChecklist>;
  version: VersionTestDTO;
  loading: boolean;
  publishing: boolean;
  disabled: boolean;
  onPublish: () => void;
}) {
  const isDraft = version.estado === "BORRADOR";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Revision y publicacion</CardTitle>
          <CardDescription>
            Valide que la version esta lista antes de bloquearla para uso en sesiones reales.
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={disabled || loading}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              {publishing ? "Publicando..." : "Publicar version"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publicar version {version.numeroVersion}</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion aprobara y publicara la version. Una vez publicada, no podra modificarse directamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onPublish}>Aprobar y publicar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDraft && (
          <Alert>
            <LockKeyhole className="h-4 w-4" />
            <AlertTitle>Version bloqueada</AlertTitle>
            <AlertDescription>
              Esta version esta en estado {version.estado}. Para cambios posteriores cree una nueva version.
            </AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Calculando checklist...</div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {checklist.items.map((item) => (
              <div key={item.id} className={`flex items-start gap-3 rounded-md border p-3 ${item.complete ? "bg-emerald-100" : "bg-red-100"}`}>
                {item.complete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  {!item.complete && <div className="text-xs text-muted-foreground">{item.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableSubtestRow({
  subtest,
  index,
  selected,
  canMove,
  canRandomize,
  onMove,
  onSelect,
  onEdit,
  onDelete,
}: {
  subtest: SubtestDraftState;
  index: number;
  selected: boolean;
  canMove: boolean;
  canRandomize: boolean;
  onMove: (from: number, to: number) => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const [, drop] = useDrop<{ index: number }>({
    accept: DND_SUBTEST_ROW,
    hover: (dragged) => {
      if (dragged.index !== index) {
        onMove(dragged.index, index);
        dragged.index = index;
      }
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: DND_SUBTEST_ROW,
    item: { index },
    canDrag: canMove,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));

  return (
    <TableRow ref={ref} className={`${selected ? "bg-primary/5" : ""} ${isDragging ? "opacity-50" : ""}`} onClick={onSelect}>
      <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="font-mono text-xs">{subtest.codigoSubtest}</TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {subtest.nombreSubtest}
          {subtest.status === "CREATED" && (
            <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
              Borrador
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{subtest.tiempoLimiteSegundos ? `${subtest.tiempoLimiteSegundos}s` : "Sin limite"}</TableCell>
      <TableCell>
        {canRandomize ? (
          <span className="text-sm">
            {subtest.permiteAleatorizarItems ? "Items" : "Items fijos"} / {subtest.permiteAleatorizarOpciones ? "Opciones" : "Opciones fijas"}
          </span>
        ) : (
          <span className="text-muted-foreground">Controlado por version</span>
        )}
      </TableCell>
      <TableCell><Badge variant="secondary">{subtest.estado ?? "ACTIVO"}</Badge></TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canMove}
            onClick={onEdit}
            title="Editar subtest"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canMove}
            onClick={onDelete}
            title="Eliminar subtest"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DraggableItemButton({
  item,
  index,
  selected,
  canMove,
  onMove,
  onSelect,
}: {
  item: ItemDraft;
  index: number;
  selected: boolean;
  canMove: boolean;
  onMove: (from: number, to: number) => void;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [, drop] = useDrop<{ index: number }>({
    accept: DND_ITEM_ROW,
    hover: (dragged) => {
      if (dragged.index !== index) {
        onMove(dragged.index, index);
        dragged.index = index;
      }
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM_ROW,
    item: { index },
    canDrag: canMove,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md border p-3 text-left text-sm transition ${
        selected ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs">{index + 1}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.code || "Sin codigo"}</span>
        <span className="block truncate text-xs text-muted-foreground">{labelFor(responseTypes, item.responseType)}</span>
      </span>
      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function SubtestDialog({
  canRandomize,
  saving,
  onCancel,
  onSubmit,
}: {
  canRandomize: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (form: SubtestForm) => void;
}) {
  const [form, setForm] = useState<SubtestForm>({
    code: "",
    name: "",
    description: "",
    instructions: "",
    timeLimitSeconds: "",
    required: true,
    randomizeItems: false,
    randomizeOptions: false,
  });

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nuevo subtest</DialogTitle>
        <DialogDescription>Configure los datos generales. El orden se asigna por posicion en la tabla.</DialogDescription>
      </DialogHeader>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Codigo">
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          </Field>
          <Field label="Nombre">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
        </div>
        <Field label="Descripcion">
          <Textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Field label="Instrucciones">
          <Textarea rows={3} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tiempo (seg)">
            <Input type="number" value={form.timeLimitSeconds} onChange={(event) => setForm({ ...form, timeLimitSeconds: event.target.value })} />
          </Field>
          <CheckField label="Obligatorio" checked={form.required} onChange={(required) => setForm({ ...form, required })} />
        </div>
        {canRandomize && (
          <div className="grid gap-3 md:grid-cols-2">
            <CheckField label="Aleatorizar items" checked={form.randomizeItems} onChange={(randomizeItems) => setForm({ ...form, randomizeItems })} />
            <CheckField label="Aleatorizar opciones" checked={form.randomizeOptions} onChange={(randomizeOptions) => setForm({ ...form, randomizeOptions })} />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={saving || !form.code.trim() || !form.name.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Crear subtest
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EnumSelect<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ImageDraftField({
  label,
  image,
  disabled,
  onChange,
}: {
  label: string;
  image: ImageDraft;
  disabled?: boolean;
  onChange: (image: ImageDraft) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileName = image.file?.name;
  const existingLabel = image.existingId ? `Imagen registrada #${image.existingId}` : "Imagen registrada";
  const helperText = fileName
    ? `Pendiente: ${fileName}`
    : image.existingId || image.existingUrl
      ? `${existingLabel}. Seleccione otro archivo solo si necesita reemplazarla.`
      : "PNG, JPG o WEBP. Se sube al guardar la configuracion.";

  return (
    <div className={`rounded-md border p-3 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>{label}</Label>
          <p className="text-xs text-muted-foreground">
            {helperText}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
            <ImageUp className="mr-2 h-4 w-4" />
            Seleccionar
          </Button>
          {image.file && (
            <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange({ ...image, file: null })}>
              Quitar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/*"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onChange({ ...image, file });
          event.target.value = "";
        }}
      />
      <Input
        className="mt-3"
        value={image.altText}
        disabled={disabled}
        placeholder="Texto alternativo interno"
        onChange={(event) => onChange({ ...image, altText: event.target.value })}
      />
    </div>
  );
}

function CheckField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex min-h-10 items-center gap-2 rounded-md border p-2 text-sm ${disabled ? "opacity-60" : ""}`}>
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

async function loadInstrumentRows(): Promise<InstrumentRow[]> {
  const tests = await instrumentService.getTests();
  const rows = await Promise.all(tests.map(async (test) => {
    const versions = await instrumentService.getVersions(test.id).catch(() => []);
    const sorted = [...versions].sort(compareVersions);
    return {
      ...test,
      versions: sorted,
      draftVersion: sorted.find((version) => version.estado === "BORRADOR"),
      latestVersion: sorted[0],
    };
  }));
  return rows;
}

async function loadVersionContext(testId: number): Promise<VersionSummary> {
  const tests = await instrumentService.getTests();
  const test = tests.find((candidate) => candidate.id === testId);
  if (!test) {
    throw new Error("Test not found");
  }

  const versions = await instrumentService.getVersions(testId);
  const sorted = [...versions].sort(compareVersions);
  const version = sorted.find((candidate) => candidate.estado === "BORRADOR") ?? sorted[0];
  if (!version) {
    throw new Error("Version not found");
  }

  return { version, test };
}

async function loadItemDraft(subtestId: number): Promise<{ items: ItemDraft[]; rules: ScoringRuleDTO[] }> {
  const [items, rules] = await Promise.all([
    instrumentService.getItems(subtestId),
    instrumentService.getScoringRules(subtestId).catch(() => [] as ScoringRuleDTO[]),
  ]);
  const drafts = await Promise.all(
    [...items].sort((a, b) => a.numeroOrden - b.numeroOrden).map(async (item) => {
      const [options, answerKey] = await Promise.all([
        instrumentService.getOptions(item.id).catch(() => [] as OptionDTO[]),
        instrumentService.getAnswerKey(item.id).catch(() => null as AnswerKeyDTO | null),
      ]);
      return itemToDraft(item, options, answerKey, rules);
    }),
  );
  return { items: drafts, rules };
}

async function loadPublicationSubtests(versionId: number): Promise<PublicationSubtest[]> {
  const subtests = await instrumentService.getSubtests(versionId);
  return Promise.all(
    [...subtests].sort((a, b) => a.numeroOrden - b.numeroOrden).map(async (subtest) => {
      const items = await instrumentService.getItems(subtest.id).catch(() => [] as ItemDTO[]);
      const publicationItems = await Promise.all(
        [...items].sort((a, b) => a.numeroOrden - b.numeroOrden).map(async (item) => {
          const [options, answerKey] = await Promise.all([
            instrumentService.getOptions(item.id).catch(() => [] as OptionDTO[]),
            instrumentService.getAnswerKey(item.id).catch(() => null as AnswerKeyDTO | null),
          ]);
          return {
            ...item,
            options,
            answerKey,
          };
        }),
      );
      return {
        ...subtest,
        items: publicationItems,
      };
    }),
  );
}

async function persistItemDraft({
  subtestId,
  items,
  existingRules,
  simpleStrategyId,
}: {
  subtestId: number;
  items: ItemDraft[];
  existingRules: ScoringRuleDTO[];
  simpleStrategyId?: number;
}) {
  const warnings: string[] = [];
  let baseRule = existingRules.find((rule) => !rule.itemId && rule.tipoRegla === "CLAVE_ITEM");

  for (const [itemIndex, draft] of items.entries()) {
    const itemPayload = {
      code: draft.code.trim() || `ITEM-${itemIndex + 1}`,
      itemType: draft.itemType,
      responseType: draft.responseType,
      prompt: blank(draft.prompt),
      instruction: blank(draft.instruction),
      order: itemIndex + 1,
      baseScore: numberOrUndefined(draft.baseScore),
      timeLimitSeconds: numberOrUndefined(draft.timeLimitSeconds),
      required: draft.required,
      confidential: draft.confidential,
    };
    const hasImage = hasPendingImageUpload(draft.image);
    const savedItem = draft.id
      ? await instrumentService.updateItem(draft.id, itemPayload)
      : await instrumentService.addItemWithImage(
          subtestId,
          itemPayload,
          hasImage ? (draft.image.file as File) : undefined,
          hasImage ? 1 : undefined,
          hasImage ? (blank(draft.image.altText) ?? `Imagen del item ${itemPayload.code}`) : undefined,
          "ENUNCIADO",
        );

    if (draft.id && hasImage) {
      await instrumentService.uploadImage(
        draft.image.file as File,
        savedItem.id,
        1,
        blank(draft.image.altText) ?? `Imagen del item ${itemPayload.code}`,
        "ENUNCIADO",
      );
    }

    const savedOptions = new Map<string, OptionDTO>();
    if (optionResponseTypes.includes(draft.responseType)) {
      for (const [optionIndex, option] of draft.options.entries()) {
        const payload = {
          code: option.code.trim() || optionCode(optionIndex),
          text: blank(option.text),
          order: optionIndex + 1,
        };
        const saved = option.id
          ? await instrumentService.updateOption(option.id, payload)
          : await instrumentService.addOption(savedItem.id, payload);
        savedOptions.set(option.key, saved);

        if (hasPendingImageUpload(option.image)) {
          await instrumentService.uploadOptionImage(
            option.image.file,
            saved.id,
            optionIndex + 1,
            optionImageAltText(option, saved),
          );
        }
      }
    }

    const selectedCorrect = draft.options.find((option) => option.isCorrect);
    if (draft.scoring.requiresManualReview || selectedCorrect || draft.responseType === "TEXTO_ABIERTO" || draft.responseType === "NUMERICA") {
      if (!simpleStrategyId) {
        warnings.push("No se guardaron claves porque no hay estrategia de calificacion disponible.");
        continue;
      }

      try {
        if (!baseRule && !draft.scoring.useCustomRule && !draft.scoring.requiresManualReview) {
          baseRule = await instrumentService.createScoringRule(subtestId, {
            strategyId: simpleStrategyId,
            ruleType: "CLAVE_ITEM",
            priority: 1,
            parametersJson: "{}",
            observation: "Regla base para calificacion automatica.",
          });
        }

        const rule = draft.scoring.useCustomRule || draft.scoring.requiresManualReview
          ? await upsertCustomRule({
            subtestId,
            itemId: savedItem.id,
            ruleId: draft.scoring.existingRuleId,
            strategyId: simpleStrategyId,
            ruleType: draft.scoring.requiresManualReview ? "REVISION_MANUAL" : "CLAVE_ITEM",
          })
          : baseRule;

        if (!rule) {
          warnings.push("No se guardaron claves porque no se pudo resolver la regla base.");
          continue;
        }

        const answerPayload = {
          ruleId: rule.id,
          correctOptionId: selectedCorrect ? savedOptions.get(selectedCorrect.key)?.id : undefined,
          score: numberOrUndefined(draft.scoring.score) ?? numberOrUndefined(draft.baseScore) ?? 1,
          requiresManualReview: draft.scoring.requiresManualReview,
        };

        if (draft.scoring.existingAnswerKeyId) {
          await instrumentService.updateAnswerKey(draft.scoring.existingAnswerKeyId, answerPayload);
        } else {
          await instrumentService.createAnswerKey(savedItem.id, answerPayload);
        }
      } catch (error) {
        warnings.push(`No se guardaron algunas claves: ${errorMessage(error)}`);
      }
    }
  }

  return { warnings: [...new Set(warnings)] };
}

async function upsertCustomRule({
  subtestId,
  itemId,
  ruleId,
  strategyId,
  ruleType,
}: {
  subtestId: number;
  itemId: number;
  ruleId?: number;
  strategyId: number;
  ruleType: TipoReglaCalificacion;
}) {
  const payload = {
    strategyId,
    ruleType,
    itemId,
    priority: 1,
    parametersJson: "{}",
    observation: ruleType === "REVISION_MANUAL" ? "Regla especifica con revision manual." : "Regla especifica del item.",
  };
  return ruleId
    ? instrumentService.updateScoringRule(ruleId, payload)
    : instrumentService.createScoringRule(subtestId, payload);
}

function itemToDraft(item: ItemDTO, options: OptionDTO[], answerKey: AnswerKeyDTO | null, rules: ScoringRuleDTO[]): ItemDraft {
  const key = `item-${item.id}`;
  const optionDrafts = [...options].sort((a, b) => a.numeroOrden - b.numeroOrden).map((option) => ({
    key: `option-${option.id}`,
    id: option.id,
    code: option.codigoOpcion,
    text: option.textoOpcion ?? "",
    isCorrect: option.id === answerKey?.opcionCorrectaId,
    image: existingImageDraft(option, option.numeroOrden),
  }));
  const rule = rules.find((candidate) => candidate.id === answerKey?.reglaCalificacionId);
  return {
    key,
    id: item.id,
    code: item.codigoItem,
    itemType: item.tipoItem,
    responseType: item.tipoRespuesta,
    prompt: item.enunciado ?? "",
    instruction: item.instruccion ?? "",
    baseScore: item.puntajeBase ? String(item.puntajeBase) : "1",
    timeLimitSeconds: item.tiempoLimiteSegundos ? String(item.tiempoLimiteSegundos) : "",
    required: item.esObligatorio ?? true,
    confidential: item.esConfidencial ?? true,
    image: existingImageDraft(item, 1),
    options: optionDrafts,
    scoring: {
      useCustomRule: !!rule?.itemId,
      requiresManualReview: !!answerKey?.requiereRevisionManual || rule?.tipoRegla === "REVISION_MANUAL",
      score: answerKey?.puntaje ? String(answerKey.puntaje) : String(item.puntajeBase ?? 1),
      existingAnswerKeyId: answerKey?.id,
      existingRuleId: rule?.itemId ? rule.id : undefined,
    },
  };
}

function baremoRangeToDraft(range: BaremoRangeDTO): BaremoRangeDraft {
  return {
    key: `baremo-range-${range.id}`,
    id: range.id,
    minScore: String(range.puntajeMinimo),
    maxScore: String(range.puntajeMaximo),
    percentile: range.percentil === undefined ? "" : String(range.percentil),
    category: range.categoria,
    interpretation: range.interpretacion ?? "",
    recommendation: range.recomendacion ?? "",
    order: range.orden,
  };
}

function newBaremoRangeDraft(order: number): BaremoRangeDraft {
  return {
    key: tempId("baremo-range"),
    minScore: "",
    maxScore: "",
    percentile: "",
    category: "",
    interpretation: "",
    recommendation: "",
    order,
  };
}

function newItemDraft(position: number): ItemDraft {
  return {
    key: tempId("item"),
    code: `ITEM-${String(position).padStart(2, "0")}`,
    itemType: "SOLO_TEXTO",
    responseType: "OPCION_UNICA",
    prompt: "",
    instruction: "",
    baseScore: "1",
    timeLimitSeconds: "",
    required: true,
    confidential: true,
    image: emptyImageDraft(),
    options: [newOptionDraft(0), newOptionDraft(1)],
    scoring: {
      useCustomRule: false,
      requiresManualReview: false,
      score: "1",
    },
  };
}

function newOptionDraft(index: number): OptionDraft {
  return {
    key: tempId("option"),
    code: optionCode(index),
    text: "",
    isCorrect: false,
    image: emptyImageDraft(),
  };
}

function emptyImageDraft(): ImageDraft {
  return { file: null, altText: "" };
}

function optionImageAltText(option: OptionDraft, saved: OptionDTO) {
  const customText = blank(option.image.altText);
  const label = option.code.trim() || saved.codigoOpcion;
  return customText ? `opcion:${saved.id}; ${customText}` : `Imagen de opcion ${label}`;
}

function reorder<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function compareVersions(a: VersionTestDTO, b: VersionTestDTO) {
  const dateA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
  const dateB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
  return dateB - dateA || b.id - a.id;
}

function findSimpleStrategyId(strategies: EstrategiaCalificacionDTO[]) {
  return strategies.find((strategy) => {
    const text = `${strategy.codigo ?? ""} ${strategy.nombre ?? ""} ${strategy.tipoEstrategia ?? ""}`.toUpperCase();
    return text.includes("CLAVE_SIMPLE") || text.includes("CLAVE SIMPLE") || text.includes("CLAVE");
  })?.id ?? strategies[0]?.id;
}

function numberOrUndefined(value: string | number | undefined) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function blank(value: string | undefined) {
  const next = value?.trim();
  return next ? next : undefined;
}

function optionCode(index: number) {
  return String.fromCharCode(65 + index);
}

function tempId(prefix: string) {
  tempCounter += 1;
  return `${prefix}-tmp-${tempCounter}`;
}

function labelFor<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Revise la conexion con el backend e intente nuevamente.";
}

function ReuseSubtestDialog({
  canRandomize,
  onCancel,
  onImport,
  saving,
}: {
  canRandomize: boolean;
  onCancel: () => void;
  onImport: (subtestId: number) => void;
  saving: boolean;
}) {
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [selectedSubtestId, setSelectedSubtestId] = useState<number | null>(null);

  const testsQuery = useQuery({
    queryKey: ["instrument-tests-all"],
    queryFn: instrumentService.getTests,
  });

  const versionsQuery = useQuery({
    queryKey: ["instrument-versions-all", selectedTestId],
    queryFn: () => instrumentService.getVersions(selectedTestId!),
    enabled: selectedTestId !== null,
  });

  const subtestsQuery = useQuery({
    queryKey: ["instrument-subtests-all", selectedVersionId],
    queryFn: () => instrumentService.getSubtests(selectedVersionId!),
    enabled: selectedVersionId !== null,
  });

  const handleTestChange = (testIdStr: string) => {
    const testId = Number(testIdStr);
    setSelectedTestId(testId);
    setSelectedVersionId(null);
    setSelectedSubtestId(null);
  };

  const handleVersionChange = (versionIdStr: string) => {
    const versionId = Number(versionIdStr);
    setSelectedVersionId(versionId);
    setSelectedSubtestId(null);
  };

  const handleSubtestChange = (subtestIdStr: string) => {
    const subtestId = Number(subtestIdStr);
    setSelectedSubtestId(subtestId);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Reutilizar subtest</DialogTitle>
        <DialogDescription>
          Seleccione un test y versión de origen para importar una copia de un subtest existente.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-1.5">
          <Label>Test de origen</Label>
          {testsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground py-2">Cargando tests...</div>
          ) : (
            <Select value={selectedTestId ? String(selectedTestId) : ""} onValueChange={handleTestChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un test" />
              </SelectTrigger>
              <SelectContent>
                {(testsQuery.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.codigoTest} - {t.nombreTest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedTestId !== null && (
          <div className="space-y-1.5">
            <Label>Versión</Label>
            {versionsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground py-2">Cargando versiones...</div>
            ) : (
              <Select value={selectedVersionId ? String(selectedVersionId) : ""} onValueChange={handleVersionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una versión" />
                </SelectTrigger>
                <SelectContent>
                  {(versionsQuery.data ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      Versión {v.numeroVersion} ({v.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {selectedVersionId !== null && (
          <div className="space-y-1.5">
            <Label>Subtest</Label>
            {subtestsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground py-2">Cargando subtests...</div>
            ) : (
              <Select value={selectedSubtestId ? String(selectedSubtestId) : ""} onValueChange={handleSubtestChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un subtest" />
                </SelectTrigger>
                <SelectContent>
                  {(subtestsQuery.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.codigoSubtest} - {s.nombreSubtest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={!selectedSubtestId || saving}
          onClick={() => {
            if (selectedSubtestId) {
              onImport(selectedSubtestId);
            }
          }}
        >
          {saving ? "Importando..." : "Importar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: TestPsicologicoDTO & { latestVersion?: InstrumentVersionDTO };
  onCreated: (newVersion: InstrumentVersionDTO) => void;
}

export function CreateVersionDialog({
  open,
  onOpenChange,
  test,
  onCreated,
}: CreateVersionDialogProps) {
  const queryClient = useQueryClient();
  const [versionNumber, setVersionNumber] = useState("");
  const [copyConfig, setCopyConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const strategiesQuery = useQuery({
    queryKey: ["scoring-strategies"],
    queryFn: instrumentService.getStrategies,
  });
  const strategies = strategiesQuery.data ?? [];
  const simpleStrategyId = findSimpleStrategyId(strategies);

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const sourceVersion = test.latestVersion;
      
      // 1. Create the new version
      const newVersion = await instrumentService.createVersion(test.id, {
        number: versionNumber.trim(),
        strategyId: sourceVersion?.estrategiaCalificacionId || simpleStrategyId || 1,
        instructions: sourceVersion?.instruccionesGenerales || "",
        timeLimitSeconds: sourceVersion?.tiempoLimiteSegundos,
        randomizeItems: sourceVersion?.permiteAleatorizarItems || false,
        randomizeSubtests: sourceVersion?.permiteAleatorizarSubtests || false,
      });

      // 2. Clone configuration if copyConfig is true
      if (copyConfig && sourceVersion) {
        // Fetch source subtests
        const sourceSubtests = await instrumentService.getSubtests(sourceVersion.id);

        const templates = await Promise.all(
          sourceSubtests.map(s => instrumentService.getSubtestCloneTemplate(s.id))
        );

        const payloadSubtests = templates.map((template, subtestIdx) => {
          const payloadItems = (template.items || []).map((item: any, itemIdx: number) => {
            const optImages = (item.options || []).map((opt: any, optIdx: number) => {
              const imgList = (opt.images || []).map((img: any, imgIdx: number) => ({
                id: null,
                draftId: `optimg-tmp-${Date.now()}-${subtestIdx}-${itemIdx}-${optIdx}-${imgIdx}`,
                sourceId: img.sourceImageId,
                status: "CREATED" as const,
                resourceId: img.resourceId,
                order: img.order || 1,
                altText: img.altText || "",
                role: img.role || "ENUNCIADO",
              }));
              return {
                id: null,
                draftId: `opt-tmp-${Date.now()}-${subtestIdx}-${itemIdx}-${optIdx}`,
                sourceId: opt.sourceOptionId,
                status: "CREATED" as const,
                code: opt.code,
                text: opt.text || "",
                order: opt.order || optIdx + 1,
                ordinalValue: opt.ordinalValue,
                images: imgList,
              };
            });

            const itemImgList = (item.images || []).map((img: any, imgIdx: number) => ({
              id: null,
              draftId: `img-tmp-${Date.now()}-${subtestIdx}-${itemIdx}-${imgIdx}`,
              sourceId: img.sourceImageId,
              status: "CREATED" as const,
              resourceId: img.resourceId,
              order: img.order || 1,
              altText: img.altText || "",
              role: img.role || "ENUNCIADO",
            }));

            return {
              id: null,
              draftId: `item-tmp-${Date.now()}-${subtestIdx}-${itemIdx}`,
              sourceId: item.sourceItemId,
              status: "CREATED" as const,
              code: item.code,
              itemType: item.itemType,
              responseType: item.responseType,
              prompt: item.prompt || "",
              instruction: item.instruction || "",
              order: item.order || itemIdx + 1,
              baseScore: item.baseScore !== undefined ? String(item.baseScore) : "1",
              timeLimitSeconds: item.timeLimitSeconds !== undefined && item.timeLimitSeconds !== null ? String(item.timeLimitSeconds) : "",
              required: item.required !== undefined ? item.required : true,
              confidential: item.confidential !== undefined ? item.confidential : true,
              images: itemImgList,
              options: optImages.map((opt: any) => ({
                id: opt.id,
                draftId: opt.draftId,
                sourceId: opt.sourceId,
                status: opt.status,
                code: opt.code,
                text: opt.text,
                order: opt.order,
                ordinalValue: opt.ordinalValue,
                images: opt.images,
              })),
              answerKey: null, // do not send answerKey here to avoid ruleId errors
            };
          });

          return {
            id: null,
            draftId: `subtest-tmp-${Date.now()}-${subtestIdx}`,
            sourceId: template.sourceSubtestId,
            status: "CREATED" as const,
            code: template.code,
            name: template.name,
            description: template.description || "",
            instructions: template.instructions || "",
            order: template.order || subtestIdx + 1,
            timeLimitSeconds: template.timeLimitSeconds,
            randomizeItems: !!template.randomizeItems,
            randomizeOptions: !!template.randomizeOptions,
            required: template.required !== false,
            strategyId: template.strategyId || sourceVersion?.estrategiaCalificacionId || simpleStrategyId || 1,
            items: payloadItems,
          };
        });

        // Save cloned subtests
        await instrumentService.saveVersionConfiguration(newVersion.id, {
          subtests: payloadSubtests,
        });

        // Recreate answer keys & rules
        const createdSubtests = await instrumentService.getSubtests(newVersion.id);
        for (const newSubtest of createdSubtests) {
          const createdItems = await instrumentService.getItems(newSubtest.id);
          
          const templateSubtest = templates.find(t => t.code === newSubtest.codigoSubtest);
          if (!templateSubtest) continue;

          for (const newItem of createdItems) {
            const templateItem = templateSubtest.items?.find((i: any) => i.code === newItem.codigoItem);
            if (!templateItem || !templateItem.answerKey) continue;

            const createdOptions = await instrumentService.getOptions(newItem.id);

            // Create scoring rule for this subtest/item
            const newRule = await instrumentService.createScoringRule(newSubtest.id, {
              strategyId: templateSubtest.strategyId || sourceVersion?.estrategiaCalificacionId || simpleStrategyId || 1,
              ruleType: "CLAVE_ITEM",
              priority: 1,
              parametersJson: "{}",
              observation: "Regla base para calificacion automatica.",
            });

            // Find matching correct option
            const correctTemplateOption = templateItem.options?.find((o: any) => o.sourceOptionId === templateItem.answerKey.correctOptionSourceId);
            const correctOption = createdOptions.find((o: any) => o.codigoOpcion === correctTemplateOption?.code);

            // Create answer key
            await instrumentService.createAnswerKey(newItem.id, {
              ruleId: newRule.id,
              correctOptionId: correctOption?.id || null,
              expectedText: templateItem.answerKey.expectedText || null,
              expectedNumber: templateItem.answerKey.expectedNumber !== undefined ? templateItem.answerKey.expectedNumber : null,
              numericTolerance: templateItem.answerKey.numericTolerance !== undefined ? templateItem.answerKey.numericTolerance : null,
              score: templateItem.answerKey.score !== undefined ? templateItem.answerKey.score : 1,
              requiresManualReview: templateItem.answerKey.requiresManualReview || false,
            });
          }
        }

        // Copy Baremos
        const sourceBaremos = await instrumentService.getBaremos(sourceVersion.id).catch(() => []);
        for (const baremo of sourceBaremos) {
          const newBaremo = await instrumentService.createBaremo({
            versionId: newVersion.id,
            dimensionId: baremo.dimensionResultadoId,
            code: baremo.codigoBaremo,
            name: baremo.nombre,
            description: baremo.descripcion,
            normativeGroup: baremo.grupoNormativo,
          });

          // Copy ranges
          const sourceRanges = await instrumentService.getBaremoRanges(baremo.id).catch(() => []);
          for (const range of sourceRanges) {
            await instrumentService.addBaremoRange(newBaremo.id, {
              minScore: range.puntajeMinimo,
              maxScore: range.puntajeMaximo,
              percentile: range.percentil,
              category: range.categoria,
              interpretation: range.interpretacion,
              recommendation: range.recomendacion,
              order: range.orden,
            });
          }
        }
      }

      return newVersion;
    },
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries({ queryKey: ["instrument-index"] });
      onCreated(newVersion);
    },
    onError: (err) => {
      setError(errorMessage(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nueva versión</DialogTitle>
          <DialogDescription>
            Cree una nueva versión borrador para el test <strong>{test.nombreTest}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (versionNumber.trim()) {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          {error && (
            <Alert className="border-destructive/40 bg-destructive/10 text-destructive py-2 text-xs">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al crear versión</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field label="Número de versión">
            <Input
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="Ej: 2.0"
              required
              disabled={createMutation.isPending}
            />
          </Field>

          {test.latestVersion && (
            <CheckField
              label={`Copiar configuración e ítems de la versión actual (${test.latestVersion.numeroVersion})`}
              checked={copyConfig}
              onChange={setCopyConfig}
              disabled={createMutation.isPending}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !versionNumber.trim()}
            >
              {createMutation.isPending ? "Creando..." : "Crear versión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
