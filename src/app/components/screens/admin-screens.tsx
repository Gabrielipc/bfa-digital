import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAdminStore } from "../../../store/adminStore";
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
import {
  Activity, Users, ClipboardList, FileBarChart, ShieldCheck, ImageUp, ListChecks,
  Plus, Copy, RotateCw, Filter, Download, FileText, FileSpreadsheet, Search, MoreHorizontal,
  Lock, Unlock, CheckCircle2, XCircle, AlertTriangle, Eye, Upload, Image as ImageIcon,
  ChevronRight, Inbox, Calendar, MapPin, Clock, Hash, KeyRound, Trash2, Pencil, Send, Play, Pause
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { adminService, downloadDataFile, toCsv } from "../../../api/adminService";

const COLORS = ["#0f2649", "#1e4e8c", "#b91c1c", "#64748b", "#10b981", "#f59e0b"];

/* ------------------------- Dashboard ------------------------- */
export function DashboardScreen() {
  const sessions = useAdminStore((s) => s.sessions);
  const assignments = useAdminStore((s) => s.assignments);
  const participants = useAdminStore((s) => s.participants);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const fetchAssignments = useAdminStore((s) => s.fetchAssignments);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);
  const error = useAdminStore((s) => s.error);

  useEffect(() => {
    fetchSessions();
    fetchParticipants();
  }, []);

  useEffect(() => {
    sessions.forEach((session) => {
      if (!assignments[session.id]) {
        fetchAssignments(session.id);
      }
    });
  }, [sessions.length]);

  const allAssignments = Object.values(assignments).flat();
  const activeSessions = sessions.filter((s) => s.status === "ACTIVA").length;
  const completedAttempts = allAssignments.filter((a) => a.state === "completado").length;
  const inReview = allAssignments.filter((a) => a.state === "interrumpido").length;
  const today = new Date().toISOString().slice(0, 10);
  const participantsToday = sessions
    .filter((s) => s.date === today)
    .reduce((total, s) => total + (assignments[s.id]?.length || 0), 0);

  const kpis = [
    { label: "Sesiones activas", value: String(activeSessions), icon: Activity, accent: "text-emerald-600" },
    { label: "Participantes hoy", value: String(participantsToday), icon: Users, accent: "text-primary" },
    { label: "Pendientes / incidencias", value: String(inReview), icon: ListChecks, accent: "text-amber-600" },
    { label: "Intentos completados", value: String(completedAttempts), icon: CheckCircle2, accent: "text-primary" },
  ];

  const data = sessions.slice(-7).map((session) => ({
    d: session.date || session.code,
    c: assignments[session.id]?.filter((a) => a.state === "completado").length || 0,
  }));

  const upcomingSessions = sessions
    .filter((s) => s.status === "PLANIFICADA" || s.status === "ACTIVA")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
            {data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                Sin sesiones registradas para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="d" /><YAxis allowDecimals={false} /><Tooltip />
                  <Bar dataKey="c" fill="#0f2649" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Próximas sesiones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                No hay sesiones planificadas o activas.
              </div>
            ) : upcomingSessions.map((session) => (
              <Link key={session.id} to={`/app/sesiones/${session.id}`} className="flex items-center gap-3 p-3 rounded border hover:bg-muted/40">
                <div className="h-9 w-9 rounded bg-accent text-primary flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                <div className="flex-1 text-sm min-w-0">
                  <div className="font-medium truncate">{session.name}</div>
                  <div className="text-xs text-muted-foreground">{session.date || "Sin fecha"} · {session.time || "Sin hora"} · {participants.length} participantes registrados</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------- Session Create (Aplicador) ------------------------- */
export function SessionCreateScreen() {
  const navigate = useNavigate();
  const participantsList = useAdminStore((s) => s.participants);
  const createSession = useAdminStore((s) => s.createSession);
  const publishedVersions = useAdminStore((s) => s.publishedVersions);
  const versionSubtests = useAdminStore((s) => s.versionSubtests);
  const fetchPublishedVersions = useAdminStore((s) => s.fetchPublishedVersions);
  const fetchVersionSubtests = useAdminStore((s) => s.fetchVersionSubtests);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);

  // Form states
  const [sessionName, setSessionName] = useState("SES-2026-06-D · Psicología III");
  const [groupName, setGroupName] = useState("Psicología — 3er año");
  const [date, setDate] = useState("2026-06-10");
  const [time, setTime] = useState("14:00");
  const [location, setLocation] = useState("Laboratorio cognitivo · UAM");
  const [selectedVersionId, setSelectedVersionId] = useState<number | "">("");

  const [selectedSubtestIds, setSelectedSubtestIds] = useState<number[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [copiedTokenIdx, setCopiedTokenIdx] = useState<number | null>(null);
  const [newlyCreatedSessionId, setNewlyCreatedSessionId] = useState<string>("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchPublishedVersions();
    fetchParticipants();
  }, []);

  const currentSubtests = selectedVersionId ? versionSubtests[String(selectedVersionId)] || [] : [];

  useEffect(() => {
    if (selectedVersionId) {
      fetchVersionSubtests(String(selectedVersionId));
    }
  }, [selectedVersionId]);

  useEffect(() => {
    if (currentSubtests.length > 0) {
      setSelectedSubtestIds(currentSubtests.map((s) => s.id));
    } else {
      setSelectedSubtestIds([]);
    }
  }, [currentSubtests]);

  const sessionAssignments = newlyCreatedSessionId ? useAdminStore.getState().assignments[newlyCreatedSessionId] || [] : [];

  const handleGenerate = async () => {
    setFormError("");
    if (!selectedVersionId) {
      setFormError("Debes seleccionar una versión de test.");
      return;
    }

    if (selectedSubtestIds.length === 0) {
      setFormError("Debes seleccionar al menos un subtest.");
      return;
    }

    if (assignedIds.length === 0) {
      setFormError("Debes asignar al menos un participante.");
      return;
    }

    // Generar código único para la sesión
    const newCode = `SES-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
    setSessionCode(newCode);

    const scheduledStart = `${date}T${time}:00`;
    const scheduledEnd = `${date}T23:59:59`;

    const subtestConfigs = selectedSubtestIds.map((subtestId, index) => {
      const orig = currentSubtests.find((s) => s.id === subtestId);
      return {
        subtestId,
        order: index + 1,
        timeLimitSeconds: orig?.tiempoLimiteSegundos || 300,
        randomizeItems: orig?.permiteAleatorizarItems || false,
        randomizeOptions: orig?.permiteAleatorizarOpciones || false,
      };
    });

    try {
      await createSession(
        {
          versionTestId: Number(selectedVersionId),
          code: newCode,
          name: sessionName,
          description: groupName,
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
      setFormError(`Error al crear la sesión: ${err.message}`);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary font-bold">Datos de la sesión</CardTitle>
            <CardDescription>Configure los datos principales de la sesión evaluativa.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Nombre de sesión">
              <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </Field>
            <Field label="Grupo / carrera">
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Hora de apertura">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
            <Field label="Ubicación">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Versión de Test">
              <Select value={String(selectedVersionId)} onValueChange={(val) => setSelectedVersionId(Number(val))}>
                <SelectTrigger><SelectValue placeholder="Seleccione versión..." /></SelectTrigger>
                <SelectContent>
                  {publishedVersions.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      v{v.numeroVersion} ({v.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

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
                  <DialogDescription>Seleccione los participantes que tomarán la prueba.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-2 py-4">
                  {participantsList.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No hay participantes registrados.
                    </div>
                  ) : (
                    participantsList.map((p) => {
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
                            <div className="text-xs text-muted-foreground font-medium">{p.id} · {p.carrera} · {p.grupo}</div>
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
                        <div className="text-xs text-muted-foreground font-medium">{p.id} · {p.carrera} · {p.grupo}</div>
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
  const storeError = useAdminStore((s) => s.error);
  const loading = useAdminStore((s) => s.loading);

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [careerFilter, setCareerFilter] = useState("all");

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"F" | "M" | "O">("F");
  const [carrera, setCarrera] = useState("");
  const [grupo, setGrupo] = useState("");
  const [formError, setFormError] = useState("");

  const handleOpenDialog = () => {
    // Generar código autoincrementable sugerido
    const nextNum = list.length + 185;
    setCode(`P-0${nextNum}`);
    setName("");
    setAge("21");
    setSex("F");
    setCarrera("Psicología");
    setGrupo("3A");
    setFormError("");
    setOpen(true);
  };

  const handleSaveParticipant = async () => {
    if (!code || !name) {
      setFormError("El código y nombre son requeridos.");
      return;
    }

    const parts = name.trim().split(" ");
    const firstNames = parts[0] || "";
    const lastNames = parts.slice(1).join(" ") || "S/A";

    try {
      await addParticipant({
        code,
        firstNames,
        lastNames
      });
      setOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Error al registrar participante.");
    }
  };

  // Filtrado de participantes
  const filteredList = list.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCareer = careerFilter === "all" || 
                          p.carrera.toLowerCase().includes(careerFilter.toLowerCase());
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
          <Select value={careerFilter} onValueChange={setCareerFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carreras</SelectItem>
              <SelectItem value="psicologia">Psicología</SelectItem>
              <SelectItem value="medicina">Medicina</SelectItem>
              <SelectItem value="ingenieria">Ingeniería</SelectItem>
              <SelectItem value="derecho">Derecho</SelectItem>
            </SelectContent>
          </Select>
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
                <Field label="Edad">
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                </Field>
                <Field label="Sexo">
                  <Select value={sex} onValueChange={(v: any) => setSex(v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="O">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Carrera">
                  <Input value={carrera} onChange={(e) => setCarrera(e.target.value)} placeholder="ej: Psicología" />
                </Field>
                <Field label="Grupo">
                  <Input value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="ej: 3A" />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveParticipant} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {(storeError || formError) && (
        <div className="px-6 pt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{formError || storeError}</AlertDescription>
          </Alert>
        </div>
      )}
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
                  <TableCell className="font-mono text-xs pl-6 py-3">{p.id}</TableCell>
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

/* ------------------------- Instruments Config ------------------------- */
const DEFAULT_ITEM_OPTIONS = ["A", "B", "C", "D"];

export function InstrumentsScreen() {
  const [tests, setTests] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [configuration, setConfiguration] = useState<any | null>(null);
  const [selectedSubtestId, setSelectedSubtestId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [subtestDialogOpen, setSubtestDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingSubtest, setEditingSubtest] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [testForm, setTestForm] = useState({ code: "", name: "", description: "" });
  const [versionForm, setVersionForm] = useState({ number: "", instructions: "", timeLimitSeconds: "" });
  const [subtestForm, setSubtestForm] = useState({ code: "", name: "", description: "", instructions: "", order: "", timeLimitSeconds: "" });
  const [itemForm, setItemForm] = useState({
    code: "",
    prompt: "",
    itemType: "TEXTO_E_IMAGEN",
    responseType: "OPCION_UNICA",
    order: "",
    baseScore: "1",
    correctOptionCode: "A",
    options: DEFAULT_ITEM_OPTIONS.map((code, index) => ({ code, text: `Opción ${code}`, order: index + 1 })),
  });

  const normalizeVersionId = (value: unknown) => value == null ? null : Number(value);
  const selectedVersion = versions.find((v) => Number(v.id) === selectedVersionId);
  const isDraft = selectedVersion?.estado === "BORRADOR";
  const subtests = configuration?.subtests || [];
  const selectedSubtest = subtests.find((s: any) => Number(s.id) === selectedSubtestId) || subtests[0] || null;

  const loadTests = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await adminService.listTests();
      setTests(rows);
      const firstId = selectedTestId || rows[0]?.id || null;
      setSelectedTestId(firstId);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los instrumentos.");
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (testId: number | null) => {
    if (!testId) {
      setVersions([]);
      setSelectedVersionId(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await adminService.listVersions(testId);
      setVersions(rows);
      setSelectedVersionId((prev) => prev && rows.some((v) => v.id === prev) ? prev : rows[0]?.id || null);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar las versiones.");
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async (versionId: number | null) => {
    if (!versionId) {
      setConfiguration(null);
      setSelectedSubtestId(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminService.getVersionConfiguration(versionId);
      setConfiguration(data);
      setSelectedSubtestId((prev) => {
        if (prev && data.subtests?.some((s: any) => Number(s.id) === prev)) return prev;
        return data.subtests?.[0]?.id ? Number(data.subtests[0].id) : null;
      });
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la configuración de la versión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    loadVersions(selectedTestId);
  }, [selectedTestId]);

  useEffect(() => {
    loadConfiguration(selectedVersionId);
  }, [selectedVersionId]);

  const handleCreateTest = async () => {
    if (!testForm.code.trim() || !testForm.name.trim()) {
      setError("Codigo y nombre de prueba son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await adminService.createTest(testForm);
      setTestDialogOpen(false);
      setTestForm({ code: "", name: "", description: "" });
      await loadTests();
      setSelectedTestId(created.id);
    } catch (err: any) {
      setError(err.message || "No se pudo crear la prueba.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedTestId || !versionForm.number.trim()) {
      setError("Seleccione prueba y escriba numero de version.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await adminService.createVersion(selectedTestId, {
        number: versionForm.number.trim(),
        strategyId: 1,
        instructions: versionForm.instructions.trim() || undefined,
        timeLimitSeconds: versionForm.timeLimitSeconds ? Number(versionForm.timeLimitSeconds) : undefined,
        randomizeItems: false,
        randomizeSubtests: false,
      });
      setVersionDialogOpen(false);
      setVersionForm({ number: "", instructions: "", timeLimitSeconds: "" });
      await loadVersions(selectedTestId);
      setSelectedVersionId(created.id);
    } catch (err: any) {
      setError(err.message || "No se pudo crear la version.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtest = async () => {
    if (!selectedVersionId || !subtestForm.code.trim() || !subtestForm.name.trim()) {
      setError("Version, codigo y nombre de subtest son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        code: subtestForm.code.trim(),
        name: subtestForm.name.trim(),
        description: subtestForm.description.trim() || undefined,
        instructions: subtestForm.instructions.trim() || undefined,
        order: subtestForm.order ? Number(subtestForm.order) : subtests.length + 1,
        timeLimitSeconds: subtestForm.timeLimitSeconds ? Number(subtestForm.timeLimitSeconds) : undefined,
        randomizeItems: false,
        randomizeOptions: false,
        required: true,
      };
      if (editingSubtest) {
        await adminService.updateSubtest(editingSubtest.id, payload);
      } else {
        await adminService.createSubtest(selectedVersionId, payload);
      }
      setSubtestDialogOpen(false);
      setEditingSubtest(null);
      resetSubtestForm();
      await loadConfiguration(selectedVersionId);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el subtest.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedVersionId) return;
    setLoading(true);
    setError("");
    try {
      if (selectedVersion?.estado !== "APROBADO") {
        await adminService.approveVersion(selectedVersionId);
      }
      await adminService.publishVersion(selectedVersionId);
      await loadVersions(selectedTestId);
    } catch (err: any) {
      setError(err.message || "No se pudo publicar la version. Verifique estructura minima y estado.");
    } finally {
      setLoading(false);
    }
  };

  const resetSubtestForm = () => {
    setSubtestForm({ code: "", name: "", description: "", instructions: "", order: "", timeLimitSeconds: "" });
  };

  const openSubtestDialog = (subtest?: any) => {
    setEditingSubtest(subtest || null);
    setSubtestForm(subtest ? {
      code: subtest.code || "",
      name: subtest.name || "",
      description: subtest.description || "",
      instructions: subtest.instructions || "",
      order: String(subtest.order || ""),
      timeLimitSeconds: subtest.timeLimitSeconds ? String(subtest.timeLimitSeconds) : "",
    } : {
      code: "",
      name: "",
      description: "",
      instructions: "",
      order: String(subtests.length + 1),
      timeLimitSeconds: "",
    });
    setSubtestDialogOpen(true);
  };

  const resetItemForm = () => {
    setItemForm({
      code: "",
      prompt: "",
      itemType: "TEXTO_E_IMAGEN",
      responseType: "OPCION_UNICA",
      order: selectedSubtest?.items?.length ? String(selectedSubtest.items.length + 1) : "1",
      baseScore: "1",
      correctOptionCode: "A",
      options: DEFAULT_ITEM_OPTIONS.map((code, index) => ({ code, text: `Opción ${code}`, order: index + 1 })),
    });
  };

  const openItemDialog = (item?: any) => {
    setEditingItem(item || null);
    const options = DEFAULT_ITEM_OPTIONS.map((code, index) => {
      const existing = item?.options?.find((option: any) => option.code === code);
      return {
        code,
        text: existing?.text || `Opción ${code}`,
        order: existing?.order || index + 1,
      };
    });
    setItemForm(item ? {
      code: item.code || "",
      prompt: item.prompt || "",
      itemType: item.itemType || "TEXTO_E_IMAGEN",
      responseType: item.responseType || "OPCION_UNICA",
      order: String(item.order || ""),
      baseScore: item.baseScore != null ? String(item.baseScore) : "1",
      correctOptionCode: item.answerKey?.correctOptionCode || "A",
      options,
    } : {
      code: selectedSubtest ? `${selectedSubtest.code}-${String((selectedSubtest.items?.length || 0) + 1).padStart(3, "0")}` : "",
      prompt: selectedSubtest?.instructions || "Seleccione la opción correcta",
      itemType: "TEXTO_E_IMAGEN",
      responseType: "OPCION_UNICA",
      order: selectedSubtest?.items?.length ? String(selectedSubtest.items.length + 1) : "1",
      baseScore: "1",
      correctOptionCode: "A",
      options,
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!selectedSubtest || !itemForm.code.trim() || !itemForm.order) {
      setError("Subtest, código y número de pregunta son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        code: itemForm.code.trim(),
        itemType: itemForm.itemType,
        responseType: itemForm.responseType,
        prompt: itemForm.prompt.trim() || undefined,
        order: Number(itemForm.order),
        baseScore: itemForm.baseScore ? Number(itemForm.baseScore) : 1,
        required: true,
        confidential: true,
      };
      const savedItem = editingItem
        ? await adminService.updateItem(editingItem.id, payload)
        : await adminService.createItem(selectedSubtest.id, payload);
      const existingOptions = editingItem?.options || [];
      const savedOptions = await Promise.all(itemForm.options.map((option) => {
        const existing = existingOptions.find((row: any) => row.code === option.code);
        const optionPayload = { code: option.code, text: option.text, order: option.order, ordinalValue: option.order };
        return existing
          ? adminService.updateOption(existing.id, optionPayload)
          : adminService.createOption(savedItem.id, optionPayload);
      }));
      const correct = savedOptions.find((option: any) => option.code === itemForm.correctOptionCode);
      if (correct?.id) {
        await adminService.upsertAnswerKey(savedItem.id, {
          ruleId: editingItem?.answerKey?.ruleId,
          correctOptionId: correct.id,
          score: itemForm.baseScore ? Number(itemForm.baseScore) : 1,
          requiresManualReview: false,
        });
      }
      setItemDialogOpen(false);
      setEditingItem(null);
      resetItemForm();
      await loadConfiguration(selectedVersionId);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el ítem completo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number | string) => {
    if (!selectedVersionId) return;
    setLoading(true);
    setError("");
    try {
      await adminService.deleteItem(itemId);
      await loadConfiguration(selectedVersionId);
    } catch (err: any) {
      setError(err.message || "No se pudo desactivar el ítem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Versiones publicadas bloqueadas</AlertTitle>
        <AlertDescription>Las versiones publicadas no pueden modificarse. Para realizar cambios, cree una nueva versión.</AlertDescription>
      </Alert>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] min-w-0">
        <Card className="border-0 shadow-sm min-w-0">
          <CardHeader className="px-4 pt-4"><CardTitle>Pruebas</CardTitle><CardDescription>Tests registrados</CardDescription></CardHeader>
          <CardContent className="space-y-2 px-4">
            {tests.length === 0 && (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">Sin pruebas registradas.</div>
            )}
            {tests.map((test) => (
              <button key={test.id} onClick={() => setSelectedTestId(test.id)} className={`w-full flex items-center gap-2 justify-between p-2 rounded border hover:bg-muted text-left min-w-0 ${selectedTestId === test.id ? "border-primary bg-accent/30" : ""}`}>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{test.codigoTest}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{test.nombreTest}</div>
                </div>
                <Badge variant={test.estado === "ACTIVO" ? "secondary" : "outline"}>{test.estado}</Badge>
              </button>
            ))}
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2" size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva prueba</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva prueba</DialogTitle><DialogDescription>Persistida en PostgreSQL via backend.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                  <Field label="Codigo"><Input value={testForm.code} onChange={(e) => setTestForm({ ...testForm, code: e.target.value })} /></Field>
                  <Field label="Nombre"><Input value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} /></Field>
                  <Field label="Descripcion"><Textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} /></Field>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateTest} disabled={loading}>Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col gap-3 px-4 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0"><CardTitle className="truncate">{selectedVersion ? `v${selectedVersion.numeroVersion} · ${selectedVersion.estado}` : "Seleccione una version"}</CardTitle><CardDescription>Subtests, preguntas, opciones y claves</CardDescription></div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} disabled={!selectedVersionId || loading}><Eye className="h-4 w-4 mr-1" /> Vista previa</Button>
              <Button size="sm" onClick={handlePublish} disabled={!selectedVersionId || !["BORRADOR", "EN_REVISION", "APROBADO"].includes(selectedVersion?.estado) || loading}><CheckCircle2 className="h-4 w-4 mr-1" /> Publicar versión</Button>
            </div>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)] min-w-0">
              <div className="space-y-2 min-w-0">
                {versions.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVersionId(normalizeVersionId(v.id))} className={`w-full flex items-center justify-between gap-2 p-2 rounded border hover:bg-muted text-left min-w-0 ${selectedVersionId === Number(v.id) ? "border-primary bg-accent/30" : ""}`}>
                    <span className="text-sm font-medium truncate">v{v.numeroVersion}</span>
                    {v.estado === "PUBLICADO" ? <Badge><Lock className="h-3 w-3 mr-1" /> publicada</Badge>
                      : <Badge variant="secondary"><Unlock className="h-3 w-3 mr-1" /> {String(v.estado).toLowerCase()}</Badge>}
                  </button>
                ))}
                <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full" disabled={!selectedTestId}><Plus className="h-4 w-4 mr-1" /> Nueva versión</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nueva version</DialogTitle><DialogDescription>Se crea en estado BORRADOR.</DialogDescription></DialogHeader>
                    <div className="space-y-3">
                      <Field label="Numero"><Input value={versionForm.number} onChange={(e) => setVersionForm({ ...versionForm, number: e.target.value })} placeholder="2.2" /></Field>
                      <Field label="Instrucciones"><Textarea value={versionForm.instructions} onChange={(e) => setVersionForm({ ...versionForm, instructions: e.target.value })} /></Field>
                      <Field label="Tiempo limite segundos"><Input type="number" value={versionForm.timeLimitSeconds} onChange={(e) => setVersionForm({ ...versionForm, timeLimitSeconds: e.target.value })} /></Field>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setVersionDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateVersion} disabled={loading}>Guardar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground min-w-0">
                    {isDraft ? "Configuración editable de la versión en borrador." : "Esta versión no se puede modificar."}
                  </div>
                  <Button className="shrink-0" variant="outline" size="sm" disabled={!selectedVersionId || !isDraft} onClick={() => openSubtestDialog()}><Plus className="h-4 w-4 mr-1" /> Subtest</Button>
                </div>
                {subtests.length === 0 ? (
                  <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">Sin subtests reales para esta versión.</div>
                ) : (
                  <div className="space-y-4 min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {subtests.map((subtest: any) => (
                        <Button key={subtest.id} size="sm" variant={Number(subtest.id) === Number(selectedSubtest?.id) ? "default" : "outline"} onClick={() => setSelectedSubtestId(Number(subtest.id))}>
                          {subtest.name}
                        </Button>
                      ))}
                    </div>
                    {selectedSubtest && (
                      <>
                        <div className="grid gap-3 rounded border p-3 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]">
                          <div className="min-w-0"><div className="text-xs text-muted-foreground">Subtest</div><div className="font-medium truncate">{selectedSubtest.name}</div></div>
                          <div><div className="text-xs text-muted-foreground">Tiempo límite</div><div className="font-medium">{selectedSubtest.timeLimitSeconds ? Math.round(selectedSubtest.timeLimitSeconds / 60) : "-"} min</div></div>
                          <div><div className="text-xs text-muted-foreground">Total ítems</div><div className="font-medium">{selectedSubtest.items?.length || 0}</div></div>
                          <div className="flex justify-end gap-2 shrink-0">
                            <Button variant="outline" size="sm" disabled={!isDraft} onClick={() => openSubtestDialog(selectedSubtest)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" disabled={!isDraft} onClick={() => openItemDialog()}><Plus className="h-4 w-4 mr-1" /> Ítem</Button>
                          </div>
                        </div>
                        <div className="min-w-0 overflow-hidden rounded border">
                        <Table className="min-w-[820px]">
                          <TableHeader>
                            <TableRow><TableHead>#</TableHead><TableHead>Enunciado</TableHead><TableHead>Tipo</TableHead><TableHead>Opciones</TableHead><TableHead>Clave</TableHead><TableHead>Puntaje</TableHead><TableHead className="text-right">Editar</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedSubtest.items || []).length === 0 ? (
                              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin preguntas en este subtest.</TableCell></TableRow>
                            ) : selectedSubtest.items.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.order}</TableCell>
                                <TableCell className="max-w-[320px]"><div className="font-medium truncate">{item.prompt || "Sin enunciado"}</div><div className="text-xs text-muted-foreground truncate">{item.code}</div></TableCell>
                                <TableCell><Badge variant="secondary">{String(item.itemType || "").replaceAll("_", " ").toLowerCase()}</Badge></TableCell>
                                <TableCell>{(item.options || []).map((option: any) => option.code).join(" · ") || "-"}</TableCell>
                                <TableCell>{item.answerKey?.correctOptionCode ? <Badge className="gap-1"><KeyRound className="h-3 w-3" /> {item.answerKey.correctOptionCode}</Badge> : <Badge variant="outline">Sin clave</Badge>}</TableCell>
                                <TableCell>{item.answerKey?.score ?? item.baseScore ?? 1}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" disabled={!isDraft} onClick={() => openItemDialog(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" disabled={!isDraft || loading} onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={subtestDialogOpen} onOpenChange={(open) => { setSubtestDialogOpen(open); if (!open) setEditingSubtest(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSubtest ? "Editar subtest" : "Crear subtest"}</DialogTitle><DialogDescription>Se guarda en la versión en borrador.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Código"><Input value={subtestForm.code} onChange={(e) => setSubtestForm({ ...subtestForm, code: e.target.value })} /></Field>
              <Field label="Orden"><Input type="number" value={subtestForm.order} onChange={(e) => setSubtestForm({ ...subtestForm, order: e.target.value })} /></Field>
            </div>
            <Field label="Nombre"><Input value={subtestForm.name} onChange={(e) => setSubtestForm({ ...subtestForm, name: e.target.value })} /></Field>
            <Field label="Descripción"><Textarea value={subtestForm.description} onChange={(e) => setSubtestForm({ ...subtestForm, description: e.target.value })} /></Field>
            <Field label="Instrucciones"><Textarea value={subtestForm.instructions} onChange={(e) => setSubtestForm({ ...subtestForm, instructions: e.target.value })} /></Field>
            <Field label="Tiempo límite segundos"><Input type="number" value={subtestForm.timeLimitSeconds} onChange={(e) => setSubtestForm({ ...subtestForm, timeLimitSeconds: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSubtestDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateSubtest} disabled={loading}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={(open) => { setItemDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-3xl max-h-[86vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem ? "Editar ítem" : "Crear ítem"}</DialogTitle><DialogDescription>Pregunta, tipo, opciones y clave en un solo flujo.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Número de pregunta"><Input type="number" value={itemForm.order} onChange={(e) => setItemForm({ ...itemForm, order: e.target.value })} /></Field>
              <Field label="Código"><Input value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} /></Field>
              <Field label="Puntaje"><Input type="number" value={itemForm.baseScore} onChange={(e) => setItemForm({ ...itemForm, baseScore: e.target.value })} /></Field>
            </div>
            <Field label="Enunciado"><Textarea value={itemForm.prompt} onChange={(e) => setItemForm({ ...itemForm, prompt: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Tipo"><Select value={itemForm.itemType} onValueChange={(value) => setItemForm({ ...itemForm, itemType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TEXTO_E_IMAGEN">Texto e imagen</SelectItem><SelectItem value="SOLO_IMAGEN">Solo imagen</SelectItem><SelectItem value="SOLO_TEXTO">Solo texto</SelectItem><SelectItem value="COMPARACION_IMAGENES">Comparación de imágenes</SelectItem></SelectContent></Select></Field>
              <Field label="Respuesta"><Select value={itemForm.responseType} onValueChange={(value) => setItemForm({ ...itemForm, responseType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OPCION_UNICA">Opción única</SelectItem><SelectItem value="OPCION_MULTIPLE">Opción múltiple</SelectItem><SelectItem value="TEXTO_ABIERTO">Texto abierto</SelectItem><SelectItem value="NUMERICA">Numérica</SelectItem></SelectContent></Select></Field>
            </div>
            <div className="rounded border p-3 space-y-3">
              <div className="text-sm font-medium">Opciones</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {itemForm.options.map((option, index) => (
                  <Field key={option.code} label={`Opción ${option.code}`}>
                    <Input value={option.text} onChange={(e) => {
                      const options = [...itemForm.options];
                      options[index] = { ...options[index], text: e.target.value };
                      setItemForm({ ...itemForm, options });
                    }} />
                  </Field>
                ))}
              </div>
            </div>
            <Field label="Clave">
              <Select value={itemForm.correctOptionCode} onValueChange={(value) => setItemForm({ ...itemForm, correctOptionCode: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{itemForm.options.map((option) => <SelectItem key={option.code} value={option.code}>{option.code}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem} disabled={loading}>Guardar ítem</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[86vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Vista previa administrativa</DialogTitle><DialogDescription>Contenido actual de la versión seleccionada.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {subtests.length === 0 ? <div className="rounded border border-dashed p-6 text-sm text-muted-foreground">Sin subtests para mostrar.</div> : subtests.map((subtest: any) => (
              <div key={subtest.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="font-semibold">{subtest.name}</div><div className="text-xs text-muted-foreground">{subtest.code} · {subtest.items?.length || 0} ítems</div></div>
                  <Badge variant="secondary">{subtest.timeLimitSeconds ? `${Math.round(subtest.timeLimitSeconds / 60)} min` : "Sin límite"}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {(subtest.items || []).slice(0, 8).map((item: any) => (
                    <div key={item.id} className="rounded bg-muted/40 p-2 text-sm">
                      <div className="font-mono text-xs text-muted-foreground">#{item.order} · {item.code} · clave {item.answerKey?.correctOptionCode || "-"}</div>
                      <div>{item.prompt || "Sin enunciado"}</div>
                    </div>
                  ))}
                  {(subtest.items || []).length > 8 && <div className="text-xs text-muted-foreground">Mostrando 8 de {subtest.items.length} ítems.</div>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------- Image Upload ------------------------- */
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export function ImageUploadScreen() {
  const [tests, setTests] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [subtests, setSubtests] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedSubtestId, setSelectedSubtestId] = useState("");
  const [questionNumber, setQuestionNumber] = useState("");
  const [role, setRole] = useState("MODELO");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedItem = items.find((item) => String(item.order || item.numeroOrden) === questionNumber);

  const loadTestsForImages = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const rows = await adminService.listTests();
      setTests(rows);
      if (!selectedTestId && rows[0]?.id) setSelectedTestId(String(rows[0].id));
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar las pruebas.");
    } finally {
      setLoading(false);
    }
  };

  const loadVersionsForTest = async (testId: string) => {
    if (!testId) {
      setVersions([]);
      setSelectedVersionId("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await adminService.listVersions(testId);
      setVersions(rows);
      const draft = rows.find((version: any) => version.estado === "BORRADOR");
      setSelectedVersionId(String((draft || rows[0])?.id || ""));
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar las versiones.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubtestsForVersion = async (versionId: string) => {
    if (!versionId) {
      setSubtests([]);
      setSelectedSubtestId("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await adminService.listSubtests(versionId);
      setSubtests(rows);
      setSelectedSubtestId(String(rows[0]?.id || ""));
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los subtests.");
    } finally {
      setLoading(false);
    }
  };

  const loadItemsForSubtest = async (subtestId: string) => {
    if (!subtestId) {
      setItems([]);
      setQuestionNumber("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await adminService.listItems(subtestId);
      setItems(rows);
      setQuestionNumber(String(rows[0]?.order || rows[0]?.numeroOrden || ""));
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    if (!selectedTestId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const rows = selectedSubtestId
        ? await adminService.listSubtestImages(selectedSubtestId)
        : await adminService.listTestImages(selectedTestId);
      Object.values(imageUrls).forEach(URL.revokeObjectURL);
      const entries = await Promise.all(rows.map(async (image: any) => [
        String(image.id),
        await adminService.loadItemImageObjectUrl(image.url),
      ] as const));
      setImages(rows);
      setImageUrls(Object.fromEntries(entries));
    } catch (err: any) {
      setError(err.message || "No se pudieron listar las imágenes del test.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestsForImages();
  }, []);

  useEffect(() => {
    loadVersionsForTest(selectedTestId);
  }, [selectedTestId]);

  useEffect(() => {
    loadSubtestsForVersion(selectedVersionId);
  }, [selectedVersionId]);

  useEffect(() => {
    loadItemsForSubtest(selectedSubtestId);
  }, [selectedSubtestId]);

  useEffect(() => {
    loadImages();
  }, [selectedTestId, selectedSubtestId]);

  useEffect(() => () => {
    Object.values(imageUrls).forEach(URL.revokeObjectURL);
  }, [imageUrls]);

  const uploadImage = async () => {
    if (!selectedItem?.id || !file) {
      setError("Seleccione prueba, subtest, número de pregunta y una imagen.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen excede 25MB. Redúzcala antes de subirla.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const uploaded = await adminService.uploadItemImage(selectedItem.id, {
        file,
        role,
        altText: altText.trim() || undefined,
      });
      setFile(null);
      await loadImages();
      setSuccess(`Imagen guardada: imageId ${uploaded.id}, resourceId ${uploaded.resourceId}.`);
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: number | string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await adminService.deleteItemImage(imageId);
      await loadImages();
      setSuccess("Imagen eliminada correctamente.");
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const uploadDisabledReason = loading
    ? "Espere a que termine la operación actual."
    : !selectedItem?.id
      ? "Seleccione una pregunta existente para habilitar la subida."
      : !file
        ? "Seleccione una imagen PNG, JPG o WebP para habilitar la subida."
        : "";

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader><CardTitle>Cargar imágenes confidenciales</CardTitle><CardDescription>Archivos categorizados por prueba, subtest y número de pregunta.</CardDescription></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="mb-4 bg-emerald-50 border-emerald-100 text-emerald-800"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><AlertDescription>{success}</AlertDescription></Alert>}
          <label className="block rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/30">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="mt-2 font-medium">{file ? file.name : "Arrastra o haz clic para subir"}</div>
            <div className="text-xs text-muted-foreground">PNG, JPG o WebP hasta 25MB.</div>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                if (selected && selected.size > MAX_IMAGE_BYTES) {
                  setFile(null);
                  setError("La imagen excede 25MB. Redúzcala antes de subirla.");
                  e.target.value = "";
                  return;
                }
                setError("");
                setSuccess("");
                setFile(selected);
              }}
            />
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {images.length === 0 ? (
              <div className="col-span-full rounded border border-dashed p-6 text-center text-sm text-muted-foreground">Sin imágenes para el filtro seleccionado.</div>
            ) : images.map((image) => (
              <div key={image.id} className="rounded border p-2">
                <img src={imageUrls[String(image.id)]} alt={image.altText || "Recurso de ítem"} className="aspect-square w-full object-contain bg-muted rounded" />
                <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
                  <div className="text-xs min-w-0">
                    <div className="font-mono truncate">imageId {image.id}</div>
                    <div className="text-muted-foreground truncate">P{image.itemOrder || image.itemId} · {image.role}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteImage(image.id)} disabled={loading}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Clasificación</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Prueba">
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger><SelectValue placeholder="Seleccione prueba" /></SelectTrigger>
              <SelectContent>
                {tests.map((test) => <SelectItem key={test.id} value={String(test.id)}>{test.codigoTest || test.code} · {test.nombreTest || test.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Versión">
            <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
              <SelectTrigger><SelectValue placeholder="Seleccione versión" /></SelectTrigger>
              <SelectContent>
                {versions.map((version) => <SelectItem key={version.id} value={String(version.id)}>v{version.numeroVersion} · {version.estado}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subtest">
            <Select value={selectedSubtestId} onValueChange={setSelectedSubtestId}>
              <SelectTrigger><SelectValue placeholder="Seleccione subtest" /></SelectTrigger>
              <SelectContent>
                {subtests.map((subtest) => <SelectItem key={subtest.id} value={String(subtest.id)}>{subtest.nombreSubtest || subtest.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número de pregunta">
            <Select value={questionNumber} onValueChange={setQuestionNumber}>
              <SelectTrigger><SelectValue placeholder="Seleccione pregunta" /></SelectTrigger>
              <SelectContent>
                {items.map((item) => <SelectItem key={item.id} value={String(item.order || item.numeroOrden)}>{item.order || item.numeroOrden}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Rol en ítem"><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MODELO">Modelo</SelectItem><SelectItem value="OPCION">Opción</SelectItem><SelectItem value="REFERENCIA">Referencia</SelectItem></SelectContent></Select></Field>
          <Field label="Texto alternativo interno"><Textarea rows={2} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="No visible al participante" /></Field>
          <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
            {selectedItem?.id ? `La imagen se asociará internamente al ítem ${selectedItem.id}; en pantalla se conserva como pregunta ${questionNumber}.` : "Seleccione una pregunta para asociar la imagen."}
          </div>
          <Button className="w-full" onClick={uploadImage} disabled={Boolean(uploadDisabledReason)} title={uploadDisabledReason || "Sube la imagen a Supabase y guarda metadatos en PostgreSQL."}>Subir y guardar</Button>
          {uploadDisabledReason && (
            <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
              {uploadDisabledReason}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- Review Tray ------------------------- */
export function ReviewTrayScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      setReviews(await adminService.listPendingReviews());
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar revisiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const resolve = async (reviewId: number | string, approved: boolean) => {
    setLoading(true);
    setError("");
    try {
      await adminService.resolveManualReview(reviewId, { score: approved ? 1 : 0, comment, approved });
      setComment("");
      await loadReviews();
    } catch (err: any) {
      setError(err.message || "No se pudo guardar la revisión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle>Bandeja de revisión manual</CardTitle><CardDescription>Respuestas abiertas que requieren calificación humana.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        <Textarea placeholder="Comentario de revisión" value={comment} onChange={(e) => setComment(e.target.value)} />
        {reviews.length === 0 ? (
          <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sin respuestas pendientes.
          </div>
        ) : reviews.map((review) => (
          <div key={review.reviewId} className="rounded border p-4">
            <div className="text-xs text-muted-foreground">Respuesta #{review.answerId} · Intento {review.attemptId}</div>
            <div className="mt-1 text-sm">{review.answerText || "Respuesta sin texto."}</div>
            <div className="mt-3 flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => resolve(review.reviewId, false)} disabled={loading}><XCircle className="h-4 w-4 mr-1" /> Incorrecta</Button>
              <Button size="sm" onClick={() => resolve(review.reviewId, true)} disabled={loading}><CheckCircle2 className="h-4 w-4 mr-1" /> Correcta</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------- Individual Results ------------------------- */
export function ResultsScreen() {
  const [attemptId, setAttemptId] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadResult = async () => {
    if (!attemptId.trim()) {
      setError("Ingrese un ID de intento para consultar el resultado real.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      setResult(await adminService.getAttemptResult(attemptId.trim()));
    } catch (err: any) {
      setResult(null);
      setError(err.message || "No se pudo consultar el resultado.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const csv = toCsv((result.dimensions || []).map((d: any) => ({
      attemptId: result.attemptId,
      resultId: result.resultId,
      status: result.status,
      totalScore: result.totalScore,
      dimension: d.name,
      directScore: d.directScore,
      percentile: d.percentile,
      category: d.category,
      interpretation: d.interpretation,
    })));
    downloadDataFile(`resultado-intento-${result.attemptId}.csv`, "text/csv;charset=utf-8", csv);
  };

  const exportPdf = async () => {
    if (!result) return;
    setLoading(true);
    setError("");
    try {
      await adminService.exportReport({ type: "individualResult", format: "PDF", attemptId: result.attemptId });
    } catch (err: any) {
      setError(err.message || "No se pudo generar PDF.");
    } finally {
      setLoading(false);
    }
  };

  const sendResult = async () => {
    if (!result) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const sent = await adminService.sendAttemptResult(result.attemptId);
      setNotice(`Notificación encolada: ${sent.fileName}`);
    } catch (err: any) {
      setError(err.message || "No se pudo enviar el resultado.");
    } finally {
      setLoading(false);
    }
  };

  const chartRows = (result?.dimensions || []).map((d: any) => ({
    name: d.name,
    score: Number(d.directScore || 0),
  }));

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2">
            <div className="text-xl font-semibold text-primary">Consulta de resultado por intento</div>
            <div className="text-sm text-muted-foreground">El backend expone resultados individuales por `attemptId`.</div>
            <div className="flex gap-2 max-w-md">
              <Input value={attemptId} onChange={(e) => setAttemptId(e.target.value)} placeholder="ID de intento" />
              <Button onClick={loadResult} disabled={loading}>{loading ? "Consultando..." : "Consultar"}</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!result}><FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar CSV</Button>
            <Button variant="outline" onClick={exportPdf} disabled={!result || loading}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
            <Button onClick={sendResult} disabled={!result || loading}><Send className="h-4 w-4 mr-1" /> Enviar</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>{notice}</AlertDescription></Alert>}

      {!result ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-sm text-muted-foreground">Consulte un intento para ver datos reales.</CardContent></Card>
      ) : (
        <>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Puntaje directo total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-semibold text-primary">{result.totalScore ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Estado: {result.status}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Puntaje por dimensión</CardTitle></CardHeader>
          <CardContent className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="score" fill="#0f2649" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Identificadores</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm font-mono">Intento: {result.attemptId}</div>
            <div className="text-sm font-mono mt-1">Resultado: {result.resultId}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Detalle por subtest</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Subtest</TableHead><TableHead>Correctas</TableHead><TableHead>Incorrectas</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Distribución</TableHead></TableRow></TableHeader>
            <TableBody>
              {(result.dimensions || []).map((d: any) => (
                <TableRow key={d.dimensionId}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{d.directScore}</Badge></TableCell>
                  <TableCell>{d.percentile ?? "—"}</TableCell>
                  <TableCell>{d.category || "—"}</TableCell>
                  <TableCell colSpan={2}>{d.interpretation || "Sin interpretacion registrada."}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}

/* ------------------------- Results Dashboard ------------------------- */
export function ResultsDashboardScreen() {
  const sessions = useAdminStore((s) => s.sessions);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const [sessionId, setSessionId] = useState("");
  const [summary, setSummary] = useState<any | null>(null);
  const [averages, setAverages] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!sessionId && sessions[0]?.id) {
      setSessionId(sessions[0].id);
    }
  }, [sessions.length, sessionId]);

  const applyFilters = async () => {
    if (!sessionId) {
      setError("Seleccione una sesión para consultar resultados agregados reales.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [summaryData, averageData] = await Promise.all([
        adminService.getSessionSummary(sessionId),
        adminService.getDimensionAverages(sessionId),
      ]);
      setSummary(summaryData);
      setAverages(averageData);
    } catch (err: any) {
      setError(err.message || "No se pudieron consultar resultados agregados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) applyFilters();
  }, [sessionId]);

  const bySub = averages.map((row) => ({
    sub: row.name,
    media: row.suppressedByPrivacyThreshold ? 0 : Number(row.averageDirectScore || 0),
    count: row.count,
  }));

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <Field label="Sesión">
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Seleccione sesión" /></SelectTrigger>
              <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grupo"><Input className="w-32" value="No expuesto" disabled /></Field>
          <Field label="Carrera"><Input className="w-40" value="No expuesto" disabled /></Field>
          <Field label="Edad"><Input className="w-28" value="No expuesto" disabled /></Field>
          <Field label="Sexo"><Input className="w-28" value="No expuesto" disabled /></Field>
          <Field label="Subtest"><Input className="w-40" value="Todas dimensiones" disabled /></Field>
          <div className="ml-auto flex gap-2"><Button variant="outline" onClick={applyFilters} disabled={loading || !sessionId}><Filter className="h-4 w-4 mr-1" /> {loading ? "Aplicando..." : "Aplicar"}</Button></div>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Asignados</div><div className="text-2xl font-semibold">{summary.assignedCount}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Iniciados</div><div className="text-2xl font-semibold">{summary.startedCount}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Completados</div><div className="text-2xl font-semibold">{summary.completedCount}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Calificados</div><div className="text-2xl font-semibold">{summary.scoredCount}</div></CardContent></Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Media por subtest</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySub.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded">Sin resultados calificados.</div> : <ResponsiveContainer><BarChart data={bySub}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="sub" /><YAxis /><Tooltip /><Bar dataKey="media" fill="#0f2649" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Privacidad estadística</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            El backend suprime promedios por dimensión cuando el grupo tiene menos de 5 resultados.
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Filtros demográficos</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            Deshabilitados: la API agregada disponible solo filtra por sesión.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------- Reports Center ------------------------- */
export function ReportsScreen() {
  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");
  const reports = [
    { key: "participants", name: "Participantes", desc: "Listado real de participantes registrados.", icon: Users },
    { key: "sessions", name: "Sesiones", desc: "Sesiones reales con estado y programación.", icon: Activity },
    { key: "registeredReports", name: "Reportes registrados", desc: "Bitácora de reportes generados en backend.", icon: FileText },
    { key: "audit", name: "Auditoría", desc: "Eventos reales registrados en la auditoría.", icon: ShieldCheck },
  ];

  const downloadReport = async (key: string, format: "PDF" | "XLSX" | "CSV") => {
    setLoadingKey(key);
    setError("");
    try {
      await adminService.exportReport({ type: key, format });
    } catch (err: any) {
      setError(err.message || `No se pudo generar ${format}.`);
    } finally {
      setLoadingKey("");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    <div className="grid md:grid-cols-2 gap-4">
      {reports.map((r) => (
        <Card key={r.name} className="border-0 shadow-sm">
          <CardContent className="p-5 flex gap-4 items-start">
            <div className="h-12 w-12 rounded bg-accent text-primary flex items-center justify-center"><r.icon className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.desc}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadReport(r.key, "PDF")} disabled={!!loadingKey}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => downloadReport(r.key, "XLSX")} disabled={!!loadingKey}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                <Button size="sm" variant="outline" onClick={() => downloadReport(r.key, "CSV")} disabled={!!loadingKey}><Download className="h-4 w-4 mr-1" /> {loadingKey === r.key ? "Generando..." : "CSV"}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    </div>
  );
}

/* ------------------------- Audit ------------------------- */
export function AuditScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    setError("");
    try {
      setEvents(await adminService.listAudit(entity && entityId ? { entity, entityId } : undefined));
    } catch (err: any) {
      setError(err.message || "No se pudo cargar auditoría.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div><CardTitle>Auditoría</CardTitle><CardDescription>Registro inmutable de acciones del sistema.</CardDescription></div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Entidad" className="w-32" value={entity} onChange={(e) => setEntity(e.target.value)} />
          <Input placeholder="ID entidad" className="w-32" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          <Input type="date" className="w-40" disabled title="El backend no expone filtro por fecha." />
          <Input placeholder="IP" className="w-32" disabled title="El backend no expone filtro por IP." />
          <Button variant="outline" onClick={loadAudit} disabled={loading}><Filter className="h-4 w-4 mr-1" /> {loading ? "Filtrando..." : "Filtrar"}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin eventos de auditoría.</TableCell></TableRow>
            ) : events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.creadoEn}</TableCell>
                <TableCell>{e.usuarioId || "Sistema"}</TableCell>
                <TableCell><Badge variant="secondary">{e.accion}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{e.entidad}:{e.entidadId || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{e.direccionIp || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Users & Roles ------------------------- */
export function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", fullName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [userRows, roleRows, permissionRows] = await Promise.all([
        adminService.listUsers(),
        adminService.listRoles(),
        adminService.listPermissions(),
      ]);
      setUsers(userRows);
      setRoles(roleRows);
      setPermissions(permissionRows);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar usuarios y permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    if (!form.username || !form.email || !form.fullName || !form.password) {
      setError("Usuario, correo, nombre y contraseña son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await adminService.createUser(form);
      setOpen(false);
      setForm({ username: "", email: "", fullName: "", password: "" });
      await load();
    } catch (err: any) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: any) => {
    setLoading(true);
    setError("");
    try {
      await adminService.setUserStatus(user.id, user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO");
      await load();
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar el estado del usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Usuarios</CardTitle><CardDescription>Personal interno con acceso al sistema.</CardDescription></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo usuario</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle><DialogDescription>Se crea en PostgreSQL con estado ACTIVO.</DialogDescription></DialogHeader>
              <div className="grid gap-3">
                <Field label="Usuario"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                <Field label="Correo"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Nombre completo"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
                <Field label="Contraseña inicial"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={createUser} disabled={loading}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent text-primary text-xs">{(u.fullName || u.username).split(" ").map((x: string) => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                      <span className="text-sm font-medium">{u.fullName || u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">Roles no expuestos en UserDto</Badge></TableCell>
                  <TableCell>{u.status === "ACTIVO" ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">activo</Badge> : <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">inactivo</Badge>}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => toggleStatus(u)} disabled={loading}>{u.status === "ACTIVO" ? "Desactivar" : "Activar"}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Matriz de permisos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div key={role.id}>
              <div className="text-sm font-medium">{role.nombreRol || role.name || role.codigoRol || `Rol ${role.id}`}</div>
              <div className="mt-1 text-xs text-muted-foreground">{permissions.length} permisos disponibles en backend.</div>
              <Button size="sm" variant="outline" className="mt-2" asChild><Link to="/app/roles">Editar permisos</Link></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function RolesScreen() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminService.listRoles(), adminService.listPermissions()])
      .then(([roleRows, permissionRows]) => {
        setRoles(roleRows);
        setPermissions(permissionRows);
        setSelectedRoleId(roleRows[0]?.id || null);
      })
      .catch((err) => setError(err.message || "No se pudieron cargar roles."));
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    setLoading(true);
    setError("");
    adminService.listRolePermissionIds(selectedRoleId)
      .then((ids) => setSelectedPermissionIds(ids.map(Number)))
      .catch((err) => setError(err.message || "No se pudieron cargar permisos del rol."))
      .finally(() => setLoading(false));
  }, [selectedRoleId]);

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((current) => checked
      ? Array.from(new Set([...current, permissionId]))
      : current.filter((id) => id !== permissionId));
  };

  const savePermissions = async () => {
    if (!selectedRoleId) return;
    setLoading(true);
    setError("");
    try {
      await adminService.replaceRolePermissions(selectedRoleId, selectedPermissionIds);
      setSelectedPermissionIds((await adminService.listRolePermissionIds(selectedRoleId)).map(Number));
    } catch (err: any) {
      setError(err.message || "No se pudieron guardar permisos.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Roles y permisos</CardTitle>
        <CardDescription>Selección granular persistida en backend.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <div className="space-y-2">
            {roles.map((role) => (
              <button key={role.id} type="button" onClick={() => setSelectedRoleId(role.id)} className={`w-full rounded border p-3 text-left hover:bg-muted ${selectedRoleId === role.id ? "border-primary bg-accent/30" : ""}`}>
                <div className="font-semibold">{role.nombreRol || role.name || role.codigoRol || `Rol ${role.id}`}</div>
                <div className="text-xs text-muted-foreground mt-1">{role.descripcion || "Sin descripción"}</div>
              </button>
            ))}
          </div>
          <div className="rounded border p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="font-semibold">{selectedRole ? (selectedRole.nombreRol || selectedRole.name || `Rol ${selectedRole.id}`) : "Seleccione un rol"}</div>
                <div className="text-xs text-muted-foreground">{selectedPermissionIds.length} permisos seleccionados</div>
              </div>
              <Button size="sm" onClick={savePermissions} disabled={!selectedRoleId || loading}>Guardar permisos</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-2 max-h-[520px] overflow-auto pr-1">
              {permissions.map((permission) => {
                const permissionId = Number(permission.id);
                const checked = selectedPermissionIds.includes(permissionId);
                return (
                  <label key={permission.id} className="flex items-start gap-2 rounded border p-2 text-sm hover:bg-muted/40">
                    <Checkbox checked={checked} onCheckedChange={(value) => togglePermission(permissionId, Boolean(value))} />
                    <span>
                      <span className="block font-mono text-xs">{permission.codigo || permission.code || permission.codigoPermiso || `PERM_${permission.id}`}</span>
                      <span className="block text-xs text-muted-foreground">{permission.descripcion || "Sin descripción"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
