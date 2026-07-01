import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAdminStore, SessionAssignment } from "../../store/adminStore";
import { resultsService, AttemptResultDTO } from "../../api/resultsService";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { Badge } from "../../app/components/ui/badge";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";

export const Route = createFileRoute("/app/calificaciones")({
  component: AttemptScoringRoute,
});

type ResultState =
  | { status: "unknown" }
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; result: AttemptResultDTO; requiresManualReview?: boolean; pendingReviewCount?: number };

function AttemptScoringRoute() {
  const sessions = useAdminStore((s) => s.sessions);
  const assignmentsBySession = useAdminStore((s) => s.assignments);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const fetchAssignments = useAdminStore((s) => s.fetchAssignments);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [resultsByAttempt, setResultsByAttempt] = useState<Record<number, ResultState>>({});
  const [scoringAttemptId, setScoringAttemptId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchAssignments(selectedSessionId);
    }
  }, [fetchAssignments, selectedSessionId]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const assignments = assignmentsBySession[selectedSessionId] || [];
  const attempts = useMemo(
    () => assignments.filter((assignment) => assignment.attemptId),
    [assignments],
  );

  useEffect(() => {
    const completedAttempts = attempts.filter(
      (assignment) =>
        assignment.attemptId &&
        assignment.state === "completado" &&
        !resultsByAttempt[assignment.attemptId],
    );

    completedAttempts.forEach((assignment) => {
      const attemptId = assignment.attemptId as number;
      setResultsByAttempt((current) => ({ ...current, [attemptId]: { status: "loading" } }));
      resultsService
        .getAttemptResult(attemptId)
        .then((result) => {
          setResultsByAttempt((current) => ({ ...current, [attemptId]: { status: "ready", result } }));
        })
        .catch((error: any) => {
          const status = error?.response?.status;
          setResultsByAttempt((current) => ({
            ...current,
            [attemptId]:
              status === 404 || status === 400
                ? { status: "missing" }
                : { status: "error", message: readApiError(error, "No se pudo consultar el resultado.") },
          }));
        });
    });
  }, [attempts, resultsByAttempt]);

  const stats = {
    total: attempts.length,
    completed: attempts.filter((assignment) => assignment.state === "completado").length,
    scored: attempts.filter((assignment) => {
      const attemptId = assignment.attemptId as number | undefined;
      return attemptId ? resultsByAttempt[attemptId]?.status === "ready" : false;
    }).length,
  };
  const pending = stats.completed - stats.scored;

  const handleRefresh = () => {
    if (selectedSessionId) {
      setResultsByAttempt({});
      fetchAssignments(selectedSessionId);
    }
  };

  const handleScore = async (assignment: SessionAssignment) => {
    if (!assignment.attemptId) return;
    try {
      setActionError("");
      setScoringAttemptId(assignment.attemptId);
      const scoreResult = await resultsService.scoreAttempt(assignment.attemptId);
      const result = await resultsService.getAttemptResult(assignment.attemptId);
      setResultsByAttempt((current) => ({
        ...current,
        [assignment.attemptId as number]: {
          status: "ready",
          result,
          requiresManualReview: scoreResult.requiereRevisionManual,
          pendingReviewCount: scoreResult.cantidadPendientesRevision,
        },
      }));
    } catch (error: any) {
      setActionError(readApiError(error, "No se pudo calificar el intento."));
    } finally {
      setScoringAttemptId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-primary">Calificacion de intentos</h2>
          <p className="text-xs text-muted-foreground">
            Ejecucion manual de calificacion para intentos completados con estrategia soportada por backend.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={!selectedSessionId}>
          <RefreshCw className="mr-1 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-primary">Seleccionar sesion</CardTitle>
            <CardDescription>
              La lista usa las sesiones y asignaciones reales del monitor administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una sesion" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name} ({session.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSession && (
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <SessionStat label="Intentos" value={stats.total} />
                <SessionStat label="Completados" value={stats.completed} />
                <SessionStat label="Pendientes" value={Math.max(pending, 0)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-primary">Motor disponible</CardTitle>
            <CardDescription>Alcance implementado actualmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              CLAVE_SIMPLE con clave oficial por item
            </div>
            <p>
              El boton Calificar solo se ofrece para intentos completados sin resultado. Si el backend rechaza una
              estrategia no soportada, se muestra su error sin simular calificacion.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base text-primary">Intentos de participantes</CardTitle>
          <CardDescription>
            Primero se consulta si ya existe resultado; luego se habilita la accion real del backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Participante</TableHead>
                <TableHead>Intento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right pr-6">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedSessionId ? (
                <EmptyRow text="Seleccione una sesion para ver intentos." />
              ) : attempts.length === 0 ? (
                <EmptyRow text="Esta sesion no tiene intentos creados todavia." />
              ) : (
                attempts.map((assignment) => {
                  const attemptId = assignment.attemptId as number;
                  const resultState = resultsByAttempt[attemptId] || { status: "unknown" as const };
                  const canScore = assignment.state === "completado" && resultState.status === "missing";
                  return (
                    <TableRow key={`${assignment.assignmentId}-${attemptId}`}>
                      <TableCell className="pl-6">
                        <div className="font-medium">{assignment.participantName}</div>
                        <div className="text-xs font-mono text-muted-foreground">{assignment.participantId}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{attemptId}</TableCell>
                      <TableCell>{renderAttemptState(assignment.state)}</TableCell>
                      <TableCell>{renderResultState(resultState)}</TableCell>
                      <TableCell className="pr-6 text-right">
                        {resultState.status === "ready" ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/resultados/individual/${resultState.result.resultId}`}>
                              <Eye className="mr-1 h-4 w-4" /> Ver resultado
                            </Link>
                          </Button>
                        ) : canScore ? (
                          <Button size="sm" onClick={() => handleScore(assignment)} disabled={scoringAttemptId === attemptId}>
                            {scoringAttemptId === attemptId ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="mr-1 h-4 w-4" />
                            )}
                            Calificar
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            No disponible
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}

function renderAttemptState(state: SessionAssignment["state"]) {
  if (state === "completado") {
    return <Badge className="border-none bg-emerald-100 text-emerald-800">Completado</Badge>;
  }
  if (state === "en-progreso") {
    return <Badge className="border-none bg-blue-100 text-blue-800">En progreso</Badge>;
  }
  if (state === "interrumpido") {
    return <Badge className="border-none bg-amber-100 text-amber-800">Interrumpido</Badge>;
  }
  if (state === "anulado") {
    return <Badge className="border-none bg-rose-100 text-rose-800">Anulado</Badge>;
  }
  return <Badge className="border-none bg-slate-100 text-slate-700">No iniciado</Badge>;
}

function renderResultState(resultState: ResultState) {
  if (resultState.status === "ready") {
    const needsReview = resultState.requiresManualReview || resultState.result.status !== "CALCULADO";
    return (
      <div className="space-y-1">
        <Badge className={needsReview ? "border-none bg-amber-100 text-amber-800" : "border-none bg-emerald-100 text-emerald-800"}>
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {needsReview ? "Revision manual" : resultState.result.status}
        </Badge>
        <div className="text-xs text-muted-foreground">
          {resultState.result.totalScore} pts
          {resultState.pendingReviewCount ? ` - ${resultState.pendingReviewCount} pendientes` : ""}
        </div>
      </div>
    );
  }
  if (resultState.status === "loading") {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Consultando
      </span>
    );
  }
  if (resultState.status === "missing") {
    return <Badge className="border-none bg-slate-100 text-slate-700">Sin resultado</Badge>;
  }
  if (resultState.status === "error") {
    return <span className="text-xs text-destructive">{resultState.message}</span>;
  }
  return <span className="text-xs text-muted-foreground">Pendiente de consulta</span>;
}

function readApiError(error: any, fallback: string) {
  return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || fallback;
}
