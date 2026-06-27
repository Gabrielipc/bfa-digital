import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAdminStore } from "../../../store/adminStore";
import { instrumentService } from "../../../api/instrumentService";
import { resultsService } from "../../../api/resultsService";
import { adminService } from "../../../api/adminService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { SearchableCombobox } from "../ui/searchable-combobox";
import {
  Activity, Users, ClipboardList, FileBarChart, ShieldCheck, ImageUp, ListChecks,
  Plus, Copy, RotateCw, Filter, Download, FileText, FileSpreadsheet, Search, MoreHorizontal,
  Lock, Unlock, CheckCircle2, XCircle, AlertTriangle, Eye, Upload, Image as ImageIcon,
  ChevronRight, Inbox, Calendar, MapPin, Clock, Hash, KeyRound, Trash2, Pencil, Send, Play, Pause
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

const COLORS = ["#0f2649", "#1e4e8c", "#b91c1c", "#64748b", "#10b981", "#f59e0b"];

/* ------------------------- Dashboard ------------------------- */
export function DashboardScreen() {
  const kpis = [
    { label: "Sesiones activas", value: "12", icon: Activity, accent: "text-emerald-600" },
    { label: "Participantes hoy", value: "184", icon: Users, accent: "text-primary" },
    { label: "Pendientes de revisión", value: "7", icon: ListChecks, accent: "text-amber-600" },
    { label: "Intentos completados", value: "1,254", icon: CheckCircle2, accent: "text-primary" },
  ];
  const data = Array.from({ length: 7 }, (_, i) => ({ d: `D${i + 1}`, c: 30 + Math.round(Math.random() * 60) }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{k.label}</div>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <div className="text-3xl font-semibold mt-2">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader><CardTitle>Actividad semanal</CardTitle><CardDescription>Intentos completados por día</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" /><YAxis /><Tooltip />
                <Bar dataKey="c" fill="#0f2649" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Próximas sesiones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["SES-2026-06-A · Psicología I", "SES-2026-06-B · Selección RRHH", "SES-2026-06-C · Reevaluación"].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded border">
                <div className="h-9 w-9 rounded bg-accent text-primary flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{s}</div>
                  <div className="text-xs text-muted-foreground">Hoy · 14:00</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const EMPTY_ARRAY: any[] = [];

/* ------------------------- Session Create (Aplicador) ------------------------- */
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
  const grupoOptions = activeGrupos.map((g) => ({
    value: String(g.id),
    label: g.nombreGrupo || g.codigoGrupo,
    description: [g.codigoGrupo, g.carrera?.nombreCarrera].filter(Boolean).join(" · "),
  }));
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
            <CardDescription>Configure y genere los tokens para que los participantes ingresen.</CardDescription>
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
                            {copiedTokenIdx === idx ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
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

/* ------------------------- Sessions Monitor (Listado General) ------------------------- */
export function SessionsMonitorScreen() {
  const navigate = useNavigate();
  const sessions = useAdminStore((s) => s.sessions);
  const assignments = useAdminStore((s) => s.assignments);
  const updateSessionStatus = useAdminStore((s) => s.updateSessionStatus);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);

  useEffect(() => {
    fetchSessions();
  }, []);

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "ACTIVA":
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">Activa (En vivo)</Badge>;
      case "PLANIFICADA":
        return <Badge className="bg-slate-100 text-slate-700 border-none font-semibold">Planificada</Badge>;
      case "PAUSADA":
        return <Badge className="bg-amber-100 text-amber-800 border-none font-semibold">Pausada</Badge>;
      case "FINALIZADA":
        return <Badge className="bg-muted text-muted-foreground border-none font-semibold">Finalizada</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-primary">Sesiones Evaluativas</h2>
          <p className="text-xs text-muted-foreground">Listado de controles grupales del sistema.</p>
        </div>
        <Button onClick={() => navigate({ to: "/app/sesiones/nueva" })} size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Nueva Sesión
        </Button>
      </div>

      <div className="grid gap-4">
        {sessions.map((s) => {
          const asgs = assignments[s.id] || [];
          const completedCount = asgs.filter(a => a.state === "completado").length;
          const inProgressCount = asgs.filter(a => a.state === "en-progreso").length;
          const interruptedCount = asgs.filter(a => a.state === "interrumpido").length;
          
          // Progreso promedio general de los participantes
          const avgProgress = asgs.length > 0 
            ? Math.round(asgs.reduce((acc, curr) => acc + curr.overallProgress, 0) / asgs.length) 
            : 0;

          return (
            <Card key={s.id} className="border-0 shadow-sm hover:shadow transition-all bg-white duration-200">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-primary hover:underline cursor-pointer truncate" onClick={() => navigate({ to: `/app/sesiones/${s.id}` })}>
                      {s.name}
                    </span>
                    {getStatusBadge(s.status)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {s.date} · {s.time}</span>
                    <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {s.location}</span>
                    <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {asgs.length} participantes</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {s.subtests.map((sub) => (
                      <Badge key={sub} variant="outline" className="text-[10px] capitalize bg-muted/20 border-muted font-medium">
                        {sub === "figuras" ? "Figuras idénticas" : sub}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 md:shrink-0">
                  {asgs.length > 0 && (
                    <div className="space-y-1.5 w-full sm:w-44">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Progreso medio:</span>
                        <span className="text-primary">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-1.5" />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80">
                        <span className="text-emerald-600">{completedCount} listos</span>
                        <span className="text-blue-600">{inProgressCount} activos</span>
                        {interruptedCount > 0 && <span className="text-amber-600">{interruptedCount} caídos</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    {s.status === "PLANIFICADA" && (
                      <Button variant="outline" size="sm" onClick={() => updateSessionStatus(s.id, "ACTIVA")}>
                        <Activity className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Iniciar
                      </Button>
                    )}
                    {s.status === "ACTIVA" && (
                      <Button variant="outline" size="sm" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800" onClick={() => updateSessionStatus(s.id, "PAUSADA")}>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                      </Button>
                    )}
                    {s.status === "PAUSADA" && (
                      <Button variant="outline" size="sm" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" onClick={() => updateSessionStatus(s.id, "ACTIVA")}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Reanudar
                      </Button>
                    )}
                    {(s.status === "ACTIVA" || s.status === "PAUSADA") && (
                      <Button variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => updateSessionStatus(s.id, "FINALIZADA")}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Cerrar
                      </Button>
                    )}
                    <Button size="sm" asChild className="h-9 shadow-sm bg-primary hover:bg-primary/95 text-white">
                      <Link to={`/app/sesiones/${s.id}`}>
                        Monitorear
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------- Participants (Administración de Participantes) ------------------------- */
export function ParticipantsScreen() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const list = useAdminStore((s) => s.participants);
  const addParticipant = useAdminStore((s) => s.addParticipant);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);
  const carreras = useAdminStore((s) => s.carreras);
  const gruposAcademicos = useAdminStore((s) => s.gruposAcademicos);
  const cohortes = useAdminStore((s) => s.cohortes);
  const sexos = useAdminStore((s) => s.sexos);
  const fetchCarreras = useAdminStore((s) => s.fetchCarreras);
  const fetchGrupos = useAdminStore((s) => s.fetchGrupos);
  const fetchCohortes = useAdminStore((s) => s.fetchCohortes);
  const fetchSexos = useAdminStore((s) => s.fetchSexos);

  useEffect(() => {
    fetchParticipants();
    fetchCarreras();
    fetchGrupos();
    fetchCohortes();
    fetchSexos();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [careerFilter, setCareerFilter] = useState("");

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedSexoId, setSelectedSexoId] = useState("");
  const [selectedCarreraId, setSelectedCarreraId] = useState("");
  const [selectedCohorteId, setSelectedCohorteId] = useState("");
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
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
  const activeSexos = useMemo(
    () => sexos.filter((s) => s.estado === "ACTIVO" && s.id != null),
    [sexos],
  );
  const carreraFilterOptions = activeCarreras.map((c) => ({
    value: String(c.id),
    label: c.nombreCarrera,
    description: c.codigoCarrera,
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
  const grupoOptions = activeGrupos.map((g) => ({
    value: String(g.id),
    label: g.nombreGrupo || g.codigoGrupo,
    description: [g.codigoGrupo, g.carrera?.nombreCarrera].filter(Boolean).join(" · "),
  }));
  const sexoOptions = activeSexos.map((s) => ({
    value: String(s.id),
    label: s.nombre,
    description: s.codigo,
  }));
  const selectedGrupo = activeGrupos.find((g) => String(g.id) === selectedGrupoId);

  useEffect(() => {
    if (selectedGrupo?.carrera?.id && selectedCarreraId !== String(selectedGrupo.carrera.id)) {
      setSelectedCarreraId(String(selectedGrupo.carrera.id));
    }
  }, [selectedGrupo, selectedCarreraId]);

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setBirthDate("");
    setSelectedSexoId("");
    setSelectedCarreraId("");
    setSelectedCohorteId("");
    setSelectedGrupoId("");
    setOpen(true);
  };

  const handleSaveParticipant = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }

    if (!selectedSexoId || !selectedCarreraId || !selectedCohorteId || !selectedGrupoId) {
      alert("Debes seleccionar sexo, carrera, cohorte y grupo.");
      return;
    }

    const parts = name.trim().split(" ");
    const firstNames = parts[0] || "";
    const lastNames = parts.slice(1).join(" ") || "S/A";

    addParticipant({
      code,
      firstNames,
      lastNames,
      fechaNacimiento: birthDate || undefined,
      sexoId: Number(selectedSexoId),
      carreraId: Number(selectedCarreraId),
      cohorteId: Number(selectedCohorteId),
      grupoAcademicoId: Number(selectedGrupoId)
    }).catch(err => {
      alert("Error al registrar participante: " + err.message);
    });

    setOpen(false);
  };

  // Filtrado de participantes
  const filteredList = list.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCareer = !careerFilter || String(p.carreraId) === careerFilter;
    return matchesSearch && matchesCareer;
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap bg-white border-b rounded-t-xl">
        <div>
          <CardTitle className="text-lg text-primary font-bold">Participantes</CardTitle>
          <CardDescription>Registro e información demográfica de los evaluados.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código o nombre…" 
              className="pl-8 w-60 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-52">
            <SearchableCombobox
              value={careerFilter}
              onValueChange={setCareerFilter}
              options={carreraFilterOptions}
              placeholder="Todas las carreras"
              searchPlaceholder="Buscar carrera..."
              emptyMessage="No hay carreras activas."
            />
          </div>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Participante
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Participante</DialogTitle>
                <DialogDescription>Añada un nuevo evaluado. Los datos demográficos son confidenciales.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Field label="Código">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-XXXX" />
                </Field>
                <Field label="Nombre completo">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Juan Pérez" />
                </Field>
                <Field label="Fecha de nacimiento">
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </Field>
                <Field label="Sexo">
                  <SearchableCombobox
                    value={selectedSexoId}
                    onValueChange={setSelectedSexoId}
                    options={sexoOptions}
                    placeholder="Seleccione sexo"
                    searchPlaceholder="Buscar sexo..."
                    emptyMessage="No hay sexos activos."
                  />
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveParticipant}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre</TableHead>
              <TableHead className="font-semibold py-3">Edad</TableHead>
              <TableHead className="font-semibold py-3">Sexo</TableHead>
              <TableHead className="font-semibold py-3">Carrera</TableHead>
              <TableHead className="font-semibold py-3">Grupo</TableHead>
              <TableHead className="font-semibold py-3">Último Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No se encontraron participantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/10 transition">
                  <TableCell className="font-mono text-xs pl-6 py-3">{p.code}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{p.name}</TableCell>
                  <TableCell className="py-3">{p.age} años</TableCell>
                  <TableCell className="py-3">{p.sex === "F" ? "Femenino" : p.sex === "M" ? "Masculino" : "Otro"}</TableCell>
                  <TableCell className="py-3">{p.carrera}</TableCell>
                  <TableCell className="py-3"><Badge variant="secondary" className="font-medium">{p.grupo}</Badge></TableCell>
                  <TableCell className="py-3">
                    <Badge className={
                      p.latestAttemptStatus === "COMPLETADO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" :
                      p.latestAttemptStatus === "EN_PROGRESO" ? "bg-blue-100 text-blue-800 border-none font-medium hover:bg-blue-100" :
                      p.latestAttemptStatus === "INTERRUMPIDO" ? "bg-amber-100 text-amber-800 border-none font-medium hover:bg-amber-100" :
                      p.latestAttemptStatus === "ANULADO" ? "bg-rose-100 text-rose-800 border-none font-medium hover:bg-rose-100" :
                      "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"
                    }>
                      {p.latestAttemptStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-primary/5 hover:text-primary">
                      <Link to={`/app/participantes/${p.id}`}>
                        Detalles
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Image Upload ------------------------- */
export function ImageUploadScreen() {
  const [subtestId, setSubtestId] = useState("figuras");
  const [itemId, setItemId] = useState("1");
  const [optionId, setOptionId] = useState("1");
  const [role, setRole] = useState("modelo");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Error: Por favor, seleccione un archivo primero.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      if (role === "modelo") {
        await instrumentService.uploadImage(file, itemId, undefined, altText, "ENUNCIADO");
      } else {
        await instrumentService.uploadOptionImage(file, optionId, undefined, altText);
      }
      setMessage("¡Imagen cargada exitosamente!");
      setFile(null);
    } catch (error: any) {
      console.error(error);
      setMessage("Error al cargar la imagen: " + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader><CardTitle>Cargar imágenes confidenciales</CardTitle><CardDescription>Las imágenes se cifran y no se mostrarán al participante con opción de descarga.</CardDescription></CardHeader>
        <CardContent>
          <label className="block rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/50">
            <Upload className="h-8 w-8 mx-auto text-primary" />
            <div className="mt-2 font-medium">
              {file ? `Seleccionado: ${file.name}` : "Arrastra o haz clic para subir"}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 2MB.</div>
          </label>

          {message && (
            <div className={`mt-4 p-2.5 text-sm rounded ${message.startsWith("Error") ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Metadatos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Subtest">
            <Select value={subtestId} onValueChange={setSubtestId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="figuras">Figuras idénticas</SelectItem>
                <SelectItem value="desplazamiento">Desplazamiento</SelectItem>
                <SelectItem value="espacial">Espacial</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={role === "modelo" ? "Ítem #" : "Opción #"}>
            {role === "modelo" ? (
              <Input type="number" value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="1" />
            ) : (
              <Input type="number" value={optionId} onChange={(e) => setOptionId(e.target.value)} placeholder="1" />
            )}
          </Field>
          <Field label="Rol en ítem">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="modelo">Modelo</SelectItem>
                <SelectItem value="opc">Opción</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Texto alternativo (interno)">
            <Textarea rows={2} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="No visible al participante" />
          </Field>
          <Button className="w-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir Imagen y Guardar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- Review Tray ------------------------- */
export function ReviewTrayScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = () => {
    setLoading(true);
    resultsService.getPendingReviews().then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleGrade = async (reviewId: string, status: "CORRECTA" | "INCORRECTA") => {
    try {
      await resultsService.submitReview(reviewId, status);
      // Remove item from state list
      setItems(prev => prev.filter(item => item.id !== reviewId));
    } catch (error) {
      console.error(error);
      alert("Error al enviar calificación.");
    }
  };

  if (loading) return <div className="text-center p-8">Cargando bandeja de revisión...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle>Bandeja de revisión manual</CardTitle><CardDescription>Respuestas abiertas que requieren calificación humana.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-6">No hay respuestas pendientes de revisión.</div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="rounded border p-4 grid md:grid-cols-[1fr_auto] gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Hash className="h-3 w-3" />{r.id} · {r.p} · {r.sub} · ítem {r.item}</div>
                <div className="mt-2 text-sm bg-muted/50 rounded p-3 italic">"{r.ans}"</div>
              </div>
              <div className="flex md:flex-col gap-2 items-start md:items-end">
                <Badge variant={r.state === "pendiente" ? "secondary" : "outline"}>{r.state}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleGrade(r.id, "INCORRECTA")}><XCircle className="h-4 w-4 mr-1" /> Incorrecta</Button>
                  <Button size="sm" onClick={() => handleGrade(r.id, "CORRECTA")}><CheckCircle2 className="h-4 w-4 mr-1" /> Correcta</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------- Individual Results ------------------------- */
export function ResultsScreen() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultsService.getResults().then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-8">Cargando resultados...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Resultados de Evaluaciones</CardTitle>
        <CardDescription>Búsqueda y consulta de puntajes individuales.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Resultado</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Sesión</TableHead>
              <TableHead>Puntaje Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                  No hay resultados de evaluaciones registrados.
                </TableCell>
              </TableRow>
            ) : (
              results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.participantName}</TableCell>
                  <TableCell>{r.sessionName}</TableCell>
                  <TableCell className="font-bold">{r.totalScore} pts</TableCell>
                  <TableCell>
                    <Badge className={r.status === "CALCULADO" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/resultados/individual/${r.id}`}>
                        Ver Reporte
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Results Dashboard ------------------------- */
export function ResultsDashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState("a");
  const [grupo, setGrupo] = useState("a");
  const [carrera, setCarrera] = useState("a");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("a");
  const [subtest, setSubtest] = useState("a");

  const loadData = (filters = {}) => {
    setLoading(true);
    resultsService.getDashboardData(filters).then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = () => {
    loadData({
      sessionId: session !== "a" ? session : undefined,
      grupoId: grupo !== "a" ? grupo : undefined,
      carreraId: carrera !== "a" ? carrera : undefined,
      edad: edad || undefined,
      sexo: sexo !== "a" ? sexo : undefined,
      subtestId: subtest !== "a" ? subtest : undefined
    });
  };

  if (loading) return <div className="text-center p-8">Cargando métricas agregadas...</div>;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <Field label="Sesión">
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todas</SelectItem>
                <SelectItem value="SES-2026-06-A">SES-2026-06-A</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Grupo">
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Carrera">
            <Select value={carrera} onValueChange={setCarrera}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Edad">
            <Input className="w-28" placeholder="18–25" value={edad} onChange={(e) => setEdad(e.target.value)} />
          </Field>
          <Field label="Sexo">
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subtest">
            <Select value={subtest} onValueChange={setSubtest}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleApply}><Filter className="h-4 w-4 mr-1" /> Aplicar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Media por subtest</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={data?.bySubtest}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="sub" /><YAxis /><Tooltip /><Bar dataKey="media" fill="#0f2649" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Tendencia por edad</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={data?.byAge}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" /><YAxis /><Tooltip /><Line type="monotone" dataKey="m" stroke="#b91c1c" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Distribución por sexo</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={data?.bySex} dataKey="v" nameKey="n" outerRadius={80}>{data?.bySex.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------- Reports Center ------------------------- */
export function ReportsScreen() {
  const reports = [
    { type: "INDIVIDUAL", name: "Resultados individuales", desc: "Detalle por participante con puntajes y subtests.", icon: FileText },
    { type: "AGREGADO", name: "Resultados agregados", desc: "Resumen estadístico filtrable por grupo y carrera.", icon: FileBarChart },
    { type: "AUDITORIA", name: "Auditoría de sesiones", desc: "Eventos por sesión: inicio, fin, interrupciones.", icon: ShieldCheck },
    { type: "INSTRUMENTOS", name: "Inventario de instrumentos", desc: "Versiones publicadas y subtests activos.", icon: ClipboardList },
  ];

  const handleDownload = async (type: string, format: "PDF" | "XLSX" | "CSV") => {
    try {
      await resultsService.downloadReport(type, format);
    } catch (error) {
      console.error("Error al descargar reporte", error);
      alert("Error al descargar reporte. Asegúrese de que el backend esté disponible.");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {reports.map((r) => (
        <Card key={r.name} className="border-0 shadow-sm">
          <CardContent className="p-5 flex gap-4 items-start">
            <div className="h-12 w-12 rounded bg-accent text-primary flex items-center justify-center"><r.icon className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.desc}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "PDF")}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "XLSX")}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "CSV")}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------- Audit ------------------------- */
export function AuditScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLogs().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-8">Cargando bitácora de auditoría...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div><CardTitle>Auditoría</CardTitle><CardDescription>Registro inmutable de acciones del sistema.</CardDescription></div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Usuario" className="w-32" />
          <Input placeholder="Acción" className="w-32" />
          <Input type="date" className="w-40" />
          <Input placeholder="IP" className="w-32" />
          <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Filtrar</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                  No hay registros de auditoría disponibles.
                </TableCell>
              </TableRow>
            ) : (
              events.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{e.d}</TableCell>
                  <TableCell>{e.u}</TableCell>
                  <TableCell><Badge variant="secondary">{e.a}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.e}</TableCell>
                  <TableCell className="font-mono text-xs">{e.ip}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Users & Roles ------------------------- */
export function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Aplicador");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminService.getUsers(),
      adminService.getPermissionsMatrix()
    ]).then(([usersData, permsData]) => {
      setUsers(usersData);
      setPerms(permsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async () => {
    if (!name || !email) {
      alert("Por favor rellene todos los campos.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createUser({
        n: name,
        e: email,
        r: role,
        s: true
      });
      setIsOpen(false);
      setName("");
      setEmail("");
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8">Cargando usuarios y matriz de permisos...</div>;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Usuarios</CardTitle><CardDescription>Personal interno con acceso al sistema.</CardDescription></div>
          <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo usuario</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.e}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent text-primary text-xs">{u.n?.split(" ").map((x: string) => x[0]).slice(0, 2).join("") || "U"}</AvatarFallback></Avatar>
                        <span className="text-sm font-medium">{u.n}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.e}</TableCell>
                    <TableCell><Badge variant="secondary">{u.r}</Badge></TableCell>
                    <TableCell>{u.s ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">activo</Badge> : <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">inactivo</Badge>}</TableCell>
                    <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Matriz de permisos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {perms.map((p) => (
            <div key={p.k}>
              <div className="text-sm font-medium">{p.k}</div>
              <div className="mt-1 flex flex-wrap gap-1">{p.roles.map((r: string) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Registra un nuevo usuario en el sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Nombre Completo">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Dr. Juan Pérez" />
            </Field>
            <Field label="Correo Electrónico">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@uam.edu.ni" />
            </Field>
            <Field label="Rol Asignado">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                  <SelectItem value="Aplicador">Aplicador</SelectItem>
                  <SelectItem value="Consultor">Consultor</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? "Registrando..." : "Registrar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
