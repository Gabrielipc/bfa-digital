import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Pause, XCircle, FileWarning, MessageSquare, Users, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";
import { Progress } from "../../app/components/ui/progress";
import { Avatar, AvatarFallback } from "../../app/components/ui/avatar";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { Label } from "../../app/components/ui/label";
import { Textarea } from "../../app/components/ui/textarea";

export const Route = createFileRoute("/app/sesiones/$id")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { id } = useParams({ from: "/app/sesiones/$id" });
  const navigate = useNavigate();

  // Acceder al store global
  const session = useAdminStore((s) => s.sessions.find(x => x.id === id));
  const assignments = useAdminStore(useShallow((s) => s.assignments[id] || []));
  const incidences = useAdminStore(useShallow((s) => s.incidences.filter(x => x.sessionId === id)));
  
  const updateSessionStatus = useAdminStore((s) => s.updateSessionStatus);
  const addIncidence = useAdminStore((s) => s.addIncidence);
  
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const fetchAssignments = useAdminStore((s) => s.fetchAssignments);

  // Estados locales para la toma de incidencias
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedPartName, setSelectedPartName] = useState("");
  const [isIncidenceDialogOpen, setIsIncidenceDialogOpen] = useState(false);
  const [incidenceText, setIncidenceText] = useState("");
  const [actionError, setActionError] = useState("");

  // Polling para traer sesiones y asignaciones reales del backend
  useEffect(() => {
    fetchSessions();
    fetchAssignments(id);

    const intervalId = setInterval(() => {
      fetchSessions();
      fetchAssignments(id);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [id]);

  if (!session) {
    return (
      <div className="space-y-6 text-center py-10">
        <h2 className="text-xl font-bold text-destructive">Error: Sesión no encontrada</h2>
        <Button onClick={() => navigate({ to: "/app/sesiones" })}>Volver a sesiones</Button>
      </div>
    );
  }

  // Métricas
  const totalCount = assignments.length;
  const inProgressCount = assignments.filter(a => a.state === "en-progreso").length;
  const completedCount = assignments.filter(a => a.state === "completado").length;
  const issueCount = assignments.filter(a => a.state === "interrumpido").length;
  const idleCount = assignments.filter(a => a.state === "no-iniciado").length;

  const handleOpenIncidence = (partId: string, name: string) => {
    setSelectedPartId(partId);
    setSelectedPartName(name);
    setIncidenceText("");
    setIsIncidenceDialogOpen(true);
  };

  const handleSaveIncidence = async () => {
    if (!selectedPartId || !incidenceText.trim()) return;
    try {
      setActionError("");
      await addIncidence(id, selectedPartId, incidenceText.trim());
      setIsIncidenceDialogOpen(false);
      setSelectedPartId(null);
      setSelectedPartName("");
      setIncidenceText("");
    } catch (err: any) {
      setActionError(err.message || "No se pudo registrar la incidencia.");
    }
  };

  const getSubtestBadgeText = (subId: string) => {
    switch (subId) {
      case "figuras": return "Figuras idénticas";
      case "desplazamiento": return "Desplazamiento";
      case "espacial": return "Espacial";
      default: return subId;
    }
  };

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "ACTIVA":
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">En Curso (En Vivo)</Badge>;
      case "PAUSADA":
        return <Badge className="bg-amber-100 text-amber-800 border-none font-semibold">Pausada</Badge>;
      case "FINALIZADA":
        return <Badge className="bg-muted text-muted-foreground border-none font-semibold">Finalizada</Badge>;
      case "PLANIFICADA":
        return <Badge className="bg-slate-100 text-slate-700 border-none font-semibold">Planificada</Badge>;
    }
  };

  const getStateBadge = (state: SessionAssignment["state"]) => {
    switch (state) {
      case "no-iniciado":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-medium">No iniciado</Badge>;
      case "en-progreso":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-medium animate-pulse">En progreso</Badge>;
      case "completado":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium">Completado</Badge>;
      case "interrumpido":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-medium"><AlertTriangle className="h-3 w-3 mr-1" /> Desconectado</Badge>;
      case "anulado":
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none font-medium">Anulado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <Button variant="outline" size="sm" asChild className="h-9">
          <Link to="/app/sesiones">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a sesiones
          </Link>
        </Button>
        
        <div className="flex items-center gap-3">
          {session.status === "PLANIFICADA" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => updateSessionStatus(id, "ACTIVA")}>
              <Play className="h-4 w-4 mr-1" /> Iniciar Sesión
            </Button>
          )}
          {session.status === "ACTIVA" && (
            <Button variant="outline" size="sm" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 h-9" onClick={() => updateSessionStatus(id, "PAUSADA")}>
              <Pause className="h-4 w-4 mr-1" /> Pausar Sesión
            </Button>
          )}
          {session.status === "PAUSADA" && (
            <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 h-9" onClick={() => updateSessionStatus(id, "ACTIVA")}>
              <Play className="h-4 w-4 mr-1" /> Reanudar Sesión
            </Button>
          )}
          {(session.status === "ACTIVA" || session.status === "PAUSADA") && (
            <Button variant="destructive" size="sm" className="h-9" onClick={() => {
              if (confirm("¿Estás seguro de cerrar la sesión? Esto revocará los tokens de acceso no utilizados.")) {
                updateSessionStatus(id, "FINALIZADA");
              }
            }}>
              <XCircle className="h-4 w-4 mr-1" /> Cerrar Sesión
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {actionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0"><Users className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Asignados</div>
              <div className="text-2xl font-bold text-primary">{totalCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Play className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">En Curso</div>
              <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completados</div>
              <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Caídos</div>
              <div className="text-2xl font-bold text-amber-700">{issueCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0"><HelpCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">En Espera</div>
              <div className="text-2xl font-bold text-slate-700">{idleCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitor Header with Live simulation Toggle */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-lg text-primary font-bold">{session.name}</CardTitle>
              {getStatusBadge(session.status)}
            </div>
            <CardDescription className="text-xs mt-1">
              Supervisión en vivo de los participantes y estado de los reactivos.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" size="sm" asChild className="h-9">
              <Link to={`/app/sesiones/${id}/asignaciones`}>
                Asignaciones & Tokens
              </Link>
            </Button>
          </div>
        </CardHeader>

        {/* Group Progress table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-semibold py-3">Participante</TableHead>
                <TableHead className="font-semibold py-3">Subtest actual</TableHead>
                <TableHead className="font-semibold py-3">Progreso del Intento</TableHead>
                <TableHead className="font-semibold py-3">Estado</TableHead>
                <TableHead className="font-semibold py-3">Última actividad</TableHead>
                <TableHead className="w-40 text-right pr-6 py-3">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Ningún participante asignado a esta sesión.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((asg) => (
                  <TableRow key={asg.participantId} className="hover:bg-muted/5 transition">
                    <TableCell className="pl-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                            {(asg.participantName || "Participante").split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-semibold text-foreground leading-snug">{asg.participantName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground font-medium">{asg.participantId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-sm font-medium text-muted-foreground capitalize">
                      {getSubtestBadgeText(asg.currentSubtestId)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Progress value={asg.overallProgress} className="w-28 h-1.5" />
                        <span className="text-xs font-semibold text-muted-foreground">{asg.overallProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      {getStateBadge(asg.state)}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-muted-foreground font-medium">
                      {asg.lastActivity}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => handleOpenIncidence(asg.participantId, asg.participantName)}
                          disabled={asg.state === "completado" || asg.state === "anulado"}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Nota
                        </Button>
                        {asg.state === "completado" && (
                          asg.attemptId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs hover:bg-primary/5 hover:text-primary"
                              asChild
                            >
                              <Link to={`/app/resultados/individual/${asg.attemptId}`}>
                                Ver reporte
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" disabled title="El backend no reporto attemptId para esta asignacion completada.">
                              Sin attemptId
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incidences / logs section */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base text-primary font-bold flex items-center gap-2">
            <FileWarning className="h-4.5 w-4.5 text-amber-600" /> Registro de Incidencias / Notas de Supervisión
          </CardTitle>
          <CardDescription className="text-xs">
            Bitácora oficial de eventos fuera de lo común ocurridos durante la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {incidences.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
              No se han registrado incidencias en esta sesión.
            </div>
          ) : (
            <div className="space-y-3.5">
              {incidences.map((inc) => (
                <div key={inc.id} className="flex gap-3 text-xs leading-relaxed p-3 rounded-lg border bg-[#fafafa]">
                  <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 h-fit font-bold">{inc.timestamp}</span>
                  <div>
                    <span className="font-semibold text-primary">{inc.participantName} ({inc.participantId})</span>:{" "}
                    <span className="text-muted-foreground font-medium">{inc.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* dialog to write incidence */}
      <Dialog open={isIncidenceDialogOpen} onOpenChange={setIsIncidenceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nota de Supervisión</DialogTitle>
            <DialogDescription>
              Escriba una incidencia o nota sobre la evaluación de <strong>{selectedPartName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="incidence-text" className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Comentario / Observación</Label>
            <Textarea 
              id="incidence-text"
              rows={3} 
              placeholder="Describa la observación. Ejemplo: 'Sufrió una breve interrupción de red', 'Reporta fatiga visual'."
              value={incidenceText}
              onChange={(e) => setIncidenceText(e.target.value)}
              className="resize-none focus-visible:ring-primary/30"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidenceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveIncidence} disabled={!incidenceText.trim()}>Guardar Observación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
