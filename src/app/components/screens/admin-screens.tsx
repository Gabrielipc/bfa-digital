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
    const newCode = `SES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
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

  const handleOpenDialog = () => {
    // Generar código autoincrementable sugerido
    const nextNum = list.length + 185;
    setCode(`P-0${nextNum}`);
    setName("");
    setAge("21");
    setSex("F");
    setCarrera("Psicología");
    setGrupo("3A");
    setOpen(true);
  };

  const handleSaveParticipant = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }

    const parts = name.trim().split(" ");
    const firstNames = parts[0] || "";
    const lastNames = parts.slice(1).join(" ") || "S/A";

    addParticipant({
      code,
      firstNames,
      lastNames
    }).catch(err => {
      alert("Error al registrar participante: " + err.message);
    });

    setOpen(false);
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
export function InstrumentsScreen() {
  const versions = [
    { v: "v2.1", status: "publicada", date: "2026-05-10" },
    { v: "v2.0", status: "histórica", date: "2025-11-20" },
    { v: "v2.2", status: "borrador", date: "2026-06-01" },
  ];
  return (
    <div className="space-y-4">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Versiones publicadas bloqueadas</AlertTitle>
        <AlertDescription>Las versiones publicadas no pueden modificarse. Para realizar cambios, cree una nueva versión.</AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>BFA</CardTitle><CardDescription>Batería de Funciones Atencionales</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {versions.map((v) => (
              <button key={v.v} className="w-full flex items-center justify-between p-2 rounded border hover:bg-muted text-left">
                <div>
                  <div className="font-medium text-sm">{v.v}</div>
                  <div className="text-xs text-muted-foreground">{v.date}</div>
                </div>
                {v.status === "publicada" ? <Badge><Lock className="h-3 w-3 mr-1" /> publicada</Badge>
                  : v.status === "borrador" ? <Badge variant="secondary"><Unlock className="h-3 w-3 mr-1" /> borrador</Badge>
                  : <Badge variant="outline">histórica</Badge>}
              </button>
            ))}
            <Button variant="outline" className="w-full mt-2" size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva versión</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>v2.2 · Borrador</CardTitle><CardDescription>Edición de subtests, ítems y claves</CardDescription></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> Vista previa</Button>
              <Button size="sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Publicar versión</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="figuras">
              <TabsList>
                <TabsTrigger value="figuras">Figuras idénticas</TabsTrigger>
                <TabsTrigger value="desplazamiento">Desplazamiento</TabsTrigger>
                <TabsTrigger value="espacial">Espacial</TabsTrigger>
              </TabsList>
              <TabsContent value="figuras" className="space-y-3 mt-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <Field label="Tiempo límite (min)"><Input type="number" defaultValue="8" /></Field>
                  <Field label="Total ítems"><Input type="number" defaultValue="30" /></Field>
                  <Field label="Puntaje por ítem"><Input type="number" defaultValue="1" /></Field>
                </div>
                <Separator />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead><TableHead>Enunciado</TableHead><TableHead>Tipo</TableHead><TableHead>Opciones</TableHead><TableHead>Clave</TableHead><TableHead>Puntaje</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell>{i}</TableCell>
                        <TableCell className="max-w-xs truncate">Seleccione la figura idéntica al modelo</TableCell>
                        <TableCell><Badge variant="secondary">imagen</Badge></TableCell>
                        <TableCell>A · B · C · D</TableCell>
                        <TableCell><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><KeyRound className="h-3 w-3 mr-1" /> confidencial</Badge></TableCell>
                        <TableCell>1</TableCell>
                        <TableCell><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar ítem</Button>
              </TabsContent>
              <TabsContent value="desplazamiento" className="text-sm text-muted-foreground mt-4">Estructura equivalente para subtest Desplazamiento.</TabsContent>
              <TabsContent value="espacial" className="text-sm text-muted-foreground mt-4">Estructura equivalente para subtest Espacial.</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------- Image Upload ------------------------- */
export function ImageUploadScreen() {
  const items = [
    { id: 1, name: "fig-modelo-001.png", sub: "Figuras idénticas", size: "82 KB" },
    { id: 2, name: "fig-opcion-001a.png", sub: "Figuras idénticas", size: "44 KB" },
    { id: 3, name: "espacial-rot-003.png", sub: "Espacial", size: "98 KB" },
  ];
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader><CardTitle>Cargar imágenes confidenciales</CardTitle><CardDescription>Las imágenes se cifran y no se mostrarán al participante con opción de descarga.</CardDescription></CardHeader>
        <CardContent>
          <label className="block rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/50">
            <Upload className="h-8 w-8 mx-auto text-primary" />
            <div className="mt-2 font-medium">Arrastra o haz clic para subir</div>
            <div className="text-xs text-muted-foreground">PNG, JPG hasta 2MB. Resolución mínima 600×600.</div>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {items.map((it) => (
              <div key={it.id} className="rounded border p-2">
                <div className="aspect-square rounded bg-muted flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                <div className="text-xs mt-2 truncate font-mono">{it.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-[10px]">{it.sub}</Badge>
                  <span className="text-[10px] text-muted-foreground">{it.size}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Metadatos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Subtest"><Select defaultValue="fig"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fig">Figuras idénticas</SelectItem><SelectItem value="des">Desplazamiento</SelectItem><SelectItem value="esp">Espacial</SelectItem></SelectContent></Select></Field>
          <Field label="Ítem #"><Input type="number" placeholder="001" /></Field>
          <Field label="Rol en ítem"><Select defaultValue="modelo"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="modelo">Modelo</SelectItem><SelectItem value="opc">Opción</SelectItem></SelectContent></Select></Field>
          <Field label="Texto alternativo (interno)"><Textarea rows={2} placeholder="No visible al participante" /></Field>
          <div className="flex items-center gap-2"><Switch defaultChecked id="lock" /><Label htmlFor="lock" className="text-sm">Bloquear descarga visible</Label></div>
          <Button className="w-full">Guardar metadatos</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- Review Tray ------------------------- */
export function ReviewTrayScreen() {
  const items = [
    { id: "R-0011", p: "Ana M. Pérez", sub: "Espacial", item: "12", ans: "Cuadrado rotado 90° hacia la izquierda", state: "pendiente" },
    { id: "R-0012", p: "Luis García", sub: "Desplazamiento", item: "8", ans: "La figura se mueve dos casillas", state: "pendiente" },
    { id: "R-0013", p: "Sofía Núñez", sub: "Figuras idénticas", item: "21", ans: "No estoy seguro", state: "marcado" },
  ];
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle>Bandeja de revisión manual</CardTitle><CardDescription>Respuestas abiertas que requieren calificación humana.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="rounded border p-4 grid md:grid-cols-[1fr_auto] gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Hash className="h-3 w-3" />{r.id} · {r.p} · {r.sub} · ítem {r.item}</div>
              <div className="mt-2 text-sm bg-muted/50 rounded p-3 italic">"{r.ans}"</div>
            </div>
            <div className="flex md:flex-col gap-2 items-start md:items-end">
              <Badge variant={r.state === "pendiente" ? "secondary" : "outline"}>{r.state}</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"><XCircle className="h-4 w-4 mr-1" /> Incorrecta</Button>
                <Button size="sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Correcta</Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------- Individual Results ------------------------- */
export function ResultsScreen() {
  const subs = [
    { name: "Figuras idénticas", total: 30, ok: 24, ko: 6 },
    { name: "Desplazamiento", total: 24, ok: 18, ko: 6 },
    { name: "Espacial", total: 20, ok: 15, ko: 5 },
  ];
  const totalOk = subs.reduce((a, s) => a + s.ok, 0);
  const totalKo = subs.reduce((a, s) => a + s.ko, 0);
  const total = totalOk + totalKo;
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-accent text-primary">AP</AvatarFallback></Avatar>
            <div>
              <div className="text-xl font-semibold text-primary">Ana M. Pérez</div>
              <div className="text-sm text-muted-foreground">P-0184 · Psicología 3A · 21 años · F</div>
              <div className="text-xs text-muted-foreground mt-1">Sesión SES-2026-06-A · Finalizada el 2026-06-03 14:42</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><FileText className="h-4 w-4 mr-1" /> Exportar PDF</Button>
            <Button><Send className="h-4 w-4 mr-1" /> Enviar al participante</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Puntaje directo total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-semibold text-primary">{totalOk}<span className="text-muted-foreground text-xl">/{total}</span></div>
            <Progress className="mt-3" value={(totalOk / total) * 100} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Correctas vs Incorrectas</CardTitle></CardHeader>
          <CardContent className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ n: "Correctas", v: totalOk }, { n: "Incorrectas", v: totalKo }]} dataKey="v" nameKey="n" innerRadius={30} outerRadius={55}>
                  <Cell fill="#0f2649" /><Cell fill="#b91c1c" />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Tiempo total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-semibold text-primary">18:24</div>
            <div className="text-sm text-muted-foreground mt-1">3 subtests aplicados</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Detalle por subtest</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Subtest</TableHead><TableHead>Correctas</TableHead><TableHead>Incorrectas</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Distribución</TableHead></TableRow></TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{s.ok}</Badge></TableCell>
                  <TableCell><Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">{s.ko}</Badge></TableCell>
                  <TableCell>{s.total}</TableCell>
                  <TableCell>{Math.round((s.ok / s.total) * 100)}%</TableCell>
                  <TableCell><div className="w-40"><Progress value={(s.ok / s.total) * 100} /></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- Results Dashboard ------------------------- */
export function ResultsDashboardScreen() {
  const bySub = [
    { sub: "Figuras", media: 24.3 }, { sub: "Desplazamiento", media: 17.5 }, { sub: "Espacial", media: 14.1 },
  ];
  const byAge = Array.from({ length: 8 }, (_, i) => ({ age: 18 + i, m: 50 + Math.round(Math.random() * 30) }));
  const bySex = [{ n: "F", v: 312 }, { n: "M", v: 248 }, { n: "Otro", v: 14 }];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <Field label="Sesión"><Select defaultValue="a"><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Todas</SelectItem><SelectItem value="b">SES-2026-06-A</SelectItem></SelectContent></Select></Field>
          <Field label="Grupo"><Select defaultValue="a"><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Todos</SelectItem></SelectContent></Select></Field>
          <Field label="Carrera"><Select defaultValue="a"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Todas</SelectItem></SelectContent></Select></Field>
          <Field label="Edad"><Input className="w-28" placeholder="18–25" /></Field>
          <Field label="Sexo"><Select defaultValue="a"><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Todos</SelectItem></SelectContent></Select></Field>
          <Field label="Subtest"><Select defaultValue="a"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Todos</SelectItem></SelectContent></Select></Field>
          <div className="ml-auto flex gap-2"><Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Aplicar</Button></div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Media por subtest</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={bySub}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="sub" /><YAxis /><Tooltip /><Bar dataKey="media" fill="#0f2649" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Tendencia por edad</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={byAge}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" /><YAxis /><Tooltip /><Line type="monotone" dataKey="m" stroke="#b91c1c" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Distribución por sexo</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={bySex} dataKey="v" nameKey="n" outerRadius={80}>{bySex.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Legend /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------- Reports Center ------------------------- */
export function ReportsScreen() {
  const reports = [
    { name: "Resultados individuales", desc: "Detalle por participante con puntajes y subtests.", icon: FileText },
    { name: "Resultados agregados", desc: "Resumen estadístico filtrable por grupo y carrera.", icon: FileBarChart },
    { name: "Auditoría de sesiones", desc: "Eventos por sesión: inicio, fin, interrupciones.", icon: ShieldCheck },
    { name: "Inventario de instrumentos", desc: "Versiones publicadas y subtests activos.", icon: ClipboardList },
  ];
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
                <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm" variant="outline"><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> CSV</Button>
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
  const events = [
    { d: "2026-06-03 14:42", u: "lic.martinez", a: "Finalizó intento", e: "intento_test:9821", ip: "190.124.10.4" },
    { d: "2026-06-03 14:21", u: "dra.hernandez", a: "Generó tokens", e: "sesion:SES-2026-06-A", ip: "190.124.10.4" },
    { d: "2026-06-03 13:55", u: "admin", a: "Publicó versión", e: "test:BFA v2.1", ip: "192.168.1.20" },
    { d: "2026-06-03 13:10", u: "consultor1", a: "Exportó reporte", e: "reporte:agregado", ip: "190.124.10.9" },
  ];
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
            {events.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{e.d}</TableCell>
                <TableCell>{e.u}</TableCell>
                <TableCell><Badge variant="secondary">{e.a}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{e.e}</TableCell>
                <TableCell className="font-mono text-xs">{e.ip}</TableCell>
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
  const users = [
    { n: "Dra. L. Hernández", e: "lhernandez@uam.edu.ni", r: "Psicólogo", s: true },
    { n: "Lic. J. Martínez", e: "jmartinez@uam.edu.ni", r: "Aplicador", s: true },
    { n: "Carlos Ruiz", e: "cruiz@uam.edu.ni", r: "Consultor", s: false },
    { n: "Admin UAM", e: "admin@uam.edu.ni", r: "Administrador", s: true },
  ];
  const perms = [
    { k: "Aplicar tests", roles: ["Aplicador", "Psicólogo", "Administrador"] },
    { k: "Configurar instrumentos", roles: ["Psicólogo", "Administrador"] },
    { k: "Ver resultados", roles: ["Psicólogo", "Consultor", "Administrador"] },
    { k: "Gestionar usuarios", roles: ["Administrador"] },
    { k: "Acceder a auditoría", roles: ["Administrador"] },
  ];
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Usuarios</CardTitle><CardDescription>Personal interno con acceso al sistema.</CardDescription></div>
          <Button><Plus className="h-4 w-4 mr-1" /> Nuevo usuario</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.e}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent text-primary text-xs">{u.n.split(" ").map((x) => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                      <span className="text-sm font-medium">{u.n}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.e}</TableCell>
                  <TableCell><Badge variant="secondary">{u.r}</Badge></TableCell>
                  <TableCell>{u.s ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">activo</Badge> : <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">inactivo</Badge>}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
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
              <div className="mt-1 flex flex-wrap gap-1">{p.roles.map((r) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
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
