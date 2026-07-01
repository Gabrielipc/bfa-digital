import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAdminStore } from "../../../../store/adminStore";
import { instrumentService } from "../../../../api/instrumentService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { SearchableCombobox } from "../../ui/searchable-combobox";
import { Plus, Copy, ChevronRight, Calendar, MapPin, KeyRound, ShieldCheck, AlertTriangle, Trash2, Lock, CheckCircle2Icon } from "lucide-react";
import { Field } from "./shared";

const EMPTY_ARRAY: any[] = [];

export function SessionCreateScreen() {
  const navigate = useNavigate();
  const participantsList = useAdminStore((s) => s.participants);
  const createSession = useAdminStore((s) => s.createSession);
  const versionSubtests = useAdminStore((s) => s.versionSubtests);
  const fetchVersionSubtests = useAdminStore((s) => s.fetchVersionSubtests);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);
  const carreras = useAdminStore((s) => s.carreras);
  const gruposAcademicos = useAdminStore((s) => s.gruposAcademicos);
  const cohortes = useAdminStore((s) => s.cohortes);
  const fetchCarreras = useAdminStore((s) => s.fetchCarreras);
  const fetchGrupos = useAdminStore((s) => s.fetchGrupos);
  const fetchCohortes = useAdminStore((s) => s.fetchCohortes);

  // Form states
  const [sessionName, setSessionName] = useState("");
  const [selectedCarreraId, setSelectedCarreraId] = useState("");
  const [selectedCohorteId, setSelectedCohorteId] = useState("");
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [instrumentError, setInstrumentError] = useState<string | null>(null);

  const [selectedSubtestIds, setSelectedSubtestIds] = useState<number[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [copiedTokenIdx, setCopiedTokenIdx] = useState<number | null>(null);
  const [newlyCreatedSessionId, setNewlyCreatedSessionId] = useState<string>("");
  const sessionAssignments = useAdminStore((s) =>
    newlyCreatedSessionId ? s.assignments[newlyCreatedSessionId] : undefined
  ) || EMPTY_ARRAY;

  useEffect(() => {
    fetchParticipants();
    fetchCarreras();
    fetchCohortes();
    fetchGrupos();
    setLoadingTests(true);
    instrumentService.getTests()
      .then((items) => {
        setTests(items);
        setInstrumentError(null);
      })
      .catch((err: any) => {
        setInstrumentError(err.message || "No se pudieron cargar los tests.");
      })
      .finally(() => setLoadingTests(false));
  }, []);

  const currentSubtests = useMemo(() => {
    return selectedVersionId ? versionSubtests[String(selectedVersionId)] || EMPTY_ARRAY : EMPTY_ARRAY;
  }, [selectedVersionId, versionSubtests]);
  const activeCarreras = useMemo(
    () => carreras.filter((c) => c.estado === "ACTIVO" && c.id != null),
    [carreras],
  );
  const activeCohortes = useMemo(
    () => cohortes.filter((c) => c.estado === "ACTIVO" && c.id != null),
    [cohortes],
  );
  const activeGrupos = useMemo(
    () => gruposAcademicos.filter((g) => g.estado === "ACTIVO" && g.id != null),
    [gruposAcademicos],
  );
  const selectedCarrera = activeCarreras.find((c) => String(c.id) === selectedCarreraId);
  const selectedCohorte = activeCohortes.find((c) => String(c.id) === selectedCohorteId);
  const selectedGrupo = activeGrupos.find((g) => String(g.id) === selectedGrupoId);
  const testOptions = tests.map((test) => ({
    value: String(test.id),
    label: test.nombreTest || test.name || test.codigoTest,
    description: [test.codigoTest, test.estado].filter(Boolean).join(" · "),
  }));
  const versionOptions = versions.map((version) => ({
    value: String(version.id),
    label: `v${version.numeroVersion || version.number}`,
    description: [version.estado || version.status, version.creadoEn || version.createdAt].filter(Boolean).join(" · "),
  }));
  const carreraOptions = activeCarreras.map((c) => ({
    value: String(c.id),
    label: c.nombreCarrera,
    description: c.codigoCarrera,
  }));
  const cohorteOptions = activeCohortes.map((c) => ({
    value: String(c.id),
    label: c.nombreCohorte,
    description: [c.codigoCohorte, c.anio, c.periodo].filter(Boolean).join(" · "),
  }));
  const grupoOptions = activeGrupos.map((g) => {
    const careerName = g.carrera?.nombreCarrera || (g.carrera?.id ? carreras.find(c => c.id === g.carrera?.id)?.nombreCarrera : undefined);
    return {
      value: String(g.id),
      label: g.nombreGrupo || g.codigoGrupo,
      description: [g.codigoGrupo, careerName].filter(Boolean).join(" · "),
    };
  });
  const sessionScope = [
    selectedCarrera?.nombreCarrera,
    selectedCohorte?.nombreCohorte,
    selectedGrupo?.nombreGrupo || selectedGrupo?.codigoGrupo,
  ].filter(Boolean).join(" · ");
  const visibleParticipants = useMemo(() => {
    return participantsList.filter((p) => {
      const matchesCarrera = !selectedCarreraId || String(p.carreraId) === selectedCarreraId;
      const matchesCohorte = !selectedCohorteId || String(p.cohorteId) === selectedCohorteId;
      const matchesGrupo = !selectedGrupoId || String(p.grupoId) === selectedGrupoId;
      return matchesCarrera && matchesCohorte && matchesGrupo;
    });
  }, [participantsList, selectedCarreraId, selectedCohorteId, selectedGrupoId]);

  useEffect(() => {
    if (selectedGrupo?.carrera?.id && selectedCarreraId !== String(selectedGrupo.carrera.id)) {
      setSelectedCarreraId(String(selectedGrupo.carrera.id));
    }
  }, [selectedGrupo, selectedCarreraId]);

  useEffect(() => {
    setSelectedVersionId("");
    setVersions([]);
    setSelectedSubtestIds([]);
    if (!selectedTestId) return;

    setLoadingVersions(true);
    instrumentService.getVersions(selectedTestId)
      .then((items) => {
        setVersions(items);
        setInstrumentError(null);
      })
      .catch((err: any) => {
        setInstrumentError(err.message || "No se pudieron cargar las versiones del test.");
      })
      .finally(() => setLoadingVersions(false));
  }, [selectedTestId]);

  useEffect(() => {
    if (selectedVersionId) {
      fetchVersionSubtests(String(selectedVersionId));
    }
  }, [selectedVersionId]);

  useEffect(() => {
    const ids = currentSubtests.map((s) => s.id);
    setSelectedSubtestIds((prev) => {
      if (prev.length === ids.length && prev.every((id, idx) => id === ids[idx])) {
        return prev;
      }
      return ids;
    });
  }, [currentSubtests]);

  const handleGenerate = async () => {
    if (!sessionName.trim()) {
      alert("Debes indicar el nombre de la sesión.");
      return;
    }

    if (!date || !time || !endTime) {
      alert("Debes indicar fecha, hora de apertura y hora de cierre.");
      return;
    }

    if (!selectedTestId) {
      alert("Debes seleccionar un test.");
      return;
    }

    if (!selectedVersionId) {
      alert("Debes seleccionar una versión de test.");
      return;
    }

    if (selectedSubtestIds.length === 0) {
      alert("Debes seleccionar al menos un subtest.");
      return;
    }

    if (assignedIds.length === 0) {
      alert("Debes asignar al menos un participante.");
      return;
    }

    // Generar código único para la sesión
    const newCode = `SES-${date.replaceAll("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSessionCode(newCode);

    const scheduledStart = `${date}T${time}:00`;
    const scheduledEnd = `${date}T${endTime}:00`;

    const subtestConfigs = selectedSubtestIds.map((subtestId, index) => {
      const orig = currentSubtests.find((s) => s.id === subtestId);
      return {
        subtestId,
        order: index + 1,
        timeLimitSeconds: orig?.tiempoLimiteSegundos && orig.tiempoLimiteSegundos > 0 ? orig.tiempoLimiteSegundos : undefined,
        randomizeItems: Boolean(orig?.permiteAleatorizarItems),
        randomizeOptions: Boolean(orig?.permiteAleatorizarOpciones),
      };
    });

    try {
      await createSession(
        {
          versionTestId: Number(selectedVersionId),
          code: newCode,
          name: sessionName,
          description: sessionScope || "Sin segmentacion academica",
          scheduledStart,
          scheduledEnd,
          location,
        },
        subtestConfigs,
        assignedIds
      );

      const latestSessions = useAdminStore.getState().sessions;
      const created = latestSessions.find((s) => s.code === newCode);
      if (created) {
        setNewlyCreatedSessionId(created.id);
        await useAdminStore.getState().fetchAssignments(created.id);
      }

      setGenerated(true);
    } catch (err: any) {
      alert(`Error al crear la sesión: ${err.message}`);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary font-bold">Datos de la sesión</CardTitle>
            <CardDescription>Configure los datos principales de la sesión evaluativa.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Nombre de sesión">
              <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </Field>
            <Field label="Carrera">
              <SearchableCombobox
                value={selectedCarreraId}
                onValueChange={setSelectedCarreraId}
                options={carreraOptions}
                placeholder="Seleccione carrera"
                searchPlaceholder="Buscar carrera..."
                emptyMessage="No hay carreras activas."
              />
            </Field>
            <Field label="Cohorte">
              <SearchableCombobox
                value={selectedCohorteId}
                onValueChange={setSelectedCohorteId}
                options={cohorteOptions}
                placeholder="Seleccione cohorte"
                searchPlaceholder="Buscar cohorte..."
                emptyMessage="No hay cohortes activas."
              />
            </Field>
            <Field label="Grupo">
              <SearchableCombobox
                value={selectedGrupoId}
                onValueChange={setSelectedGrupoId}
                options={grupoOptions}
                placeholder="Seleccione grupo"
                searchPlaceholder="Buscar grupo..."
                emptyMessage="No hay grupos activos."
              />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Hora de apertura">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
            <Field label="Hora de cierre">
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
            <Field label="Ubicación">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Test">
              <SearchableCombobox
                value={selectedTestId}
                onValueChange={setSelectedTestId}
                options={testOptions}
                placeholder={loadingTests ? "Cargando tests..." : "Seleccione test"}
                searchPlaceholder="Buscar test..."
                emptyMessage="No hay tests reales disponibles."
                disabled={loadingTests}
              />
            </Field>
            <Field label="Versión del test">
              <SearchableCombobox
                value={selectedVersionId}
                onValueChange={setSelectedVersionId}
                options={versionOptions}
                placeholder={
                  !selectedTestId
                    ? "Seleccione un test primero"
                    : loadingVersions
                      ? "Cargando versiones..."
                      : "Seleccione versión"
                }
                searchPlaceholder="Buscar versión..."
                emptyMessage="No hay versiones para este test."
                disabled={!selectedTestId || loadingVersions}
              />
            </Field>
          </CardContent>
        </Card>

        {instrumentError ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo cargar el instrumento</AlertTitle>
            <AlertDescription className="text-xs">{instrumentError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary font-bold">Subtests habilitados</CardTitle>
            <CardDescription>Seleccione los subtests que componen esta sesión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedVersionId ? (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                Seleccione una versión de test para cargar los subtests.
              </div>
            ) : currentSubtests.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                Cargando subtests o sin subtests disponibles...
              </div>
            ) : (
              currentSubtests.map((s) => {
                const isChecked = selectedSubtestIds.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/40 transition">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubtestIds([...selectedSubtestIds, s.id]);
                        } else {
                          setSelectedSubtestIds(selectedSubtestIds.filter((id) => id !== s.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{s.nombreSubtest}</div>
                      <div className="text-xs text-muted-foreground font-medium">Orden: {s.numeroOrden} · Límite: {s.tiempoLimiteSegundos}s</div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      <Lock className="h-3 w-3 mr-1" /> {s.estado.toLowerCase()}
                    </Badge>
                  </label>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-primary font-bold">Participantes asignados</CardTitle>
              <CardDescription>{assignedIds.length} participantes asignados</CardDescription>
            </div>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><Plus className="h-4 w-4 mr-1" /> Asignar</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Asignar Participantes</DialogTitle>
                  <DialogDescription>Seleccione los participantes que tomarán la prueba según los filtros de la sesión.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-2 py-4">
                  {participantsList.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No hay participantes registrados.
                    </div>
                  ) : visibleParticipants.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No hay participantes para la carrera, cohorte o grupo seleccionados.
                    </div>
                  ) : (
                    visibleParticipants.map((p) => {
                      const isChecked = assignedIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-3 rounded-md border p-2.5 cursor-pointer hover:bg-muted/40 transition">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAssignedIds([...assignedIds, p.id]);
                              } else {
                                setAssignedIds(assignedIds.filter((id) => id !== p.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-medium">{p.id} · {p.carrera} · {p.cohorte} · {p.grupo}</div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsAssignDialogOpen(false)} className="w-full">Listo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {assignedIds.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                  Ningún participante asignado. Haz clic en Asignar.
                </div>
              ) : (
                assignedIds.map((pId) => {
                  const p = participantsList.find((x) => x.id === pId);
                  if (!p) return null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {p.name ? p.name.split(" ").map((x) => x[0]).slice(0, 2).join("") : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-medium">{p.id} · {p.carrera} · {p.cohorte} · {p.grupo}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        onClick={() => setAssignedIds((l) => l.filter((x) => x !== pId))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary font-bold">Acceso y Distribución</CardTitle>
            <CardDescription>Configure y genere los tokens para que los participantes ingresar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generated ? (
              <Button className="w-full h-10 font-medium" onClick={handleGenerate}>
                <KeyRound className="h-4 w-4 mr-2" /> Guardar y Generar Tokens
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-emerald-50 border-emerald-100 text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="font-semibold text-emerald-800">Sesión Generada</AlertTitle>
                  <AlertDescription className="text-emerald-700">La sesión {sessionCode} ha sido guardada.</AlertDescription>
                </Alert>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tokens generados:</div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sessionAssignments.map((asg, idx) => {
                    const handleCopy = () => {
                      navigator.clipboard.writeText(`${window.location.origin}/evaluacion/${asg.token}`);
                      setCopiedTokenIdx(idx);
                      setTimeout(() => setCopiedTokenIdx(null), 2000);
                    };
                    return (
                      <div key={asg.participantId} className="rounded-lg border p-2.5 bg-muted/30">
                        <div className="text-xs font-semibold text-foreground truncate">{asg.participantName}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <code className="flex-1 truncate text-xs bg-white border px-2 py-1 rounded font-mono font-medium text-muted-foreground">
                            {asg.token}
                          </code>
                          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
                            {copiedTokenIdx === idx ? <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => navigate({ to: "/app/sesiones" })}>
                    Ir al monitor
                  </Button>
                  <Button className="flex-1" onClick={() => navigate({ to: `/app/sesiones/${newlyCreatedSessionId}` })}>
                    Supervisar en vivo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Alert className="bg-amber-50 border-amber-100 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-900">Confidencialidad</AlertTitle>
          <AlertDescription className="text-amber-800 text-xs leading-relaxed">
            Cada token es de un solo uso y caduca automáticamente al cerrar la sesión desde el panel del aplicador.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
